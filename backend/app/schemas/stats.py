from datetime import date

from pydantic import Field

from app.schemas.base import CamelModel


class StatsResponse(CamelModel):
    """
    个人中心统计响应。

    Attributes:
        total_study_time_seconds: 累计学习时长，单位秒。
        streak_days: 连续学习天数。
        total_articles_analyzed: 已分析文章数。
        collected_article_count: 已收藏文章数。
        total_vocab_count: 生词本词条数。
        last_study_date: 最近学习日期。
    """

    total_study_time_seconds: int
    streak_days: int
    total_articles_analyzed: int
    collected_article_count: int
    total_vocab_count: int
    last_study_date: date | None


class StudyTimeCreate(CamelModel):
    """
    学习时长上报请求。

    Attributes:
        seconds: 本次新增学习时长，单位秒。
    """

    seconds: int = Field(..., gt=0, le=3600, description="本次新增学习时长，单位秒")
