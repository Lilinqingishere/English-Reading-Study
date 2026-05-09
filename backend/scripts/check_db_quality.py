import json
import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy.engine import Engine

from app.config import settings
from app.db import get_engine, init_db
from app.services.seed import SEED_ARTICLES, validate_seed_articles

REQUIRED_TABLES = {
    "users",
    "user_stats",
    "articles",
    "long_sentences",
    "vocabularies",
    "article_vocab",
    "review_logs",
}
REQUIRED_INDEXES = {
    "articles": {"idx_articles_user_collected", "idx_articles_source_difficulty"},
    "long_sentences": {"idx_long_sentences_article_seq"},
    "vocabularies": {"idx_vocab_user_next_review", "idx_vocab_user_created"},
    "article_vocab": {"idx_article_vocab_vocab"},
    "review_logs": {"idx_review_logs_vocab_time"},
}


def _index_names(engine: Engine, table_name: str) -> set[str]:
    """
    读取指定表的索引名称集合。

    Args:
        engine: 当前数据库引擎。
        table_name: 数据表名。

    Returns:
        set[str]: 索引名称集合。
    """

    with engine.connect() as conn:
        rows = conn.exec_driver_sql(f"PRAGMA index_list({table_name})").mappings().all()
    return {str(row["name"]) for row in rows}


def _table_count(engine: Engine, table_name: str) -> int:
    """
    统计指定表的行数。

    Args:
        engine: 当前数据库引擎。
        table_name: 数据表名。

    Returns:
        int: 表内记录数。
    """

    with engine.connect() as conn:
        return int(conn.exec_driver_sql(f"SELECT COUNT(*) FROM {table_name}").scalar_one())


def _extension_articles(engine: Engine) -> list[dict[str, Any]]:
    """
    汇总阅读拓展文章的数据质量。

    Args:
        engine: 当前数据库引擎。

    Returns:
        list[dict[str, Any]]: 阅读拓展文章质量摘要。
    """

    with engine.connect() as conn:
        rows = conn.exec_driver_sql(
            """
            SELECT id, title, difficulty, source_name, source_url, source_license, attribution_text, analysis_model
            FROM articles
            WHERE source_type='extension'
            ORDER BY id
            """
        ).mappings().all()
        result: list[dict[str, Any]] = []
        for row in rows:
            article_id = str(row["id"])
            long_sentence_count = int(
                conn.exec_driver_sql(
                    "SELECT COUNT(*) FROM long_sentences WHERE article_id=?",
                    (article_id,),
                ).scalar_one()
            )
            core_vocab_count = int(
                conn.exec_driver_sql(
                    "SELECT COUNT(*) FROM article_vocab WHERE article_id=?",
                    (article_id,),
                ).scalar_one()
            )
            result.append(
                {
                    **dict(row),
                    "longSentenceCount": long_sentence_count,
                    "coreVocabCount": core_vocab_count,
                }
            )
    return result


def main() -> None:
    """
    执行数据库质量检查。
    """

    validate_seed_articles()
    init_db()
    engine = get_engine()
    errors: list[str] = []

    with engine.connect() as conn:
        foreign_keys = int(conn.exec_driver_sql("PRAGMA foreign_keys").scalar_one())
        busy_timeout = int(conn.exec_driver_sql("PRAGMA busy_timeout").scalar_one())
        tables = {
            str(row[0])
            for row in conn.exec_driver_sql(
                "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
            ).all()
        }

    missing_tables = sorted(REQUIRED_TABLES - tables)
    if missing_tables:
        errors.append(f"缺少数据表：{missing_tables}")
    if foreign_keys != 1:
        errors.append("SQLite foreign_keys 未开启")
    if busy_timeout < settings.sqlite_busy_timeout_ms:
        errors.append(f"SQLite busy_timeout 低于配置值：{busy_timeout}")

    for table_name, expected_indexes in REQUIRED_INDEXES.items():
        missing_indexes = sorted(expected_indexes - _index_names(engine, table_name))
        if missing_indexes:
            errors.append(f"{table_name} 缺少复合索引：{missing_indexes}")

    articles = _extension_articles(engine) if "articles" in tables else []
    if len(articles) < len(SEED_ARTICLES):
        errors.append(f"阅读拓展文章数量不足：actual={len(articles)}, expected>={len(SEED_ARTICLES)}")
    for article in articles:
        if not article.get("source_name") or not article.get("source_url") or not article.get("attribution_text"):
            errors.append(f"文章来源字段不完整：{article.get('id')}")
        if int(article["longSentenceCount"]) <= 0 or int(article["coreVocabCount"]) <= 0:
            errors.append(f"文章详情依赖数据不完整：{article.get('id')}")

    table_counts = {table: _table_count(engine, table) for table in sorted(REQUIRED_TABLES & tables)}
    output = {
        "ok": not errors,
        "dbUrl": settings.db_url,
        "foreignKeys": foreign_keys,
        "busyTimeoutMs": busy_timeout,
        "tableCounts": table_counts,
        "extensionArticleCount": len(articles),
        "extensionArticles": articles,
        "errors": errors,
    }
    print(json.dumps(output, ensure_ascii=False, default=str))
    if errors:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
