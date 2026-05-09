from datetime import datetime, timezone

from sqlmodel import Session, col, select

from app.models.article import Article, LongSentence
from app.models.stats import UserStats
from app.models.vocab import ArticleVocab, Vocabulary
from app.schemas.analyze import AnalyzeResponse, AnalyzeSentence, AnalyzeVocabulary, Difficulty
from app.schemas.article import ArticleDetailResponse, ArticleResponse


class ArticleNotFoundError(ValueError):
    """
    文章不存在或当前用户无权访问。
    """


class ArticleRepo:
    """
    文章数据访问服务。

    统一处理文章、长难句、核心词关联和统计字段，避免路由层直接操作多张表。
    """

    def __init__(self, session: Session) -> None:
        """
        Args:
            session: 当前请求作用域内的数据库会话。
        """

        self._session = session

    def save_analysis_result(self, user_id: int, result: AnalyzeResponse) -> AnalyzeResponse:
        """
        保存一次阅读分析结果。

        Args:
            user_id: 当前用户 ID。
            result: LLM 分析后的响应模型。

        Returns:
            AnalyzeResponse: 写库后同步真实词汇 ID 的分析响应。
        """

        now = datetime.now(timezone.utc)
        article = Article(
            id=result.article_id,
            user_id=user_id,
            source_type="custom",
            title=result.title,
            content=result.original_text,
            translated_content=result.translation,
            difficulty=result.difficulty.value,
            word_count=result.word_count,
            is_collected=False,
            tokens_used=result.tokens_used,
            analysis_model=result.analysis_model,
            analysis_prompt_version="analyze_v2",
            created_at=now,
            updated_at=now,
        )
        self._session.add(article)

        for index, sentence in enumerate(result.long_sentences):
            self._session.add(
                LongSentence(
                    id=sentence.id,
                    article_id=article.id,
                    english=sentence.english,
                    chinese=sentence.chinese,
                    analysis=sentence.analysis,
                    seq=index,
                )
            )

        synced_vocab: list[AnalyzeVocabulary] = []
        for index, vocab in enumerate(result.core_vocabulary):
            vocabulary = self._upsert_analysis_vocabulary(user_id=user_id, article_id=article.id, vocab=vocab)
            self._link_article_vocab(article_id=article.id, vocab_id=vocabulary.id, seq=index)
            synced_vocab.append(
                AnalyzeVocabulary(
                    id=vocabulary.id,
                    word=vocabulary.word,
                    phonetic=vocabulary.phonetic or "",
                    translation=vocabulary.translation,
                    example_en=vocabulary.example_en or "",
                    example_zh=vocabulary.example_zh or "",
                )
            )

        stats = self._get_or_create_stats(user_id)
        stats.total_articles_analyzed += 1
        stats.updated_at = now
        self._session.add(stats)
        self._session.commit()

        result.core_vocabulary = synced_vocab
        return result

    def list_articles(
        self,
        user_id: int,
        *,
        difficulty: Difficulty | None = None,
        collected: bool | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> list[ArticleResponse]:
        """
        查询文章列表。

        Args:
            user_id: 当前用户 ID。
            difficulty: 可选难度筛选。
            collected: 是否只查收藏文章。None 时默认查阅读拓展文章。
            limit: 最大返回数量。
            offset: 偏移量。

        Returns:
            list[ArticleResponse]: 文章列表。
        """

        statement = select(Article).where(Article.user_id == user_id)
        if collected is None:
            statement = statement.where(Article.source_type == "extension")
        else:
            statement = statement.where(Article.is_collected == collected)
        if difficulty is not None:
            statement = statement.where(Article.difficulty == difficulty.value)

        statement = statement.order_by(col(Article.created_at).desc()).offset(offset).limit(limit)
        articles = self._session.exec(statement).all()
        return [self._to_response(article) for article in articles]

    def get_article_detail(self, user_id: int, article_id: str) -> ArticleDetailResponse:
        """
        获取文章详情。

        Args:
            user_id: 当前用户 ID。
            article_id: 文章 ID。

        Returns:
            ArticleDetailResponse: 文章详情。

        Raises:
            ArticleNotFoundError: 文章不存在。
        """

        article = self._get_article(user_id=user_id, article_id=article_id)
        vocabularies = self._session.exec(
            select(Vocabulary, ArticleVocab.seq)
            .join(ArticleVocab, ArticleVocab.vocab_id == Vocabulary.id)
            .where(ArticleVocab.article_id == article_id)
            .order_by(ArticleVocab.seq)
        ).all()
        sentences = self._session.exec(
            select(LongSentence).where(LongSentence.article_id == article_id).order_by(LongSentence.seq)
        ).all()

        base = self._to_response(article)
        return ArticleDetailResponse(
            **base.model_dump(),
            core_vocabulary=[
                AnalyzeVocabulary(
                    id=vocab.id,
                    word=vocab.word,
                    phonetic=vocab.phonetic or "",
                    translation=vocab.translation,
                    example_en=vocab.example_en or "",
                    example_zh=vocab.example_zh or "",
                )
                for vocab, _seq in vocabularies
            ],
            long_sentences=[
                AnalyzeSentence(
                    id=sentence.id,
                    english=sentence.english,
                    chinese=sentence.chinese,
                    analysis=sentence.analysis,
                )
                for sentence in sentences
            ],
        )

    def set_collected(self, user_id: int, article_id: str, is_collected: bool) -> ArticleResponse:
        """
        更新文章收藏状态。

        Args:
            user_id: 当前用户 ID。
            article_id: 文章 ID。
            is_collected: 是否收藏。

        Returns:
            ArticleResponse: 更新后的文章。
        """

        article = self._get_article(user_id=user_id, article_id=article_id)
        old_value = article.is_collected
        article.is_collected = is_collected
        article.updated_at = datetime.now(timezone.utc)

        stats = self._get_or_create_stats(user_id)
        if old_value is False and is_collected is True:
            stats.collected_article_count += 1
        elif old_value is True and is_collected is False:
            stats.collected_article_count = max(0, stats.collected_article_count - 1)
        stats.updated_at = datetime.now(timezone.utc)

        self._session.add(article)
        self._session.add(stats)
        self._session.commit()
        self._session.refresh(article)
        return self._to_response(article)

    def _get_article(self, user_id: int, article_id: str) -> Article:
        """
        查询当前用户的文章。
        """

        article = self._session.exec(
            select(Article).where(Article.id == article_id, Article.user_id == user_id)
        ).first()
        if article is None:
            raise ArticleNotFoundError("文章不存在")
        return article

    def _upsert_analysis_vocabulary(self, user_id: int, article_id: str, vocab: AnalyzeVocabulary) -> Vocabulary:
        """
        保存分析产生的核心词，但默认不加入生词本。
        """

        normalized_word = vocab.word.strip()
        existing = self._session.exec(
            select(Vocabulary).where(Vocabulary.user_id == user_id, Vocabulary.word == normalized_word)
        ).first()
        if existing is not None:
            existing.phonetic = vocab.phonetic
            existing.translation = vocab.translation
            existing.example_en = vocab.example_en
            existing.example_zh = vocab.example_zh
            existing.source_article_id = article_id
            existing.updated_at = datetime.now(timezone.utc)
            self._session.add(existing)
            return existing

        vocabulary = Vocabulary(
            id=vocab.id,
            user_id=user_id,
            word=normalized_word,
            phonetic=vocab.phonetic,
            translation=vocab.translation,
            example_en=vocab.example_en,
            example_zh=vocab.example_zh,
            source_article_id=article_id,
            is_collected=False,
        )
        self._session.add(vocabulary)
        return vocabulary

    def _link_article_vocab(self, article_id: str, vocab_id: str, seq: int) -> None:
        """
        建立文章与核心词关联。
        """

        existing = self._session.get(ArticleVocab, (article_id, vocab_id))
        if existing is not None:
            existing.seq = seq
            self._session.add(existing)
            return
        self._session.add(ArticleVocab(article_id=article_id, vocab_id=vocab_id, seq=seq))

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

    @staticmethod
    def _to_response(article: Article) -> ArticleResponse:
        """
        ORM 文章转 API 响应。
        """

        return ArticleResponse(
            id=article.id,
            title=article.title,
            original_text=article.content,
            translation=article.translated_content,
            difficulty=Difficulty(article.difficulty),
            word_count=article.word_count,
            is_collected=article.is_collected,
            source_type=article.source_type,
            source_name=article.source_name,
            source_url=article.source_url,
            source_license=article.source_license,
            attribution_text=article.attribution_text,
            published_at=article.published_at,
            created_at=article.created_at,
            analysis_model=article.analysis_model,
        )
