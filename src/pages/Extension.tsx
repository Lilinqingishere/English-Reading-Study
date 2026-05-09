import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useAsyncData } from '../hooks/useAsyncData';
import { ExtensionDetail } from '../components/extension/ExtensionDetail';
import { ExtensionList } from '../components/extension/ExtensionList';
import type { ArticleDetail, ArticleSummary } from '../types';

export default function Extension() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<ArticleDetail | null>(null);
  const [detailStatus, setDetailStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [detailError, setDetailError] = useState<string | null>(null);
  const [pendingCollectId, setPendingCollectId] = useState<string | null>(null);

  const loadArticles = useCallback(() => api.listArticles({ limit: 50 }), []);
  const articlesState = useAsyncData<ArticleSummary[]>(loadArticles, {
    isEmpty: (value) => value.length === 0,
  });

  const articles = articlesState.data ?? [];

  const loadDetail = useCallback(async (articleId: string) => {
    setSelectedArticleId(articleId);
    setDetailStatus('loading');
    setDetailError(null);

    try {
      const detail = await api.getArticle(articleId);
      setSelectedArticle(detail);
      setDetailStatus('success');
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : '文章详情加载失败，请稍后重试');
      setDetailStatus('error');
    }
  }, []);

  useEffect(() => {
    const articleId = searchParams.get('articleId');
    if (!articleId || articleId === selectedArticleId) {
      return;
    }

    void loadDetail(articleId);
  }, [loadDetail, searchParams, selectedArticleId]);

  const resetDetail = () => {
    setSearchParams({});
    setSelectedArticleId(null);
    setSelectedArticle(null);
    setDetailStatus('idle');
    setDetailError(null);
  };

  const updateArticleCollection = async (articleId: string, isCollected: boolean) => {
    if (pendingCollectId === articleId) {
      return;
    }

    setPendingCollectId(articleId);
    setDetailError(null);

    try {
      const updated = await api.collectArticle(articleId, isCollected);
      articlesState.setData((prev) => prev?.map((article) => (article.id === articleId ? updated : article)) ?? prev);
      setSelectedArticle((prev) => (prev && prev.id === articleId ? { ...prev, isCollected } : prev));
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : '收藏状态更新失败，请稍后重试');
    } finally {
      setPendingCollectId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-12">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-serif mb-4">阅读拓展</h1>
        <p className="text-brand-muted text-sm">精选优质文章，拓宽视野与词汇量</p>
      </div>

      {selectedArticleId ? (
        <ExtensionDetail
          selectedArticleId={selectedArticleId}
          article={selectedArticle}
          status={detailStatus}
          error={detailError}
          pendingCollectId={pendingCollectId}
          onBack={resetDetail}
          onRetry={(articleId) => void loadDetail(articleId)}
          onToggleCollect={(articleId, isCollected) => void updateArticleCollection(articleId, isCollected)}
        />
      ) : (
        <ExtensionList
          articles={articles}
          status={articlesState.status}
          error={articlesState.error}
          onReload={() => void articlesState.reload()}
          onSelect={(articleId) => {
            setSearchParams({ articleId });
            void loadDetail(articleId);
          }}
        />
      )}
    </div>
  );
}
