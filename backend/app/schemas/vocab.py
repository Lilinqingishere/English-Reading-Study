from datetime import datetime

from pydantic import Field, field_validator

from app.schemas.base import CamelModel


class VocabCreate(CamelModel):
    """
    加入生词本请求。
    """

    word: str = Field(..., min_length=1, max_length=80)
    phonetic: str | None = Field(default=None, max_length=120)
    translation: str = Field(..., min_length=1, max_length=500)
    example_en: str | None = Field(default=None, max_length=1000)
    example_zh: str | None = Field(default=None, max_length=1000)
    source_article_id: str | None = None

    @field_validator("word", "translation")
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        """
        清理并校验必填文本。
        """

        stripped = value.strip()
        if not stripped:
            raise ValueError("必填文本不能为空")
        return stripped

    @field_validator("phonetic", "example_en", "example_zh", "source_article_id")
    @classmethod
    def strip_optional_text(cls, value: str | None) -> str | None:
        """
        清理可选文本。
        """

        if value is None:
            return None
        stripped = value.strip()
        return stripped or None


class VocabResponse(CamelModel):
    """
    生词本响应。
    """

    id: str
    word: str
    phonetic: str | None
    translation: str
    example_en: str | None
    example_zh: str | None
    source_article_id: str | None
    is_collected: bool
    review_count: int
    lapses: int
    stability: float
    difficulty: float
    fsrs_state: str
    last_rating: str | None
    last_review_at: datetime | None
    next_review_at: datetime | None
    created_at: datetime
    updated_at: datetime
