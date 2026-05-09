from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import Session


class HealthService:
    """
    健康检查服务。
    """

    def __init__(self, session: Session) -> None:
        """
        Args:
            session: 当前请求作用域内数据库会话。
        """

        self._session = session

    def is_database_ready(self) -> bool:
        """
        检查数据库是否可查询。

        Returns:
            bool: True 表示数据库可用。
        """

        try:
            self._session.execute(text("SELECT 1")).scalar_one()
        except SQLAlchemyError:
            return False
        return True
