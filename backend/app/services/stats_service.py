from datetime import date, datetime, timedelta, timezone

from sqlmodel import Session, select

from app.models.stats import UserStats
from app.schemas.stats import StatsResponse


class StatsService:
    """
    用户统计服务。

    负责个人中心统计读取与学习时长上报。路由层只调用该服务，避免把
    日期连续性、初始化兜底、DB 更新等业务规则散落在 API 代码里。
    """

    def __init__(self, session: Session) -> None:
        """
        Args:
            session: 当前请求作用域内的数据库会话。
        """

        self._session = session

    def get_stats(self, user_id: int) -> StatsResponse:
        """
        获取用户统计信息。

        Args:
            user_id: 当前用户 ID。

        Returns:
            StatsResponse: 个人中心统计响应。
        """

        stats = self._get_or_create_stats(user_id)
        return self._to_response(stats)

    def add_study_time(self, user_id: int, seconds: int) -> StatsResponse:
        """
        累加学习时长并更新连续学习天数。

        Args:
            user_id: 当前用户 ID。
            seconds: 本次新增学习时长，单位秒。

        Returns:
            StatsResponse: 更新后的个人中心统计响应。
        """

        stats = self._get_or_create_stats(user_id)
        today = date.today()

        if stats.last_study_date != today:
            if stats.last_study_date == today - timedelta(days=1):
                stats.streak_days += 1
            else:
                # 间隔超过一天代表连续学习中断，重新从今天开始计数。
                stats.streak_days = 1

        stats.last_study_date = today
        stats.total_study_time_seconds += seconds
        stats.updated_at = datetime.now(timezone.utc)
        self._session.add(stats)
        self._session.commit()
        self._session.refresh(stats)
        return self._to_response(stats)

    def _get_or_create_stats(self, user_id: int) -> UserStats:
        """
        获取或创建用户统计记录。

        Args:
            user_id: 当前用户 ID。

        Returns:
            UserStats: 数据库中的统计记录。
        """

        stats = self._session.exec(select(UserStats).where(UserStats.user_id == user_id)).first()
        if stats is not None:
            return stats

        stats = UserStats(user_id=user_id)
        self._session.add(stats)
        self._session.commit()
        self._session.refresh(stats)
        return stats

    @staticmethod
    def _to_response(stats: UserStats) -> StatsResponse:
        """
        将 ORM 记录转换为 API 响应模型。

        Args:
            stats: 数据库统计记录。

        Returns:
            StatsResponse: 对前端友好的 camelCase 响应模型。
        """

        return StatsResponse(
            total_study_time_seconds=stats.total_study_time_seconds,
            streak_days=stats.streak_days,
            total_articles_analyzed=stats.total_articles_analyzed,
            collected_article_count=stats.collected_article_count,
            total_vocab_count=stats.total_vocab_count,
            last_study_date=stats.last_study_date,
        )
