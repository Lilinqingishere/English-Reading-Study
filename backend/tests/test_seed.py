from collections import Counter

import pytest
from fastapi.testclient import TestClient

from app.services.seed import SEED_ARTICLES, SeedDataValidationError, seed_extension_articles, validate_seed_articles


def test_seed_articles_have_enough_real_source_diversity() -> None:
    """
    验证阅读拓展 seed 数量和难度覆盖，避免演示数据退回到过少状态。
    """

    difficulties = Counter(str(article["difficulty"]) for article in SEED_ARTICLES)

    assert len(SEED_ARTICLES) >= 8
    assert difficulties["CET4"] >= 2
    assert difficulties["CET6"] >= 2
    assert difficulties["IELTS"] >= 2
    validate_seed_articles()


def test_seed_extension_articles_is_idempotent(client: TestClient) -> None:
    """
    验证阅读拓展 seed 可重复执行，并能通过文章接口读出真实来源字段。
    """

    first_count = seed_extension_articles()
    second_count = seed_extension_articles()

    assert first_count == len(SEED_ARTICLES)
    assert second_count == 0

    response = client.get("/api/articles")
    assert response.status_code == 200
    articles = response.json()
    assert len(articles) == len(SEED_ARTICLES)
    assert all(article["sourceName"] == "Project Gutenberg" for article in articles)
    assert all(article["sourceUrl"].startswith("https://www.gutenberg.org/") for article in articles)
    assert all(article["attributionText"] for article in articles)


def test_validate_seed_articles_rejects_forbidden_source() -> None:
    """
    验证 seed 质量门禁会拒绝禁止来源，避免商业媒体全文混入数据库。
    """

    invalid_article = {
        **SEED_ARTICLES[0],
        "source_name": "The Economist",
        "source_url": "https://www.economist.com/fake-article",
    }

    with pytest.raises(SeedDataValidationError):
        validate_seed_articles([invalid_article])
