import asyncio
import time

import pytest

from app.config import settings
from app.services.llm import DashScopeClient, LLMHTTPError, LLMMessage, LLMResult
from app.services.llm import LLMTimeoutError, LLMTruncatedOutputError


def test_dashscope_client_retries_retryable_http_error(monkeypatch: pytest.MonkeyPatch) -> None:
    """
    验证 5xx 错误会按配置重试并最终成功。
    """

    calls = {"count": 0}
    monkeypatch.setattr(settings, "dashscope_api_key", "test-key")
    monkeypatch.setattr(settings, "model_max_retries", 1)

    def fake_complete_sync(self: DashScopeClient, messages: list[LLMMessage], temperature: float | None) -> LLMResult:
        calls["count"] += 1
        if calls["count"] == 1:
            raise LLMHTTPError(status_code=500, message="temporary")
        return LLMResult(content="ok", prompt_tokens=1, completion_tokens=1, duration_ms=1)

    monkeypatch.setattr(DashScopeClient, "_complete_sync", fake_complete_sync)

    result = asyncio.run(DashScopeClient().complete([LLMMessage(role="user", content="hello")]))

    assert result.content == "ok"
    assert calls["count"] == 2


def test_dashscope_client_does_not_retry_non_retryable_http_error(monkeypatch: pytest.MonkeyPatch) -> None:
    """
    验证 4xx 非权限类业务错误不会盲目重试。
    """

    calls = {"count": 0}
    monkeypatch.setattr(settings, "dashscope_api_key", "test-key")
    monkeypatch.setattr(settings, "model_max_retries", 2)

    def fake_complete_sync(self: DashScopeClient, messages: list[LLMMessage], temperature: float | None) -> LLMResult:
        calls["count"] += 1
        raise LLMHTTPError(status_code=400, message="bad request")

    monkeypatch.setattr(DashScopeClient, "_complete_sync", fake_complete_sync)

    with pytest.raises(LLMHTTPError):
        asyncio.run(DashScopeClient().complete([LLMMessage(role="user", content="hello")]))

    assert calls["count"] == 1


def test_dashscope_client_timeout(monkeypatch: pytest.MonkeyPatch) -> None:
    """
    验证模型调用超时会被映射为 LLMTimeoutError。
    """

    monkeypatch.setattr(settings, "dashscope_api_key", "test-key")
    monkeypatch.setattr(settings, "model_max_retries", 0)
    monkeypatch.setattr(settings, "model_timeout_s", 0.01)

    def fake_complete_sync(self: DashScopeClient, messages: list[LLMMessage], temperature: float | None) -> LLMResult:
        time.sleep(0.05)
        return LLMResult(content="too late", prompt_tokens=1, completion_tokens=1, duration_ms=50)

    monkeypatch.setattr(DashScopeClient, "_complete_sync", fake_complete_sync)

    with pytest.raises(LLMTimeoutError):
        asyncio.run(DashScopeClient().complete([LLMMessage(role="user", content="hello")]))


def test_dashscope_client_raises_when_output_is_truncated(monkeypatch: pytest.MonkeyPatch) -> None:
    """
    验证 DashScope 因 token 上限截断输出时，不会把半截 JSON 继续交给业务层。
    """

    class FakeUsage:
        input_tokens = 10
        output_tokens = 4096

    class FakeMessage:
        content = '{"translation":"half'

    class FakeChoice:
        message = FakeMessage()
        finish_reason = "length"

    class FakeOutput:
        choices = [FakeChoice()]

    class FakeResponse:
        status_code = 200
        usage = FakeUsage()
        output = FakeOutput()

    monkeypatch.setattr(settings, "dashscope_api_key", "test-key")
    monkeypatch.setattr("app.services.llm.dashscope.Generation.call", lambda **kwargs: FakeResponse())

    with pytest.raises(LLMTruncatedOutputError):
        asyncio.run(DashScopeClient().complete([LLMMessage(role="user", content="hello")]))
