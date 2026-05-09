import json
import re
import time
import uuid
from pathlib import Path

import structlog
from pydantic import ValidationError

from app.config import settings
from app.schemas.analyze import (
    AnalyzeLLMOutput,
    AnalyzeRequest,
    AnalyzeResponse,
    AnalyzeSentence,
    AnalyzeVocabulary,
)
from app.services.llm import LLMClient, LLMMessage, LLMResult
from app.services.llm import LLMTruncatedOutputError

log = structlog.get_logger()


class AnalyzeParseError(ValueError):
    """
    阅读分析 JSON 解析失败。
    """


class AnalyzerService:
    """
    阅读分析服务。

    负责 Prompt 构造、LLM 调用、JSON 容错解析和响应 schema 转换。
    路由层不直接碰 DashScope，也不直接解析模型字符串。
    """

    def __init__(self, llm_client: LLMClient) -> None:
        """
        Args:
            llm_client: LLM 客户端抽象，便于测试时注入 fake client。
        """

        self._llm_client = llm_client

    async def analyze(self, request: AnalyzeRequest) -> AnalyzeResponse:
        """
        对英文段落做非流式阅读分析。

        Args:
            request: 阅读分析请求。

        Returns:
            AnalyzeResponse: 可直接给前端渲染的完整分析结果。

        Raises:
            AnalyzeParseError: 当模型输出无法解析为合法 schema。
            LLMError: 当底层模型调用失败。
        """

        start = time.perf_counter()
        try:
            parsed, llm_result = await self._run_analysis_attempt(request, fallback_compact=False)
        except (AnalyzeParseError, LLMTruncatedOutputError) as first_error:
            log.warning(
                "analyze_fallback_retry",
                reason=type(first_error).__name__,
                text_len=len(request.text),
            )
            try:
                parsed, llm_result = await self._run_analysis_attempt(request, fallback_compact=True)
            except (AnalyzeParseError, LLMTruncatedOutputError) as fallback_error:
                raise fallback_error from first_error
        duration_ms = int((time.perf_counter() - start) * 1000)
        word_count = len(re.findall(r"\b[\w'-]+\b", request.text))

        return AnalyzeResponse(
            article_id=f"analysis_{uuid.uuid4().hex}",
            title=parsed.title,
            difficulty=parsed.difficulty,
            word_count=word_count,
            original_text=request.text,
            translation=parsed.translation,
            core_vocabulary=[
                AnalyzeVocabulary(
                    id=f"vocab_{uuid.uuid4().hex}",
                    word=item.word,
                    phonetic=item.phonetic,
                    translation=item.translation,
                    example_en=item.example_en,
                    example_zh=item.example_zh,
                )
                for item in parsed.core_vocabulary
            ],
            long_sentences=[
                AnalyzeSentence(
                    id=f"sentence_{uuid.uuid4().hex}",
                    english=item.english,
                    chinese=item.chinese,
                    analysis=item.analysis,
                )
                for item in parsed.long_sentences
            ],
            tokens_used=llm_result.prompt_tokens + llm_result.completion_tokens,
            duration_ms=duration_ms,
            analysis_model=settings.model_name,
        )

    async def _run_analysis_attempt(
        self,
        request: AnalyzeRequest,
        *,
        fallback_compact: bool,
    ) -> tuple[AnalyzeLLMOutput, LLMResult]:
        """
        执行一次模型分析尝试，并完成结构化解析与业务兜底校验。
        """

        messages = self._build_messages(request, fallback_compact=fallback_compact)
        llm_result = await self._llm_client.complete(messages, temperature=0.1 if fallback_compact else None)
        parsed = self.parse_model_json(llm_result.content)
        self._validate_translation_completeness(parsed, request.text)
        self._validate_against_source(parsed, request.text)
        return parsed, llm_result

    @staticmethod
    def parse_model_json(raw: str) -> AnalyzeLLMOutput:
        """
        解析模型返回的 JSON 文本。

        Args:
            raw: 模型原始输出。

        Returns:
            AnalyzeLLMOutput: 校验后的模型输出。

        Raises:
            AnalyzeParseError: 当输出不是合法 JSON 或缺少必要字段。
        """

        cleaned = raw.strip()
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
        cleaned = re.sub(r",\s*([}\]])", r"\1", cleaned)

        try:
            data = json.loads(cleaned)
        except json.JSONDecodeError as exc:
            raise AnalyzeParseError("模型返回不是合法 JSON") from exc

        try:
            return AnalyzeLLMOutput.model_validate(data)
        except ValidationError as exc:
            raise AnalyzeParseError("模型返回 JSON 结构不符合约定") from exc

    def _build_messages(self, request: AnalyzeRequest, *, fallback_compact: bool = False) -> list[LLMMessage]:
        """
        构造阅读分析 Prompt 消息。

        Args:
            request: 阅读分析请求。

        Returns:
            list[LLMMessage]: system + user 两段消息。
        """

        prompts_dir = Path(__file__).resolve().parents[1] / "prompts"
        system_prompt = (prompts_dir / "analyze_system.md").read_text(encoding="utf-8")
        user_template = (prompts_dir / "analyze_user.tmpl").read_text(encoding="utf-8")
        difficulty_hint = request.hint_difficulty.value if request.hint_difficulty else "未指定，请你判断"
        user_prompt = user_template.replace(
            "{{ generation_mode_json }}",
            self._to_prompt_json("fallback_compact" if fallback_compact else "standard"),
        ).replace(
            "{{ difficulty_hint_json }}",
            self._to_prompt_json(difficulty_hint),
        ).replace(
            "{{ text_json }}",
            self._to_prompt_json(request.text),
        )
        return [
            LLMMessage(role="system", content=system_prompt),
            LLMMessage(role="user", content=user_prompt),
        ]

    @staticmethod
    def _to_prompt_json(value: str) -> str:
        """
        将非可信输入编码成 JSON 字符串，避免原文内容突破任务边界。
        """

        return json.dumps(value, ensure_ascii=False).replace("</", "<\\/")

    @staticmethod
    def _normalize_source_fragment(value: str) -> str:
        """
        归一化原文片段，用于校验模型没有另造英文例句。
        """

        return re.sub(r"\s+", " ", value).strip().casefold()

    @staticmethod
    def _split_paragraphs(value: str) -> list[str]:
        """
        按空行切分段落，用于校验译文是否保留了原文的段落层次。
        """

        return [item.strip() for item in re.split(r"\n\s*\n+", value.strip()) if item.strip()]

    @classmethod
    def _validate_translation_completeness(cls, parsed: AnalyzeLLMOutput, source_text: str) -> None:
        """
        拦截明显过短或丢失段落层次的译文，避免半截模型输出进入前端展示。
        """

        source_word_count = len(re.findall(r"\b[\w'-]+\b", source_text))
        compact_translation = re.sub(r"\s+", "", parsed.translation)
        if source_word_count >= 80 and len(compact_translation) < source_word_count * 0.7:
            raise AnalyzeParseError("模型返回的译文疑似不完整")

        source_paragraphs = cls._split_paragraphs(source_text)
        translation_paragraphs = cls._split_paragraphs(parsed.translation)
        if len(source_paragraphs) >= 2 and len(translation_paragraphs) < 2:
            raise AnalyzeParseError("模型返回的译文没有保留原文段落")

    @classmethod
    def _validate_against_source(cls, parsed: AnalyzeLLMOutput, source_text: str) -> None:
        """
        校验模型返回的英文例句和长难句都来自用户原文。
        """

        normalized_source = cls._normalize_source_fragment(source_text)
        for item in parsed.core_vocabulary:
            normalized_example = cls._normalize_source_fragment(item.example_en)
            normalized_word = cls._normalize_source_fragment(item.word)
            if normalized_example not in normalized_source:
                raise AnalyzeParseError("模型返回的词汇例句不在原文中")
            if normalized_word not in normalized_example:
                raise AnalyzeParseError("模型返回的核心词不在例句中")
        for item in parsed.long_sentences:
            if cls._normalize_source_fragment(item.english) not in normalized_source:
                raise AnalyzeParseError("模型返回的长难句不在原文中")
