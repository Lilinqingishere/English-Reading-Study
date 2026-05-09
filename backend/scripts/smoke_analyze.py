import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.schemas.analyze import AnalyzeRequest
from app.services.analyzer import AnalyzerService
from app.services.llm import DashScopeClient, LLMConfigurationError, LLMError, LLMHTTPError


async def main() -> None:
    """
    执行一次真实 DashScope 阅读分析 smoke test。

    这个脚本只输出结构化摘要，不输出 API Key，也不输出完整模型内容，避免在终端日志里
    泄露敏感配置或刷屏。它用于确认 .env、DashScope SDK、Prompt 和 JSON 解析链路可用。
    """

    request = AnalyzeRequest(
        text="Reading every day helps students build vocabulary and understand complex ideas more clearly.",
        hint_difficulty="CET4",
    )
    result = await AnalyzerService(DashScopeClient()).analyze(request)
    summary = {
        "title": result.title,
        "difficulty": result.difficulty,
        "wordCount": result.word_count,
        "vocabCount": len(result.core_vocabulary),
        "sentenceCount": len(result.long_sentences),
        "tokensUsed": result.tokens_used,
        "durationMs": result.duration_ms,
        "analysisModel": result.analysis_model,
    }
    print(json.dumps(summary, ensure_ascii=False))


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except LLMConfigurationError:
        print(json.dumps({"ok": False, "reason": "DASHSCOPE_API_KEY 未配置"}, ensure_ascii=False))
        raise SystemExit(2)
    except LLMHTTPError as exc:
        print(
            json.dumps(
                {
                    "ok": False,
                    "reason": "DashScope 模型服务返回错误",
                    "statusCode": exc.status_code,
                    "hint": "如果 statusCode=403，通常表示当前 Key 未开通或无权访问 MODEL_NAME 指定的模型。",
                },
                ensure_ascii=False,
            )
        )
        raise SystemExit(3)
    except LLMError:
        print(json.dumps({"ok": False, "reason": "DashScope 调用失败"}, ensure_ascii=False))
        raise SystemExit(4)
