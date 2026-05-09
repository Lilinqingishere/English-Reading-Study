from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    后端运行配置。

    所有可变配置都从环境变量或 .env 读取，避免把 API Key、数据库路径、
    模型参数硬编码在业务代码里。这样本地演示和后续部署可以共用同一套代码。
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8-sig",
        extra="ignore",
    )

    app_name: str = "English Reading Academy"
    env: str = "dev"
    api_prefix: str = "/api"

    dashscope_api_key: str = Field(default="", repr=False)
    model_name: str = "qwen-turbo"
    model_temperature: float = 0.3
    model_max_tokens: int = 8192
    model_timeout_s: int = 60
    model_max_retries: int = 2

    db_url: str = "sqlite:///./data/app.db"
    sqlite_busy_timeout_ms: int = 5000
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    log_level: str = "INFO"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """
    返回进程级配置单例。

    Returns:
        Settings: 当前进程加载后的配置对象。
    """

    return Settings()


settings = get_settings()
