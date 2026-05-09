from enum import StrEnum

from app.schemas.base import CamelModel
from app.schemas.vocab import VocabResponse


class ReviewRating(StrEnum):
    """
    复习反馈枚举。
    """

    AGAIN = "again"
    HARD = "hard"
    GOOD = "good"
    EASY = "easy"


class ReviewSubmitRequest(CamelModel):
    """
    复习反馈请求。
    """

    rating: ReviewRating


class ReviewSubmitResponse(CamelModel):
    """
    复习反馈响应。
    """

    vocabulary: VocabResponse
    reviewed_count_delta: int
