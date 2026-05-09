import pytest
from fastapi.testclient import TestClient
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session

from app.db import get_engine
from app.models.article import Article


def _table_sql(table_name: str) -> str:
    """
    读取 SQLite 建表语句。

    Args:
        table_name: 数据表名。

    Returns:
        str: sqlite_master 中保存的建表 SQL。
    """

    with get_engine().connect() as conn:
        row = conn.exec_driver_sql(
            "SELECT sql FROM sqlite_master WHERE type='table' AND name=?",
            (table_name,),
        ).first()
    assert row is not None
    return str(row[0])


def _index_names(table_name: str) -> set[str]:
    """
    读取指定表的索引名称集合。

    Args:
        table_name: 数据表名。

    Returns:
        set[str]: 当前 SQLite 库中的索引名集合。
    """

    with get_engine().connect() as conn:
        rows = conn.exec_driver_sql(f"PRAGMA index_list({table_name})").mappings().all()
    return {str(row["name"]) for row in rows}


def test_sqlite_pragmas_enable_foreign_keys_and_busy_timeout(client: TestClient) -> None:
    """
    验证 SQLite 连接启用了外键和 busy timeout。
    """

    with get_engine().connect() as conn:
        foreign_keys = conn.exec_driver_sql("PRAGMA foreign_keys").scalar_one()
        busy_timeout = conn.exec_driver_sql("PRAGMA busy_timeout").scalar_one()

    assert foreign_keys == 1
    assert busy_timeout >= 5000


def test_database_schema_contains_checks_ondelete_and_composite_indexes(client: TestClient) -> None:
    """
    验证新初始化数据库具备 CHECK、ON DELETE 和复合索引。
    """

    article_sql = _table_sql("articles")
    vocab_sql = _table_sql("vocabularies")
    review_log_sql = _table_sql("review_logs")
    long_sentence_sql = _table_sql("long_sentences")

    assert "ck_articles_source_type" in article_sql
    assert "ck_articles_difficulty" in article_sql
    assert "ON DELETE CASCADE" in article_sql
    assert "ck_vocab_fsrs_state" in vocab_sql
    assert "ON DELETE SET NULL" in vocab_sql
    assert "ck_review_logs_rating" in review_log_sql
    assert "ON DELETE CASCADE" in review_log_sql
    assert "ON DELETE CASCADE" in long_sentence_sql

    assert "idx_articles_user_collected" in _index_names("articles")
    assert "idx_articles_source_difficulty" in _index_names("articles")
    assert "idx_vocab_user_next_review" in _index_names("vocabularies")
    assert "idx_review_logs_vocab_time" in _index_names("review_logs")


def test_database_rejects_invalid_article_foreign_key(client: TestClient) -> None:
    """
    验证数据库会拒绝不存在用户下的文章，避免孤儿文章数据。
    """

    with Session(get_engine()) as session:
        session.add(
            Article(
                id="invalid_user_article",
                user_id=999,
                source_type="custom",
                title="Invalid User Article",
                content="This article should not be inserted.",
                translated_content="这篇文章不应该被写入。",
                difficulty="CET4",
                word_count=6,
            )
        )
        with pytest.raises(IntegrityError):
            session.commit()


def test_database_rejects_invalid_article_difficulty(client: TestClient) -> None:
    """
    验证数据库 CHECK 约束会拒绝非法文章难度。
    """

    with Session(get_engine()) as session:
        session.add(
            Article(
                id="invalid_difficulty_article",
                user_id=1,
                source_type="custom",
                title="Invalid Difficulty Article",
                content="This article has an invalid difficulty.",
                translated_content="这篇文章的难度非法。",
                difficulty="TOEFL",
                word_count=6,
            )
        )
        with pytest.raises(IntegrityError):
            session.commit()
