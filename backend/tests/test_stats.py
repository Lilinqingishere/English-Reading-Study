from fastapi.testclient import TestClient


def test_get_stats_returns_initial_demo_user_stats(client: TestClient) -> None:
    """
    验证个人中心统计接口在首次启动时返回初始化数据。
    """

    response = client.get("/api/stats")

    assert response.status_code == 200
    body = response.json()
    assert body["totalStudyTimeSeconds"] == 0
    assert body["streakDays"] == 0
    assert body["totalArticlesAnalyzed"] == 0
    assert body["collectedArticleCount"] == 0
    assert body["totalVocabCount"] == 0
    assert body["lastStudyDate"] is None


def test_add_study_time_updates_total_seconds(client: TestClient) -> None:
    """
    验证学习时长上报接口会累加秒数并更新连续学习天数。
    """

    response = client.post("/api/stats/study-time", json={"seconds": 5})

    assert response.status_code == 200
    body = response.json()
    assert body["totalStudyTimeSeconds"] == 5
    assert body["streakDays"] == 1
    assert body["lastStudyDate"] is not None


def test_add_study_time_rejects_invalid_seconds(client: TestClient) -> None:
    """
    验证非法学习时长会被 Pydantic 拦截，避免脏数据写入数据库。
    """

    response = client.post("/api/stats/study-time", json={"seconds": 0})

    assert response.status_code == 422
