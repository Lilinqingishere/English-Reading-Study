import time
import uuid
from collections.abc import Awaitable, Callable

import structlog
import structlog.contextvars
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

TRACE_ID_HEADER = "X-Trace-Id"
log = structlog.get_logger()


class TraceIdMiddleware(BaseHTTPMiddleware):
    """
    为每个请求绑定 trace_id。

    trace_id 会进入 structlog contextvars，并通过响应头返回给前端。这样前端报错截图、
    后端日志和模型调用日志可以用同一个 ID 串起来排查。
    """

    async def dispatch(self, request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
        """
        处理单个请求的 trace_id 生命周期。

        Args:
            request: Starlette 请求对象。
            call_next: 下一个 ASGI 处理器。

        Returns:
            Response: 带 X-Trace-Id 响应头的响应对象。
        """

        trace_id = request.headers.get(TRACE_ID_HEADER) or uuid.uuid4().hex
        start = time.perf_counter()
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(
            trace_id=trace_id,
            method=request.method,
            path=request.url.path,
        )

        try:
            response = await call_next(request)
            response.headers[TRACE_ID_HEADER] = trace_id
            log.info(
                "request_finished",
                status_code=response.status_code,
                duration_ms=int((time.perf_counter() - start) * 1000),
            )
            return response
        finally:
            structlog.contextvars.clear_contextvars()
