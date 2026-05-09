from app.schemas.base import CamelModel


class HealthResponse(CamelModel):
    """
    健康检查响应。

    Attributes:
        status: 服务状态。
        app_name: 应用名称。
        env: 当前运行环境。
        model_name: 默认模型名。
        database_ready: 数据库是否已完成初始化。
    """

    status: str
    app_name: str
    env: str
    model_name: str
    database_ready: bool
