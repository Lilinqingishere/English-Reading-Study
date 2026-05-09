from datetime import datetime, timezone

from fastapi.testclient import TestClient

from app.schemas.analyze import AnalyzeRequest, AnalyzeResponse, AnalyzeSentence, AnalyzeVocabulary, Difficulty
from app.services.analyzer import AnalyzerService
from app.services.review_service import ReviewService


async def _fake_analyze(self: AnalyzerService, request: AnalyzeRequest) -> AnalyzeResponse:
    """
    返回固定分析结果，避免复习相关测试依赖真实 DashScope。
    """

    return AnalyzeResponse(
        article_id="article_review_001",
        title="Review Flow",
        difficulty=Difficulty.CET6,
        word_count=3,
        original_text=request.text,
        translation="复习流程测试。",
        core_vocabulary=[
            AnalyzeVocabulary(
                id="vocab_review_001",
                word="reliable",
                phonetic="/rɪˈlaɪəbl/",
                translation="可靠的",
                example_en="A reliable system is essential.",
                example_zh="可靠的系统至关重要。",
            )
        ],
        long_sentences=[
            AnalyzeSentence(
                id="sentence_review_001",
                english="A reliable system is essential.",
                chinese="可靠的系统至关重要。",
                analysis="主语 A reliable system，谓语 is，表语 essential。",
            )
        ],
        tokens_used=20,
        duration_ms=5,
        analysis_model="qwen-turbo",
    )


def test_ensure_utc_handles_naive_and_aware() -> None:
    """
    `_ensure_utc` 必须把 naive datetime 当作 UTC aware，已经 aware 的保持不变。

    SQLite 读出的 datetime 会丢失 tzinfo，FSRS 内部会拿这个值与 aware now 相减，
    naive 与 aware 相减会抛 TypeError，所以这层归一化是复习接口能稳定工作的前提。
    """

    naive = datetime(2026, 5, 6, 12, 0, 0)
    aware_utc = ReviewService._ensure_utc(naive)
    assert aware_utc is not None
    assert aware_utc.tzinfo is timezone.utc
    assert aware_utc.year == 2026 and aware_utc.hour == 12

    aware = datetime(2026, 5, 6, 12, 0, 0, tzinfo=timezone.utc)
    assert ReviewService._ensure_utc(aware) == aware
    assert ReviewService._ensure_utc(None) is None


def test_review_submit_twice_does_not_500(client: TestClient, monkeypatch) -> None:
    """
    回归测试：同一个生词连续提交两次复习反馈不应该返回 500。

    历史问题：第一次提交后 last_review_at / next_review_at 写入 SQLite，
    第二次提交时从数据库读出的是 naive datetime，与 ``datetime.now(timezone.utc)``
    相减抛 TypeError，导致复习到"最后一个再提交"时出现服务器错误。
    """

    monkeypatch.setattr(AnalyzerService, "analyze", _fake_analyze)
    client.post("/api/analyze", json={"text": "A reliable system is essential."})

    vocab_resp = client.post(
        "/api/vocab",
        json={
            "word": "reliable",
            "phonetic": "/rɪˈlaɪəbl/",
            "translation": "可靠的",
            "exampleEn": "A reliable system is essential.",
            "exampleZh": "可靠的系统至关重要。",
            "sourceArticleId": "article_review_001",
        },
    )
    assert vocab_resp.status_code == 201
    vocab_id = vocab_resp.json()["id"]

    first = client.post(f"/api/review/{vocab_id}", json={"rating": "again"})
    assert first.status_code == 200, first.text
    first_body = first.json()["vocabulary"]
    assert first_body["reviewCount"] == 1
    assert first_body["lastReviewAt"] is not None

    # 第二次提交：last_review_at 已写入数据库，二次读出来是 naive datetime，
    # 必须依赖 ReviewService 内部的 UTC 归一化，否则会触发 TypeError -> 500。
    second = client.post(f"/api/review/{vocab_id}", json={"rating": "good"})
    assert second.status_code == 200, second.text
    second_body = second.json()["vocabulary"]
    assert second_body["reviewCount"] == 2
    assert second_body["nextReviewAt"] is not None
