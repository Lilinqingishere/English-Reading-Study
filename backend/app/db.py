from collections.abc import Generator
from pathlib import Path

import structlog
from sqlalchemy import event
from sqlalchemy.engine import Engine
from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import Session, SQLModel, create_engine, select

from app.config import settings
from app.models.article import Article, LongSentence
from app.models.stats import User, UserStats
from app.models.vocab import ArticleVocab, ReviewLog, Vocabulary

log = structlog.get_logger()
_engine: Engine | None = None


def _is_sqlite_url() -> bool:
    """
    判断当前数据库是否为 SQLite。
    """

    return settings.db_url.startswith("sqlite")


def _ensure_sqlite_parent_dir() -> None:
    """
    确保 SQLite 数据库目录存在。

    SQLite 使用文件路径时不会自动创建父目录。提前创建 data/ 可以避免
    第一次启动后端时因为目录不存在而报 OperationalError。
    """

    sqlite_prefix = "sqlite:///"
    if not _is_sqlite_url() or not settings.db_url.startswith(sqlite_prefix):
        return

    db_path = Path(settings.db_url.removeprefix(sqlite_prefix))
    if db_path.is_absolute():
        db_path.parent.mkdir(parents=True, exist_ok=True)
        return

    Path.cwd().joinpath(db_path).parent.mkdir(parents=True, exist_ok=True)


def _ensure_demo_user(session: Session) -> None:
    """
    初始化固定演示用户和统计记录。

    Args:
        session: 当前数据库会话。
    """

    user = session.exec(select(User).where(User.id == 1)).first()
    if user is None:
        user = User(id=1, username="demo_user", display_name="Demo User")
        session.add(user)

    stats = session.exec(select(UserStats).where(UserStats.user_id == 1)).first()
    if stats is None:
        session.add(UserStats(user_id=1))

    session.commit()


def get_engine() -> Engine:
    """
    返回当前配置对应的数据库引擎。

    Returns:
        Engine: SQLAlchemy 数据库引擎。
    """

    global _engine

    if _engine is not None:
        return _engine

    connect_args = {"check_same_thread": False} if _is_sqlite_url() else {}
    _engine = create_engine(settings.db_url, echo=False, connect_args=connect_args)

    @event.listens_for(_engine, "connect")
    def _set_sqlite_pragmas(dbapi_connection: object, connection_record: object) -> None:
        """
        为每个 SQLite 连接设置并发与一致性参数。
        """

        if not _is_sqlite_url():
            return

        cursor = dbapi_connection.cursor()
        cursor.execute(f"PRAGMA busy_timeout={settings.sqlite_busy_timeout_ms}")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    return _engine


def _ensure_sqlite_runtime_indexes(current_engine: Engine) -> None:
    """
    为已有 SQLite 数据库补齐复合索引。

    SQLModel 的 `create_all` 不会迁移已有表结构，所以这里使用 `IF NOT EXISTS`
    在线补索引；这不会删除数据，也不会影响正在联调的演示数据库。
    """

    if not _is_sqlite_url():
        return

    with current_engine.begin() as conn:
        conn.exec_driver_sql(
            "CREATE INDEX IF NOT EXISTS idx_articles_user_collected "
            "ON articles (user_id, is_collected, created_at)"
        )
        conn.exec_driver_sql(
            "CREATE INDEX IF NOT EXISTS idx_articles_source_difficulty "
            "ON articles (source_type, difficulty)"
        )
        conn.exec_driver_sql(
            "CREATE INDEX IF NOT EXISTS idx_long_sentences_article_seq "
            "ON long_sentences (article_id, seq)"
        )
        conn.exec_driver_sql(
            "CREATE INDEX IF NOT EXISTS idx_vocab_user_next_review "
            "ON vocabularies (user_id, is_collected, next_review_at)"
        )
        conn.exec_driver_sql(
            "CREATE INDEX IF NOT EXISTS idx_vocab_user_created "
            "ON vocabularies (user_id, created_at)"
        )
        conn.exec_driver_sql(
            "CREATE INDEX IF NOT EXISTS idx_article_vocab_vocab "
            "ON article_vocab (vocab_id)"
        )
        conn.exec_driver_sql(
            "CREATE INDEX IF NOT EXISTS idx_review_logs_vocab_time "
            "ON review_logs (vocab_id, reviewed_at)"
        )


def reset_engine() -> None:
    """
    重置数据库引擎。

    测试会临时替换 db_url，所以需要在替换后重建 engine，避免仍然连接到
    默认的演示数据库文件。
    """

    global _engine

    if _engine is not None:
        _engine.dispose()
    _engine = None


def init_db() -> None:
    """
    初始化数据库结构和演示基础数据。

    Raises:
        sqlalchemy.exc.SQLAlchemyError: 当建表或初始化数据失败时由 SQLModel 抛出。
    """

    _ensure_sqlite_parent_dir()
    current_engine = get_engine()
    SQLModel.metadata.create_all(current_engine)
    _ensure_sqlite_runtime_indexes(current_engine)

    if _is_sqlite_url():
        with current_engine.connect() as conn:
            # WAL 能减少演示时“读接口被写接口短暂阻塞”的概率，成本很低。
            conn.exec_driver_sql("PRAGMA journal_mode=WAL")
            conn.exec_driver_sql("PRAGMA synchronous=NORMAL")
            conn.exec_driver_sql(f"PRAGMA busy_timeout={settings.sqlite_busy_timeout_ms}")
            conn.exec_driver_sql("PRAGMA foreign_keys=ON")

    with Session(current_engine) as session:
        _ensure_demo_user(session)

    log.info("db_initialized", db_url=settings.db_url)


def get_session() -> Generator[Session, None, None]:
    """
    FastAPI 数据库会话依赖。

    Yields:
        Session: 当前请求作用域内的 SQLModel 会话。
    """

    with Session(get_engine()) as session:
        try:
            yield session
        except SQLAlchemyError:
            session.rollback()
            raise
