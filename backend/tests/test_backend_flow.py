from fastapi.testclient import TestClient

from app.schemas.analyze import AnalyzeRequest, AnalyzeResponse, AnalyzeSentence, AnalyzeVocabulary, Difficulty
from app.services.analyzer import AnalyzerService


async def fake_analyze(self: AnalyzerService, request: AnalyzeRequest) -> AnalyzeResponse:
    """
    返回固定分析结果，避免接口集成测试依赖真实 DashScope。
    """

    return AnalyzeResponse(
        article_id="article_test_001",
        title="可持续交通",
        difficulty=Difficulty.CET6,
        word_count=3,
        original_text=request.text,
        translation="可持续交通很重要。",
        core_vocabulary=[
            AnalyzeVocabulary(
                id="vocab_test_001",
                word="sustainable",
                phonetic="/səˈsteɪnəbl/",
                translation="可持续的",
                example_en="Sustainable transport matters.",
                example_zh="可持续交通很重要。",
            )
        ],
        long_sentences=[
            AnalyzeSentence(
                id="sentence_test_001",
                english="Sustainable transport matters.",
                chinese="可持续交通很重要。",
                analysis="主语 Sustainable transport，谓语 matters。",
            )
        ],
        tokens_used=30,
        duration_ms=10,
        analysis_model="qwen-turbo",
    )


def test_analyze_saves_article_and_allows_collecting(
    client: TestClient,
    monkeypatch,
) -> None:
    """
    验证阅读分析结果会落库，并且文章详情和收藏接口可用。
    """

    monkeypatch.setattr(AnalyzerService, "analyze", fake_analyze)

    response = client.post("/api/analyze", json={"text": "Sustainable transport matters."})
    assert response.status_code == 200
    body = response.json()
    assert body["articleId"] == "article_test_001"
    assert body["coreVocabulary"][0]["id"] == "vocab_test_001"

    detail_response = client.get("/api/articles/article_test_001")
    assert detail_response.status_code == 200
    detail = detail_response.json()
    assert detail["title"] == "可持续交通"
    assert detail["coreVocabulary"][0]["word"] == "sustainable"
    assert detail["longSentences"][0]["analysis"] == "主语 Sustainable transport，谓语 matters。"

    collect_response = client.post("/api/articles/article_test_001/collect", json={"isCollected": True})
    assert collect_response.status_code == 200
    assert collect_response.json()["isCollected"] is True

    stats_response = client.get("/api/stats")
    assert stats_response.status_code == 200
    stats = stats_response.json()
    assert stats["totalArticlesAnalyzed"] == 1
    assert stats["collectedArticleCount"] == 1


def test_vocab_and_review_flow(client: TestClient, monkeypatch) -> None:
    """
    验证加入生词本、今日复习、提交 FSRS 反馈和软删除闭环。
    """

    monkeypatch.setattr(AnalyzerService, "analyze", fake_analyze)
    client.post("/api/analyze", json={"text": "Sustainable transport matters."})

    vocab_response = client.post(
        "/api/vocab",
        json={
            "word": "sustainable",
            "phonetic": "/səˈsteɪnəbl/",
            "translation": "可持续的",
            "exampleEn": "Sustainable transport matters.",
            "exampleZh": "可持续交通很重要。",
            "sourceArticleId": "article_test_001",
        },
    )
    assert vocab_response.status_code == 201
    vocab = vocab_response.json()
    assert vocab["isCollected"] is True
    assert vocab["reviewCount"] == 0

    list_response = client.get("/api/vocab")
    assert list_response.status_code == 200
    assert len(list_response.json()) == 1

    today_response = client.get("/api/review/today")
    assert today_response.status_code == 200
    today = today_response.json()
    assert len(today) == 1
    assert today[0]["word"] == "sustainable"

    review_response = client.post(f"/api/review/{vocab['id']}", json={"rating": "good"})
    assert review_response.status_code == 200
    reviewed = review_response.json()["vocabulary"]
    assert reviewed["reviewCount"] == 1
    assert reviewed["lastRating"] == "good"
    assert reviewed["nextReviewAt"] is not None

    delete_response = client.delete(f"/api/vocab/{vocab['id']}")
    assert delete_response.status_code == 204
    assert client.get("/api/vocab").json() == []


def test_analyze_stream_returns_ordered_sse_events(client: TestClient, monkeypatch) -> None:
    """
    验证假流式接口按 meta/translation/vocab/sentence/done 顺序输出事件。
    """

    monkeypatch.setattr(AnalyzerService, "analyze", fake_analyze)

    with client.stream("POST", "/api/analyze/stream", json={"text": "Sustainable transport matters."}) as response:
        assert response.status_code == 200
        text = response.read().decode("utf-8")

    assert "event: meta" in text
    assert "event: translation" in text
    assert "event: vocab" in text
    assert "event: sentence" in text
    assert "event: done" in text
    assert "article_test_001" in text
