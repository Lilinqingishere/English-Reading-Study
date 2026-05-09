import pytest
from fastapi.testclient import TestClient

from app.schemas.analyze import AnalyzeRequest
from app.schemas.vocab import VocabCreate
from app.services.analyzer import AnalyzeParseError, AnalyzerService


def test_trace_id_header_is_returned(client: TestClient) -> None:
    """
    验证每个响应都会带 trace id，便于前后端联合排障。
    """

    response = client.get("/healthz", headers={"X-Trace-Id": "trace_test_001"})

    assert response.status_code == 200
    assert response.headers["X-Trace-Id"] == "trace_test_001"


def test_analyze_request_rejects_blank_text() -> None:
    """
    验证纯空格文本会被 schema 拦截。
    """

    with pytest.raises(ValueError):
        AnalyzeRequest(text="   ")


def test_vocab_create_strips_required_fields() -> None:
    """
    验证生词创建请求会清理必填字段首尾空白。
    """

    payload = VocabCreate(word="  sustainable  ", translation="  可持续的  ")

    assert payload.word == "sustainable"
    assert payload.translation == "可持续的"


def test_vocab_create_rejects_blank_word() -> None:
    """
    验证纯空格生词不会写入数据库。
    """

    with pytest.raises(ValueError):
        VocabCreate(word="   ", translation="可持续的")


def test_analyzer_rejects_incomplete_vocabulary_item() -> None:
    """
    验证模型词汇项缺少必要字段时，会被严格 schema 拦截。
    """

    raw = '''{
        "title": "阅读习惯",
        "difficulty": "CET4",
        "translation": "每天阅读很重要。",
        "core_vocabulary": [
            {
                "word": "habit",
                "translation": "习惯"
            }
        ],
        "long_sentences": []
    }'''

    with pytest.raises(AnalyzeParseError):
        AnalyzerService.parse_model_json(raw)


def test_analyzer_allows_empty_arrays_for_short_text() -> None:
    """
    验证短文本可以返回空词表和空长难句，避免强制凑数。
    """

    raw = '{"title":"短文本","difficulty":"CET4","translation":"你好。","core_vocabulary":[],"long_sentences":[]}'

    parsed = AnalyzerService.parse_model_json(raw)

    assert parsed.core_vocabulary == []
    assert parsed.long_sentences == []


def test_analyzer_rejects_duplicate_vocabulary_words() -> None:
    """
    验证模型重复输出同一核心词时会被 schema 拦截。
    """

    raw = '''{
        "title": "阅读习惯",
        "difficulty": "CET4",
        "translation": "阅读习惯很重要。",
        "core_vocabulary": [
            {
                "word": "habit",
                "phonetic": "",
                "translation": "习惯",
                "example_en": "Reading habit matters.",
                "example_zh": "阅读习惯很重要。"
            },
            {
                "word": "Habit",
                "phonetic": "",
                "translation": "习惯",
                "example_en": "Reading habit matters.",
                "example_zh": "阅读习惯很重要。"
            }
        ],
        "long_sentences": []
    }'''

    with pytest.raises(AnalyzeParseError):
        AnalyzerService.parse_model_json(raw)


def test_analyzer_rejects_markup_in_model_fields() -> None:
    """
    验证模型字段中夹带 HTML 或 Markdown 展示标记时会被拦截。
    """

    raw = '{"title":"<b>阅读</b>","difficulty":"CET4","translation":"阅读很重要。","core_vocabulary":[],"long_sentences":[]}'

    with pytest.raises(AnalyzeParseError):
        AnalyzerService.parse_model_json(raw)


def test_analyzer_rejects_too_many_vocabulary_items() -> None:
    """
    验证核心词最多 10 条，避免模型输出过长导致前端展示和存储失控。
    """

    items = ",".join(
        f'{{"word":"word{i}","phonetic":"","translation":"词{i}","example_en":"word{i}","example_zh":"词{i}"}}'
        for i in range(11)
    )
    raw = f'{{"title":"词汇","difficulty":"CET4","translation":"词汇。","core_vocabulary":[{items}],"long_sentences":[]}}'

    with pytest.raises(AnalyzeParseError):
        AnalyzerService.parse_model_json(raw)


def test_article_detail_returns_404_for_unknown_article(client: TestClient) -> None:
    """
    验证文章不存在时返回 404，而不是 500。
    """

    response = client.get("/api/articles/not_exist")

    assert response.status_code == 404
    assert response.json()["detail"] == "文章不存在"


def test_create_vocab_returns_404_for_unknown_source_article(client: TestClient) -> None:
    """
    验证生词来源文章不存在时返回业务 404，而不是数据库约束异常。
    """

    response = client.post(
        "/api/vocab",
        json={
            "word": "resilient",
            "translation": "有韧性的",
            "sourceArticleId": "missing_article",
        },
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "来源文章不存在"


def test_delete_vocab_returns_404_for_unknown_vocab(client: TestClient) -> None:
    """
    验证删除不存在生词时返回 404。
    """

    response = client.delete("/api/vocab/missing_vocab")

    assert response.status_code == 404
    assert response.json()["detail"] == "生词不存在"
