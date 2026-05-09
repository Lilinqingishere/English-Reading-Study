from typing import Annotated

from fastapi import Depends
from sqlmodel import Session

from app.db import get_session

SessionDep = Annotated[Session, Depends(get_session)]


def get_current_user_id() -> int:
    """
    返回当前演示用户 ID。

    MVP 阶段没有账号系统，先统一使用 demo_user(id=1)。后续接入登录时，
    只需要替换这个依赖即可，业务层不用感知鉴权实现细节。

    Returns:
        int: 当前用户 ID。
    """

    return 1


CurrentUserIdDep = Annotated[int, Depends(get_current_user_id)]
