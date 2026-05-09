from fastapi.testclient import TestClient


def test_healthz_returns_service_status(client: TestClient) -> None:
    """
    验证健康检查接口返回服务状态与 camelCase 字段。
    """

    response = client.get("/healthz")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["appName"] == "English Reading Academy"
    assert body["modelName"] == "qwen-turbo"
    assert body["databaseReady"] is True
