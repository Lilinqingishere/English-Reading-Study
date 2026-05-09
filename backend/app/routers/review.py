import time

import structlog
from fastapi import APIRouter, HTTPException, Query, status

from app.deps import CurrentUserIdDep, SessionDep
from app.schemas.review import ReviewSubmitRequest, ReviewSubmitResponse
from app.schemas.vocab import VocabResponse
from app.services.review_service import ReviewService
from app.services.vocab_repo import VocabNotFoundError

router = APIRouter(prefix="/review", tags=["review"])
log = structlog.get_logger()


@router.get("/today", response_model=list[VocabResponse], response_model_by_alias=True)
async def get_today_review(
    session: SessionDep,
    user_id: CurrentUserIdDep,
    limit: int = Query(default=50, ge=1, le=100),
) -> list[VocabResponse]:
    """
    获取今日复习队列。

    Args:
        session: 数据库会话依赖。
        user_id: 当前演示用户 ID。
        limit: 最大返回数量。

    Returns:
        list[VocabResponse]: 待复习词条。
    """

    start = time.perf_counter()
    result = ReviewService(session).get_today_queue(user_id=user_id, limit=limit)
    log.info(
        "review_today",
        user_id=user_id,
        count=len(result),
        duration_ms=int((time.perf_counter() - start) * 1000),
    )
    return result


@router.post("/{vocab_id}", response_model=ReviewSubmitResponse, response_model_by_alias=True)
async def submit_review(
    vocab_id: str,
    payload: ReviewSubmitRequest,
    session: SessionDep,
    user_id: CurrentUserIdDep,
) -> ReviewSubmitResponse:
    """
    提交复习反馈。

    Args:
        vocab_id: 生词 ID。
        payload: 四档复习反馈。
        session: 数据库会话依赖。
        user_id: 当前演示用户 ID。

    Returns:
        ReviewSubmitResponse: 更新后的词条和计数增量。
    """

    try:
        return ReviewService(session).submit_review(user_id=user_id, vocab_id=vocab_id, rating=payload.rating)
    except VocabNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="生词不存在") from exc
