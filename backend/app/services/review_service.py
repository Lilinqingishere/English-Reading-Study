from datetime import datetime, timezone

from fsrs import Card, Rating, Scheduler, State
from sqlmodel import Session, col, select

from app.models.vocab import ReviewLog, Vocabulary
from app.schemas.review import ReviewRating, ReviewSubmitResponse
from app.schemas.vocab import VocabResponse
from app.services.vocab_repo import VocabNotFoundError, VocabRepo


class ReviewService:
    """
    FSRS 复习服务。

    负责今日队列查询和四档反馈排期。FSRS 包没有 `new` 状态，所以数据库中的
    `new` 在送入算法时映射为 Learning；这样前端仍能看到更直观的新词状态。
    """

    def __init__(self, session: Session) -> None:
        """
        Args:
            session: 当前请求作用域内数据库会话。
        """

        self._session = session
        self._scheduler = Scheduler(enable_fuzzing=False)

    def get_today_queue(self, user_id: int, *, limit: int = 50) -> list[VocabResponse]:
        """
        获取今日复习队列。

        Args:
            user_id: 当前用户 ID。
            limit: 最大返回数量。

        Returns:
            list[VocabResponse]: 今日应复习词条。
        """

        now = datetime.now(timezone.utc)
        statement = (
            select(Vocabulary)
            .where(
                Vocabulary.user_id == user_id,
                Vocabulary.is_collected.is_(True),
                (Vocabulary.next_review_at == None) | (Vocabulary.next_review_at <= now),
            )
            .order_by(col(Vocabulary.next_review_at).asc(), col(Vocabulary.created_at).asc())
            .limit(limit)
        )
        vocabularies = self._session.exec(statement).all()
        return [VocabRepo._to_response(vocab) for vocab in vocabularies]

    def submit_review(self, user_id: int, vocab_id: str, rating: ReviewRating) -> ReviewSubmitResponse:
        """
        提交复习反馈并更新 FSRS 排期。

        Args:
            user_id: 当前用户 ID。
            vocab_id: 生词 ID。
            rating: 用户四档反馈。

        Returns:
            ReviewSubmitResponse: 更新后的生词。

        Raises:
            VocabNotFoundError: 生词不存在。
        """

        vocab = VocabRepo(self._session).get_vocab_model(user_id=user_id, vocab_id=vocab_id)
        now = datetime.now(timezone.utc)
        state_before = vocab.fsrs_state
        stability_before = vocab.stability
        difficulty_before = vocab.difficulty
        # SQLite 不存 tzinfo，读出来是 naive datetime；统一标记为 UTC，避免与 aware now 相减时抛 TypeError。
        last_review_at = self._ensure_utc(vocab.last_review_at)

        card = self._to_fsrs_card(vocab)
        updated_card, review_log = self._scheduler.review_card(card, self._to_fsrs_rating(rating), now)

        vocab.stability = float(updated_card.stability or 0.0)
        vocab.difficulty = float(updated_card.difficulty or 0.0)
        vocab.next_review_at = updated_card.due
        vocab.last_review_at = review_log.review_datetime
        vocab.review_count += 1
        vocab.last_rating = rating.value
        vocab.fsrs_state = self._state_to_db(updated_card.state)
        vocab.updated_at = now
        if rating == ReviewRating.AGAIN:
            vocab.lapses += 1

        interval_days = 0.0
        if last_review_at is not None:
            # FSRS 间隔必须非负；系统时间被手动调整时也不能写入负数。
            interval_days = max(0.0, (now - last_review_at).total_seconds() / 86400)

        self._session.add(
            ReviewLog(
                vocab_id=vocab.id,
                rating=rating.value,
                state_before=state_before,
                stability_before=stability_before,
                difficulty_before=difficulty_before,
                state_after=vocab.fsrs_state,
                stability_after=vocab.stability,
                difficulty_after=vocab.difficulty,
                interval_days=interval_days,
                reviewed_at=now,
            )
        )
        self._session.add(vocab)
        self._session.commit()
        self._session.refresh(vocab)
        return ReviewSubmitResponse(vocabulary=VocabRepo._to_response(vocab), reviewed_count_delta=1)

    @staticmethod
    def _to_fsrs_rating(rating: ReviewRating) -> Rating:
        """
        将 API 评分映射为 FSRS 评分。
        """

        return {
            ReviewRating.AGAIN: Rating.Again,
            ReviewRating.HARD: Rating.Hard,
            ReviewRating.GOOD: Rating.Good,
            ReviewRating.EASY: Rating.Easy,
        }[rating]

    @staticmethod
    def _to_fsrs_card(vocab: Vocabulary) -> Card:
        """
        将数据库词条映射为 FSRS Card。

        SQLite 不存储 tzinfo，因此从 ORM 读出的 due/last_review 是 naive datetime；
        FSRS 内部会用调用方传入的 aware ``now`` 做减法，naive 与 aware 相减会抛
        TypeError，导致复习接口 500。这里统一补上 UTC tzinfo。
        """

        return Card(
            state=ReviewService._db_state_to_fsrs(vocab.fsrs_state),
            stability=vocab.stability or None,
            difficulty=vocab.difficulty or None,
            due=ReviewService._ensure_utc(vocab.next_review_at),
            last_review=ReviewService._ensure_utc(vocab.last_review_at),
        )

    @staticmethod
    def _ensure_utc(value: datetime | None) -> datetime | None:
        """
        将 naive datetime 视为 UTC aware datetime。

        Args:
            value: 数据库读出的 datetime，可能为 None 或 naive。

        Returns:
            datetime | None: 带 UTC tzinfo 的 datetime；输入为 None 时原样返回。
        """

        if value is None:
            return None
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc)

    @staticmethod
    def _db_state_to_fsrs(state: str) -> State:
        """
        数据库存储状态转 FSRS 状态。
        """

        return {
            "new": State.Learning,
            "learning": State.Learning,
            "review": State.Review,
            "relearning": State.Relearning,
        }.get(state, State.Learning)

    @staticmethod
    def _state_to_db(state: State) -> str:
        """
        FSRS 状态转数据库状态字符串。
        """

        return {
            State.Learning: "learning",
            State.Review: "review",
            State.Relearning: "relearning",
        }[state]
