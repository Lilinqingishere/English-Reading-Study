import re
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.base import CamelModel

MARKUP_RE = re.compile(r"</?[a-z][\w:-]*(?:\s[^<>]*)?>", re.IGNORECASE)


def reject_llm_markup(value: str) -> str:
    """
    拦截模型字段中不应出现的 Markdown 代码块和 HTML 标签。
    """

    stripped = value.strip()
    if "```" in stripped or MARKUP_RE.search(stripped):
        raise ValueError("模型输出不能包含 Markdown 代码块或 HTML 标签")
    return stripped


class Difficulty(StrEnum):
    """
    阅读难度枚举。
    """

    CET4 = "CET4"
    CET6 = "CET6"
    IELTS = "IELTS"


class AnalyzeRequest(CamelModel):
    """
    阅读分析请求。

    Attributes:
        text: 待分析英文段落，前后端统一限制 1 到 8000 字符。
        hint_difficulty: 用户可选难度提示，不传时由模型判断。
    """

    text: str = Field(..., min_length=1, max_length=8000, description="待分析英文段落")
    hint_difficulty: Difficulty | None = Field(default=None, description="可选难度提示")

    @field_validator("text")
    @classmethod
    def strip_and_validate_text(cls, value: str) -> str:
        """
        清理并校验待分析文本。
        """

        stripped = value.strip()
        if not stripped:
            raise ValueError("待分析文本不能为空")
        return stripped


class AnalyzeVocabulary(CamelModel):
    """
    阅读分析返回的核心词汇。
    """

    id: str
    word: str
    phonetic: str
    translation: str
    example_en: str
    example_zh: str


class AnalyzeSentence(CamelModel):
    """
    阅读分析返回的长难句。
    """

    id: str
    english: str
    chinese: str
    analysis: str


class AnalyzeResponse(CamelModel):
    """
    阅读分析完整响应。

    Attributes:
        article_id: 后续收藏全文时使用的文章 ID。S2 落地文章表前先返回稳定占位 ID。
        title: AI 对原文生成的一句话标题。
        difficulty: AI 判断或用户提示的阅读难度。
        word_count: 原文词数。
        original_text: 用户提交的英文原文。
        translation: 中文译文。
        core_vocabulary: 核心词汇列表。
        long_sentences: 长难句列表。
        tokens_used: 模型消耗 token 数。
        duration_ms: 后端分析耗时毫秒数。
        analysis_model: 实际使用的模型名。
    """

    article_id: str
    title: str
    difficulty: Difficulty
    word_count: int
    original_text: str
    translation: str
    core_vocabulary: list[AnalyzeVocabulary]
    long_sentences: list[AnalyzeSentence]
    tokens_used: int
    duration_ms: int
    analysis_model: str


class AnalyzeMetaEvent(CamelModel):
    """
    阅读分析 SSE 元信息事件。
    """

    article_id: str
    title: str
    difficulty: Difficulty
    word_count: int
    analysis_model: str


class AnalyzeTranslationEvent(CamelModel):
    """
    阅读分析 SSE 译文事件。
    """

    translation: str


class AnalyzeDoneEvent(CamelModel):
    """
    阅读分析 SSE 完成事件。
    """

    article_id: str
    tokens_used: int
    duration_ms: int


class AnalyzeLLMVocabulary(BaseModel):
    """
    模型返回的核心词汇结构。
    """

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    word: str = Field(..., min_length=1)
    phonetic: str = ""
    translation: str = Field(..., min_length=1)
    example_en: str = Field(..., min_length=1)
    example_zh: str = Field(..., min_length=1)

    @field_validator("word", "phonetic", "translation", "example_en", "example_zh")
    @classmethod
    def reject_markup(cls, value: str) -> str:
        """
        拦截模型在词汇字段里夹带的展示标记。
        """

        return reject_llm_markup(value)


class AnalyzeLLMSentence(BaseModel):
    """
    模型返回的长难句结构。
    """

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    english: str = Field(..., min_length=1)
    chinese: str = Field(..., min_length=1)
    analysis: str = Field(..., min_length=1)

    @field_validator("english", "chinese", "analysis")
    @classmethod
    def reject_markup(cls, value: str) -> str:
        """
        拦截模型在长难句字段里夹带的展示标记。
        """

        return reject_llm_markup(value)


class AnalyzeLLMOutput(BaseModel):
    """
    模型原始 JSON 输出结构。
    """

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    title: str = Field(..., min_length=1, max_length=30)
    difficulty: Difficulty
    translation: str = Field(..., min_length=1)
    core_vocabulary: list[AnalyzeLLMVocabulary] = Field(..., max_length=10)
    long_sentences: list[AnalyzeLLMSentence] = Field(..., max_length=3)

    @field_validator("title", "translation")
    @classmethod
    def reject_markup(cls, value: str) -> str:
        """
        拦截模型在顶层文本字段里夹带的展示标记。
        """

        return reject_llm_markup(value)

    @field_validator("core_vocabulary")
    @classmethod
    def reject_duplicate_words(cls, value: list[AnalyzeLLMVocabulary]) -> list[AnalyzeLLMVocabulary]:
        """
        拦截同一个核心词的重复输出，避免前端和生词本出现重复候选项。
        """

        seen: set[str] = set()
        for item in value:
            key = item.word.casefold()
            if key in seen:
                raise ValueError("核心词汇不能重复")
            seen.add(key)
        return value
