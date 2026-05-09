import time

import structlog
from fastapi import APIRouter, HTTPException, Query, status

from app.deps import CurrentUserIdDep, SessionDep
from app.schemas.analyze import Difficulty
from app.schemas.article import ArticleCollectRequest, ArticleDetailResponse, ArticleResponse
from app.services.article_repo import ArticleNotFoundError, ArticleRepo

router = APIRouter(prefix="/articles", tags=["articles"])
log = structlog.get_logger()


@router.get("", response_model=list[ArticleResponse], response_model_by_alias=True)
async def list_articles(
    session: SessionDep,
    user_id: CurrentUserIdDep,
    difficulty: Difficulty | None = None,
    collected: bool | None = None,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> list[ArticleResponse]:
    """
    获取文章列表。

    Args:
        session: 数据库会话依赖。
        user_id: 当前演示用户 ID。
        difficulty: 可选难度筛选。
        collected: 是否只看收藏文章。
        limit: 最大返回数量。
        offset: 分页偏移。

    Returns:
        list[ArticleResponse]: 文章列表。
    """

    start = time.perf_counter()
    result = ArticleRepo(session).list_articles(
        user_id=user_id,
        difficulty=difficulty,
        collected=collected,
        limit=limit,
        offset=offset,
    )
    log.info(
        "articles_list",
        user_id=user_id,
        count=len(result),
        duration_ms=int((time.perf_counter() - start) * 1000),
    )
    return result


@router.get("/{article_id}", response_model=ArticleDetailResponse, response_model_by_alias=True)
async def get_article_detail(
    article_id: str,
    session: SessionDep,
    user_id: CurrentUserIdDep,
) -> ArticleDetailResponse:
    """
    获取文章详情。

    Args:
        article_id: 文章 ID。
        session: 数据库会话依赖。
        user_id: 当前演示用户 ID。

    Returns:
        ArticleDetailResponse: 含词汇和长难句的文章详情。
    """

    try:
        return ArticleRepo(session).get_article_detail(user_id=user_id, article_id=article_id)
    except ArticleNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="文章不存在") from exc


@router.post("/{article_id}/collect", response_model=ArticleResponse, response_model_by_alias=True)
async def collect_article(
    article_id: str,
    payload: ArticleCollectRequest,
    session: SessionDep,
    user_id: CurrentUserIdDep,
) -> ArticleResponse:
    """
    收藏或取消收藏文章。

    Args:
        article_id: 文章 ID。
        payload: 收藏状态。
        session: 数据库会话依赖。
        user_id: 当前演示用户 ID。

    Returns:
        ArticleResponse: 更新后的文章。
    """

    try:
        return ArticleRepo(session).set_collected(
            user_id=user_id,
            article_id=article_id,
            is_collected=payload.is_collected,
        )
    except ArticleNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="文章不存在") from exc
