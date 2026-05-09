from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    """
    API 响应模型基类。

    后端内部继续使用 Python 习惯的 snake_case，响应给前端时统一输出 camelCase，
    避免前端在每个 hook 里手写字段转换逻辑。
    """

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )
