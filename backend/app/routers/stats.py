import time

import structlog
from fastapi import APIRouter, status

from app.deps import CurrentUserIdDep, SessionDep
from app.schemas.stats import StatsResponse, StudyTimeCreate
from app.services.stats_service import StatsService

router = APIRouter(prefix="/stats", tags=["stats"])
log = structlog.get_logger()


@router.get("", response_model=StatsResponse, response_model_by_alias=True)
async def get_stats(session: SessionDep, user_id: CurrentUserIdDep) -> StatsResponse:
    """
    获取个人中心统计数据。

    Args:
        session: 数据库会话依赖。
        user_id: 当前演示用户 ID。

    Returns:
        StatsResponse: 学习总时长、连续天数、文章数、生词数等统计。
    """

    start = time.perf_counter()
    service = StatsService(session)
    result = service.get_stats(user_id)
    log.info(
        "stats_get",
        user_id=user_id,
        duration_ms=int((time.perf_counter() - start) * 1000),
        status="ok",
    )
    return result


@router.post(
    "/study-time",
    response_model=StatsResponse,
    response_model_by_alias=True,
    status_code=status.HTTP_200_OK,
)
async def add_study_time(
    payload: StudyTimeCreate,
    session: SessionDep,
    user_id: CurrentUserIdDep,
) -> StatsResponse:
    """
    上报并累加学习时长。

    Args:
        payload: 本次上报的学习秒数。
        session: 数据库会话依赖。
        user_id: 当前演示用户 ID。

    Returns:
        StatsResponse: 更新后的统计数据。
    """

    start = time.perf_counter()
    service = StatsService(session)
    result = service.add_study_time(user_id=user_id, seconds=payload.seconds)
    log.info(
        "stats_study_time_added",
        user_id=user_id,
        seconds=payload.seconds,
        duration_ms=int((time.perf_counter() - start) * 1000),
        status="ok",
    )
    return result
