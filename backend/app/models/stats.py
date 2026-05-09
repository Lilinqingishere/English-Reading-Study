from datetime import date, datetime, timezone

from sqlmodel import Field, SQLModel


class User(SQLModel, table=True):
    """
    演示用户表。

    MVP 阶段不做登录系统，所有接口默认绑定 id=1 的 demo_user。
    提前保留用户表，是为了后续接入账号体系时不推翻数据结构。
    """

    __tablename__ = "users"

    id: int | None = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    display_name: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class UserStats(SQLModel, table=True):
    """
    用户统计表。

    统计字段独立成表，避免个人中心首屏每次都扫描文章表和生词表。
    MVP 阶段先维护学习时长，后续 Sprint 再接入文章/生词闭环时同步更新其他字段。
    """

    __tablename__ = "user_stats"

    user_id: int = Field(foreign_key="users.id", ondelete="CASCADE", primary_key=True)
    total_study_time_seconds: int = Field(default=0, ge=0)
    streak_days: int = Field(default=0, ge=0)
    last_study_date: date | None = None
    total_articles_analyzed: int = Field(default=0, ge=0)
    collected_article_count: int = Field(default=0, ge=0)
    total_vocab_count: int = Field(default=0, ge=0)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
