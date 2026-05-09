import uuid
from datetime import datetime, timezone

from sqlalchemy import CheckConstraint, Index
from sqlmodel import Field, SQLModel


class Article(SQLModel, table=True):
    """
    文章表。

    同时保存用户粘贴分析的 custom 文章和阅读拓展 extension 文章。阅读拓展文章
    必须保留真实来源字段，方便前端详情页展示 attribution。
    """

    __tablename__ = "articles"
    __table_args__ = (
        CheckConstraint("source_type IN ('custom', 'extension')", name="ck_articles_source_type"),
        CheckConstraint("difficulty IN ('CET4', 'CET6', 'IELTS')", name="ck_articles_difficulty"),
        Index("idx_articles_user_collected", "user_id", "is_collected", "created_at"),
        Index("idx_articles_source_difficulty", "source_type", "difficulty"),
    )

    id: str = Field(default_factory=lambda: uuid.uuid4().hex, primary_key=True)
    user_id: int = Field(foreign_key="users.id", ondelete="CASCADE", index=True)
    source_type: str = Field(index=True)
    title: str
    content: str
    translated_content: str
    difficulty: str = Field(index=True)
    word_count: int = Field(default=0, ge=0)
    is_collected: bool = Field(default=False, index=True)
    tokens_used: int = Field(default=0, ge=0)

    source_name: str | None = None
    source_url: str | None = Field(default=None, index=True, unique=True)
    source_license: str | None = None
    attribution_text: str | None = None
    published_at: datetime | None = None
    fetched_at: datetime | None = None
    analysis_model: str | None = None
    analysis_prompt_version: str | None = None

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), index=True)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class LongSentence(SQLModel, table=True):
    """
    长难句解析表。
    """

    __tablename__ = "long_sentences"
    __table_args__ = (Index("idx_long_sentences_article_seq", "article_id", "seq"),)

    id: str = Field(default_factory=lambda: uuid.uuid4().hex, primary_key=True)
    article_id: str = Field(foreign_key="articles.id", ondelete="CASCADE", index=True)
    english: str
    chinese: str
    analysis: str
    seq: int = Field(default=0, ge=0)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
