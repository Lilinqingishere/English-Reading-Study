import uuid
from datetime import datetime, timezone

from sqlalchemy import CheckConstraint, Index
from sqlmodel import Field, SQLModel, UniqueConstraint


class Vocabulary(SQLModel, table=True):
    """
    生词表。

    `is_collected` 用作软删除标记。这样用户移出生词本后，复习历史仍然保留，
    以后重新加入同一个词时也不用丢失 FSRS 状态。
    """

    __tablename__ = "vocabularies"
    __table_args__ = (
        UniqueConstraint("user_id", "word", name="uq_vocab_user_word"),
        CheckConstraint("fsrs_state IN ('new', 'learning', 'review', 'relearning')", name="ck_vocab_fsrs_state"),
        CheckConstraint(
            "last_rating IS NULL OR last_rating IN ('again', 'hard', 'good', 'easy')",
            name="ck_vocab_last_rating",
        ),
        Index("idx_vocab_user_next_review", "user_id", "is_collected", "next_review_at"),
        Index("idx_vocab_user_created", "user_id", "created_at"),
    )

    id: str = Field(default_factory=lambda: uuid.uuid4().hex, primary_key=True)
    user_id: int = Field(foreign_key="users.id", ondelete="CASCADE", index=True)
    word: str = Field(index=True)
    phonetic: str | None = None
    translation: str
    example_en: str | None = None
    example_zh: str | None = None
    source_article_id: str | None = Field(default=None, foreign_key="articles.id", ondelete="SET NULL", index=True)
    is_collected: bool = Field(default=True, index=True)

    review_count: int = Field(default=0, ge=0)
    lapses: int = Field(default=0, ge=0)
    stability: float = Field(default=0.0, ge=0.0)
    difficulty: float = Field(default=0.0, ge=0.0)
    fsrs_state: str = Field(default="new")
    last_rating: str | None = None
    last_review_at: datetime | None = None
    next_review_at: datetime | None = Field(default=None, index=True)

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), index=True)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ArticleVocab(SQLModel, table=True):
    """
    文章与核心词汇的多对多关联表。
    """

    __tablename__ = "article_vocab"
    __table_args__ = (Index("idx_article_vocab_vocab", "vocab_id"),)

    article_id: str = Field(foreign_key="articles.id", ondelete="CASCADE", primary_key=True)
    vocab_id: str = Field(foreign_key="vocabularies.id", ondelete="CASCADE", primary_key=True, index=True)
    seq: int = Field(default=0, ge=0)


class ReviewLog(SQLModel, table=True):
    """
    复习历史表。

    记录 FSRS 复习前后的状态快照，便于后续排查“为什么这个词排到这一天”。
    """

    __tablename__ = "review_logs"
    __table_args__ = (
        CheckConstraint("rating IN ('again', 'hard', 'good', 'easy')", name="ck_review_logs_rating"),
        CheckConstraint("state_before IN ('new', 'learning', 'review', 'relearning')", name="ck_review_logs_state_before"),
        CheckConstraint("state_after IN ('new', 'learning', 'review', 'relearning')", name="ck_review_logs_state_after"),
        Index("idx_review_logs_vocab_time", "vocab_id", "reviewed_at"),
    )

    id: int | None = Field(default=None, primary_key=True)
    vocab_id: str = Field(foreign_key="vocabularies.id", ondelete="CASCADE", index=True)
    rating: str
    state_before: str
    stability_before: float
    difficulty_before: float
    state_after: str
    stability_after: float
    difficulty_after: float
    interval_days: float = Field(default=0.0, ge=0.0)
    reviewed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), index=True)
