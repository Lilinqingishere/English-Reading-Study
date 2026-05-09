from collections.abc import Generator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.db import init_db, reset_engine
from main import app


@pytest.fixture(name="client")
def client_fixture(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Generator[TestClient, None, None]:
    """
    创建测试客户端。

    Args:
        tmp_path: pytest 临时目录。
        monkeypatch: pytest 环境替换工具。

    Yields:
        TestClient: FastAPI 测试客户端。
    """

    test_db = tmp_path / "test.db"
    monkeypatch.setattr(settings, "db_url", f"sqlite:///{test_db}")
    reset_engine()
    init_db()

    with TestClient(app) as test_client:
        yield test_client
