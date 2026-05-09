from collections.abc import AsyncGenerator

import time

import structlog
from fastapi import APIRouter, HTTPException, status
from sse_starlette.sse import EventSourceResponse

from app.deps import CurrentUserIdDep, SessionDep
from app.schemas.analyze import AnalyzeRequest, AnalyzeResponse
from app.schemas.analyze import AnalyzeDoneEvent, AnalyzeMetaEvent, AnalyzeTranslationEvent
from app.services.analyzer import AnalyzeParseError, AnalyzerService
from app.services.article_repo import ArticleRepo
from app.services.llm import (
    DashScopeClient,
    LLMAccessDeniedError,
    LLMConfigurationError,
    LLMError,
    LLMHTTPError,
    LLMTruncatedOutputError,
)

router = APIRouter(tags=["analysis"])
log = structlog.get_logger()


@router.post("/analyze", response_model=AnalyzeResponse, response_model_by_alias=True)
async def analyze(request: AnalyzeRequest, session: SessionDep, user_id: CurrentUserIdDep) -> AnalyzeResponse:
    """
    非流式阅读分析接口。

    Args:
        request: 待分析英文文本与可选难度提示。

    Returns:
        AnalyzeResponse: 完整阅读分析结果。

    Raises:
        HTTPException: 模型未配置、模型调用失败或模型输出解析失败。
    """

    start = time.perf_counter()
    service = AnalyzerService(llm_client=DashScopeClient())

    try:
        result = await service.analyze(request)
        result = ArticleRepo(session).save_analysis_result(user_id=user_id, result=result)
    except LLMConfigurationError as exc:
        log.warning("analyze_model_not_configured", text_len=len(request.text), status="failed")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="模型服务未配置，请先在后端 .env 中设置 DASHSCOPE_API_KEY",
        ) from exc
    except LLMAccessDeniedError as exc:
        log.warning("analyze_llm_access_denied", text_len=len(request.text), llm_status=exc.status_code, code=exc.code)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="模型服务未开通或当前 API Key 无权访问该模型，请在阿里云 DashScope 控制台开通对应模型权限",
        ) from exc
    except LLMHTTPError as exc:
        http_status = status.HTTP_429_TOO_MANY_REQUESTS if exc.status_code == 429 else status.HTTP_502_BAD_GATEWAY
        log.warning("analyze_llm_http_error", text_len=len(request.text), llm_status=exc.status_code, status="failed")
        raise HTTPException(status_code=http_status, detail="模型服务暂不可用，请稍后重试") from exc
    except LLMTruncatedOutputError as exc:
        log.warning("analyze_llm_truncated", text_len=len(request.text), status="failed")
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="模型输出被截断，请缩短原文或稍后重试") from exc
    except AnalyzeParseError as exc:
        log.warning("analyze_parse_error", text_len=len(request.text), status="failed")
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="模型返回格式异常，请稍后重试") from exc
    except LLMError as exc:
        log.warning("analyze_llm_error", text_len=len(request.text), status="failed")
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="模型服务暂不可用，请稍后重试") from exc

    log.info(
        "analyze_request",
        text_len=len(request.text),
        difficulty_hint=request.hint_difficulty,
        duration_ms=int((time.perf_counter() - start) * 1000),
        status="ok",
    )
    return result


@router.post("/analyze/stream")
async def analyze_stream(
    request: AnalyzeRequest,
    session: SessionDep,
    user_id: CurrentUserIdDep,
) -> EventSourceResponse:
    """
    假流式阅读分析接口。

    Args:
        request: 待分析英文文本与可选难度提示。
        session: 数据库会话依赖。
        user_id: 当前演示用户 ID。

    Returns:
        EventSourceResponse: SSE 响应。
    """

    async def event_generator() -> AsyncGenerator[dict[str, str], None]:
        """
        生成 SSE 事件。

        Yields:
            dict[str, str]: SSE 事件对象。
        """

        try:
            result = await AnalyzerService(llm_client=DashScopeClient()).analyze(request)
            result = ArticleRepo(session).save_analysis_result(user_id=user_id, result=result)
        except LLMConfigurationError:
            yield {"event": "error", "data": "模型服务未配置，请先在后端 .env 中设置 DASHSCOPE_API_KEY"}
            return
        except LLMAccessDeniedError:
            yield {"event": "error", "data": "模型服务未开通或当前 API Key 无权访问该模型，请在阿里云 DashScope 控制台开通对应模型权限"}
            return
        except LLMHTTPError:
            yield {"event": "error", "data": "模型服务暂不可用，请稍后重试"}
            return
        except LLMTruncatedOutputError:
            yield {"event": "error", "data": "模型输出被截断，请缩短原文或稍后重试"}
            return
        except AnalyzeParseError:
            yield {"event": "error", "data": "模型返回格式异常，请稍后重试"}
            return
        except LLMError:
            yield {"event": "error", "data": "模型服务暂不可用，请稍后重试"}
            return

        yield {
            "event": "meta",
            "data": AnalyzeMetaEvent(
                article_id=result.article_id,
                title=result.title,
                difficulty=result.difficulty,
                word_count=result.word_count,
                analysis_model=result.analysis_model,
            ).model_dump_json(by_alias=True),
        }
        yield {
            "event": "translation",
            "data": AnalyzeTranslationEvent(translation=result.translation).model_dump_json(by_alias=True),
        }
        for vocab in result.core_vocabulary:
            yield {"event": "vocab", "data": vocab.model_dump_json(by_alias=True)}
        for sentence in result.long_sentences:
            yield {"event": "sentence", "data": sentence.model_dump_json(by_alias=True)}
        yield {
            "event": "done",
            "data": AnalyzeDoneEvent(
                article_id=result.article_id,
                tokens_used=result.tokens_used,
                duration_ms=result.duration_ms,
            ).model_dump_json(by_alias=True),
        }

    return EventSourceResponse(event_generator())
