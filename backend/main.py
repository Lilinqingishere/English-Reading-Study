from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db import init_db
from app.deps import SessionDep
from app.errors import register_exception_handlers
from app.logging import configure_logging
from app.middleware import TraceIdMiddleware
from app.routers import analysis, articles, review, stats, vocab
from app.schemas.health import HealthResponse
from app.services.health_service import HealthService


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """
    FastAPI 生命周期钩子。

    启动时完成日志配置和数据库初始化，保证前端第一次请求 stats 接口时，
    demo_user 与 user_stats 已经存在。

    Args:
        app: FastAPI 应用实例。

    Yields:
        None: 应用运行期间的控制权。
    """

    configure_logging(settings.log_level)
    init_db()
    yield


def create_app() -> FastAPI:
    """
    创建 FastAPI 应用实例。

    Returns:
        FastAPI: 配置好 CORS、路由和生命周期钩子的应用。
    """

    app = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        description="English Reading Academy 后端 API",
        lifespan=lifespan,
    )

    app.add_middleware(TraceIdMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(analysis.router, prefix=settings.api_prefix)
    app.include_router(articles.router, prefix=settings.api_prefix)
    app.include_router(vocab.router, prefix=settings.api_prefix)
    app.include_router(review.router, prefix=settings.api_prefix)
    app.include_router(stats.router, prefix=settings.api_prefix)
    register_exception_handlers(app)

    @app.get("/healthz", response_model=HealthResponse, response_model_by_alias=True)
    async def healthz(session: SessionDep) -> HealthResponse:
        """
        健康检查接口。

        Returns:
            HealthResponse: 服务、环境、模型和数据库初始化状态。
        """

        return HealthResponse(
            status="ok",
            app_name=settings.app_name,
            env=settings.env,
            model_name=settings.model_name,
            database_ready=HealthService(session).is_database_ready(),
        )

    return app


app = create_app()
