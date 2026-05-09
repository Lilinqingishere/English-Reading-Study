from datetime import datetime, timezone

from sqlmodel import Session, col, select

from app.models.article import Article
from app.models.stats import UserStats
from app.models.vocab import Vocabulary
from app.schemas.vocab import VocabCreate, VocabResponse


class VocabNotFoundError(ValueError):
    """
    生词不存在或当前用户无权访问。
    """


class VocabSourceArticleNotFoundError(ValueError):
    """
    生词来源文章不存在或当前用户无权访问。
    """


class VocabRepo:
    """
    生词本数据访问服务。
    """

    def __init__(self, session: Session) -> None:
        """
        Args:
            session: 当前请求作用域内数据库会话。
        """

        self._session = session

    def list_vocab(self, user_id: int, *, limit: int = 50, offset: int = 0) -> list[VocabResponse]:
        """
        获取用户生词本列表。

        Args:
            user_id: 当前用户 ID。
            limit: 最大返回数量。
            offset: 偏移量。

        Returns:
            list[VocabResponse]: 生词本词条列表。
        """

        statement = (
            select(Vocabulary)
            .where(Vocabulary.user_id == user_id, Vocabulary.is_collected.is_(True))
            .order_by(col(Vocabulary.created_at).desc())
            .offset(offset)
            .limit(limit)
        )
        vocabularies = self._session.exec(statement).all()
        return [self._to_response(vocab) for vocab in vocabularies]

    def upsert_vocab(self, user_id: int, payload: VocabCreate) -> VocabResponse:
        """
        加入或重新加入生词本。

        Args:
            user_id: 当前用户 ID。
            payload: 生词创建请求。

        Returns:
            VocabResponse: 更新后的生词。
        """

        normalized_word = payload.word.strip()
        if payload.source_article_id is not None:
            self._ensure_source_article_exists(user_id=user_id, article_id=payload.source_article_id)
        existing = self._session.exec(
            select(Vocabulary).where(Vocabulary.user_id == user_id, Vocabulary.word == normalized_word)
        ).first()
        now = datetime.now(timezone.utc)
        stats = self._get_or_create_stats(user_id)

        if existing is not None:
            was_collected = existing.is_collected
            existing.phonetic = payload.phonetic
            existing.translation = payload.translation
            existing.example_en = payload.example_en
            existing.example_zh = payload.example_zh
            existing.source_article_id = payload.source_article_id or existing.source_article_id
            existing.is_collected = True
            existing.updated_at = now
            if not was_collected:
                stats.total_vocab_count += 1
            self._session.add(existing)
            self._session.add(stats)
            self._session.commit()
            self._session.refresh(existing)
            return self._to_response(existing)

        vocabulary = Vocabulary(
            user_id=user_id,
            word=normalized_word,
            phonetic=payload.phonetic,
            translation=payload.translation,
            example_en=payload.example_en,
            example_zh=payload.example_zh,
            source_article_id=payload.source_article_id,
            is_collected=True,
        )
        stats.total_vocab_count += 1
        stats.updated_at = now
        self._session.add(vocabulary)
        self._session.add(stats)
        self._session.commit()
        self._session.refresh(vocabulary)
        return self._to_response(vocabulary)

    def soft_delete_vocab(self, user_id: int, vocab_id: str) -> None:
        """
        将生词移出生词本。

        Args:
            user_id: 当前用户 ID。
            vocab_id: 生词 ID。

        Raises:
            VocabNotFoundError: 生词不存在。
        """

        vocab = self._get_vocab(user_id=user_id, vocab_id=vocab_id)
        if not vocab.is_collected:
            return

        vocab.is_collected = False
        vocab.updated_at = datetime.now(timezone.utc)
        stats = self._get_or_create_stats(user_id)
        stats.total_vocab_count = max(0, stats.total_vocab_count - 1)
        stats.updated_at = datetime.now(timezone.utc)
        self._session.add(vocab)
        self._session.add(stats)
        self._session.commit()

    def get_vocab_model(self, user_id: int, vocab_id: str) -> Vocabulary:
        """
        获取生词 ORM 模型。

        Args:
            user_id: 当前用户 ID。
            vocab_id: 生词 ID。

        Returns:
            Vocabulary: 生词 ORM 模型。
        """

        return self._get_vocab(user_id=user_id, vocab_id=vocab_id)

    def _get_vocab(self, user_id: int, vocab_id: str) -> Vocabulary:
        """
        获取当前用户已收藏生词。
        """

        vocab = self._session.exec(
            select(Vocabulary).where(
                Vocabulary.id == vocab_id,
                Vocabulary.user_id == user_id,
                Vocabulary.is_collected.is_(True),
            )
        ).first()
        if vocab is None:
            raise VocabNotFoundError("生词不存在")
        return vocab

    def _get_or_create_stats(self, user_id: int) -> UserStats:
        """
        获取或创建统计记录。
        """

        stats = self._session.get(UserStats, user_id)
        if stats is not None:
            return stats
        stats = UserStats(user_id=user_id)
        self._session.add(stats)
        self._session.commit()
        self._session.refresh(stats)
        return stats

    def _ensure_source_article_exists(self, user_id: int, article_id: str) -> None:
        """
        校验来源文章存在。
        """

        article = self._session.exec(
            select(Article.id).where(Article.id == article_id, Article.user_id == user_id)
        ).first()
        if article is None:
            raise VocabSourceArticleNotFoundError("来源文章不存在")

    @staticmethod
    def _to_response(vocab: Vocabulary) -> VocabResponse:
        """
        ORM 生词转响应模型。
        """

        return VocabResponse(
            id=vocab.id,
            word=vocab.word,
            phonetic=vocab.phonetic,
            translation=vocab.translation,
            example_en=vocab.example_en,
            example_zh=vocab.example_zh,
            source_article_id=vocab.source_article_id,
            is_collected=vocab.is_collected,
            review_count=vocab.review_count,
            lapses=vocab.lapses,
            stability=vocab.stability,
            difficulty=vocab.difficulty,
            fsrs_state=vocab.fsrs_state,
            last_rating=vocab.last_rating,
            last_review_at=vocab.last_review_at,
            next_review_at=vocab.next_review_at,
            created_at=vocab.created_at,
            updated_at=vocab.updated_at,
        )
