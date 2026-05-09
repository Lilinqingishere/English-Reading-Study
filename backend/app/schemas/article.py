from datetime import datetime

from pydantic import Field

from app.schemas.analyze import AnalyzeSentence, AnalyzeVocabulary, Difficulty
from app.schemas.base import CamelModel


class ArticleCollectRequest(CamelModel):
    """
    收藏状态更新请求。
    """

    is_collected: bool = Field(default=True, description="是否收藏文章")


class ArticleResponse(CamelModel):
    """
    文章列表响应。
    """

    id: str
    title: str
    original_text: str
    translation: str
    difficulty: Difficulty
    word_count: int
    is_collected: bool
    source_type: str
    source_name: str | None
    source_url: str | None
    source_license: str | None
    attribution_text: str | None
    published_at: datetime | None
    created_at: datetime
    analysis_model: str | None


class ArticleDetailResponse(ArticleResponse):
    """
    文章详情响应。
    """

    core_vocabulary: list[AnalyzeVocabulary]
    long_sentences: list[AnalyzeSentence]
