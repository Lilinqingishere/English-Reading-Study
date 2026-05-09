import asyncio
import time
from dataclasses import dataclass
from typing import Protocol

import dashscope
import structlog
from pydantic import BaseModel

from app.config import settings

log = structlog.get_logger()


class LLMError(Exception):
    """
    LLM 调用基异常。
    """


class LLMConfigurationError(LLMError):
    """
    LLM 配置错误，例如缺少 API Key。
    """


class LLMHTTPError(LLMError):
    """
    LLM HTTP 层错误。
    """

    def __init__(self, status_code: int, message: str, code: str | None = None) -> None:
        """
        Args:
            status_code: DashScope 返回的状态码。
            message: DashScope 返回的错误信息。
            code: DashScope 返回的错误码。
        """

        super().__init__(message)
        self.status_code = status_code
        self.code = code


class LLMAccessDeniedError(LLMHTTPError):
    """
    LLM 权限错误。
    """


class LLMTimeoutError(LLMError):
    """
    LLM 调用超时错误。
    """


class LLMTruncatedOutputError(LLMError):
    """
    LLM 输出被 token 上限截断。
    """


class LLMMessage(BaseModel):
    """
    LLM 消息。
    """

    role: str
    content: str


class LLMResult(BaseModel):
    """
    LLM 完整响应。
    """

    content: str
    prompt_tokens: int
    completion_tokens: int
    duration_ms: int


class LLMClient(Protocol):
    """
    LLM 客户端抽象。
    """

    async def complete(self, messages: list[LLMMessage], *, temperature: float | None = None) -> LLMResult:
        """
        获取非流式 LLM 响应。
        """


@dataclass(slots=True)
class DashScopeClient:
    """
    DashScope qwen 客户端。

    DashScope Python SDK 当前主要是同步接口，因此在 async 路由链路中用
    asyncio.to_thread 包一层，避免阻塞 FastAPI 事件循环。
    """

    model_name: str = settings.model_name

    async def complete(self, messages: list[LLMMessage], *, temperature: float | None = None) -> LLMResult:
        """
        调用 DashScope 非流式接口。

        Args:
            messages: system/user/assistant 消息列表。
            temperature: 可选采样温度。

        Returns:
            LLMResult: 模型文本与 token 统计。

        Raises:
            LLMConfigurationError: 当缺少 DASHSCOPE_API_KEY。
            LLMHTTPError: 当 DashScope 返回非 200 状态。
        """

        if not settings.dashscope_api_key:
            raise LLMConfigurationError("DASHSCOPE_API_KEY 未配置")

        last_error: LLMError | None = None
        for attempt in range(settings.model_max_retries + 1):
            try:
                return await asyncio.wait_for(
                    asyncio.to_thread(self._complete_sync, messages, temperature),
                    timeout=settings.model_timeout_s,
                )
            except TimeoutError as exc:
                last_error = LLMTimeoutError("模型调用超时")
                log.warning("llm_timeout", attempt=attempt, timeout_s=settings.model_timeout_s)
                if attempt == settings.model_max_retries:
                    raise last_error from exc
            except LLMHTTPError as exc:
                last_error = exc
                if not self._is_retryable_status(exc.status_code) or attempt == settings.model_max_retries:
                    raise
                log.warning("llm_retry", attempt=attempt, status_code=exc.status_code)

            # 指数退避能避免模型服务短暂限流时，多个请求马上同时重试。
            await asyncio.sleep(0.5 * (2**attempt))

        raise last_error or LLMError("模型调用失败")

    @staticmethod
    def _is_retryable_status(status_code: int) -> bool:
        """
        判断 DashScope 状态码是否适合重试。

        Args:
            status_code: DashScope 返回状态码。

        Returns:
            bool: True 表示可重试。
        """

        return status_code == 429 or status_code >= 500

    def _complete_sync(self, messages: list[LLMMessage], temperature: float | None) -> LLMResult:
        """
        在线程池中执行同步 SDK 调用。

        Args:
            messages: LLM 消息列表。
            temperature: 可选采样温度。

        Returns:
            LLMResult: 模型文本与 token 统计。
        """

        start = time.perf_counter()
        response = dashscope.Generation.call(
            api_key=settings.dashscope_api_key,
            model=self.model_name,
            messages=[message.model_dump() for message in messages],
            result_format="message",
            temperature=temperature or settings.model_temperature,
            max_tokens=settings.model_max_tokens,
        )

        duration_ms = int((time.perf_counter() - start) * 1000)
        status_code = getattr(response, "status_code", 500)
        if status_code != 200:
            message = getattr(response, "message", "模型服务暂不可用")
            code = getattr(response, "code", None)
            log.warning("llm_http_error", status_code=status_code, code=code, duration_ms=duration_ms)
            if status_code in {401, 403}:
                raise LLMAccessDeniedError(status_code=status_code, message=message, code=code)
            raise LLMHTTPError(status_code=status_code, message=message, code=code)

        usage = getattr(response, "usage", None)
        choice = response.output.choices[0]
        output = choice.message.content
        finish_reason = getattr(choice, "finish_reason", None)
        prompt_tokens = int(getattr(usage, "input_tokens", 0) or 0)
        completion_tokens = int(getattr(usage, "output_tokens", 0) or 0)
        if finish_reason in {"length", "max_tokens", "token_limit"}:
            log.warning(
                "llm_output_truncated",
                model=self.model_name,
                finish_reason=finish_reason,
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                max_tokens=settings.model_max_tokens,
                duration_ms=duration_ms,
            )
            raise LLMTruncatedOutputError("模型输出被 token 上限截断")

        log.info(
            "llm_call",
            status="ok",
            model=self.model_name,
            finish_reason=finish_reason,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            duration_ms=duration_ms,
        )
        return LLMResult(
            content=output,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            duration_ms=duration_ms,
        )
