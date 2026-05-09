import time

import structlog
from fastapi import APIRouter, HTTPException, Query, status

from app.deps import CurrentUserIdDep, SessionDep
from app.schemas.vocab import VocabCreate, VocabResponse
from app.services.vocab_repo import VocabNotFoundError, VocabRepo, VocabSourceArticleNotFoundError

router = APIRouter(prefix="/vocab", tags=["vocab"])
log = structlog.get_logger()


@router.get("", response_model=list[VocabResponse], response_model_by_alias=True)
async def list_vocab(
    session: SessionDep,
    user_id: CurrentUserIdDep,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> list[VocabResponse]:
    """
    获取生词本列表。

    Args:
        session: 数据库会话依赖。
        user_id: 当前演示用户 ID。
        limit: 最大返回数量。
        offset: 分页偏移。

    Returns:
        list[VocabResponse]: 生词本词条。
    """

    start = time.perf_counter()
    result = VocabRepo(session).list_vocab(user_id=user_id, limit=limit, offset=offset)
    log.info(
        "vocab_list",
        user_id=user_id,
        count=len(result),
        duration_ms=int((time.perf_counter() - start) * 1000),
    )
    return result


@router.post("", response_model=VocabResponse, response_model_by_alias=True, status_code=status.HTTP_201_CREATED)
async def create_vocab(
    payload: VocabCreate,
    session: SessionDep,
    user_id: CurrentUserIdDep,
) -> VocabResponse:
    """
    加入生词本。

    Args:
        payload: 生词信息。
        session: 数据库会话依赖。
        user_id: 当前演示用户 ID。

    Returns:
        VocabResponse: 新增或更新后的生词。
    """

    try:
        return VocabRepo(session).upsert_vocab(user_id=user_id, payload=payload)
    except VocabSourceArticleNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="来源文章不存在") from exc


@router.delete("/{vocab_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vocab(
    vocab_id: str,
    session: SessionDep,
    user_id: CurrentUserIdDep,
) -> None:
    """
    移出生词本。

    Args:
        vocab_id: 生词 ID。
        session: 数据库会话依赖。
        user_id: 当前演示用户 ID。
    """

    try:
        VocabRepo(session).soft_delete_vocab(user_id=user_id, vocab_id=vocab_id)
    except VocabNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="生词不存在") from exc
