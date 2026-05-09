import { useCallback, useState } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { api } from '../lib/api';
import { useAsyncData } from '../hooks/useAsyncData';
import { ProfileStats } from '../components/profile/ProfileStats';
import { ProfileTabs } from '../components/profile/ProfileTabs';
import type { ArticleSummary, StatsResponse, VocabEntry } from '../types';

export default function Profile() {
  const [activeTab, setActiveTab] = useState<'articles' | 'words'>('articles');
  const [pendingArticleId, setPendingArticleId] = useState<string | null>(null);
  const [pendingVocabId, setPendingVocabId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadStats = useCallback(() => api.getStats(), []);
  const loadCollectedArticles = useCallback(() => api.listArticles({ collected: true, limit: 100 }), []);
  const loadVocab = useCallback(() => api.listVocab({ limit: 100 }), []);

  const statsState = useAsyncData<StatsResponse>(loadStats);
  const articlesState = useAsyncData<ArticleSummary[]>(loadCollectedArticles, {
    isEmpty: (value) => value.length === 0,
  });
  const vocabState = useAsyncData<VocabEntry[]>(loadVocab, {
    isEmpty: (value) => value.length === 0,
  });

  const stats = statsState.data;
  const collectedArticles = articlesState.data ?? [];
  const collectedWords = vocabState.data ?? [];
  const isInitialLoading = statsState.status === 'loading' || articlesState.status === 'loading' || vocabState.status === 'loading';

  const refreshAll = async () => {
    setActionError(null);
    await Promise.all([statsState.reload(), articlesState.reload(), vocabState.reload()]);
  };

  const removeArticle = async (articleId: string) => {
    if (pendingArticleId === articleId) {
      return;
    }

    setPendingArticleId(articleId);
    setActionError(null);

    try {
      await api.collectArticle(articleId, false);
      articlesState.setData((prev) => prev?.filter((article) => article.id !== articleId) ?? prev);
      await statsState.reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '取消收藏失败，请稍后重试');
    } finally {
      setPendingArticleId(null);
    }
  };

  const removeVocabulary = async (vocabId: string) => {
    if (pendingVocabId === vocabId) {
      return;
    }

    setPendingVocabId(vocabId);
    setActionError(null);

    try {
      await api.deleteVocab(vocabId);
      vocabState.setData((prev) => prev?.filter((word) => word.id !== vocabId) ?? prev);
      await statsState.reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '移出生词本失败，请稍后重试');
    } finally {
      setPendingVocabId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-12">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-serif mb-4">个人中心</h1>
        <p className="text-brand-muted font-sans text-sm">
          查看您的学习数据与收藏内容
        </p>
      </div>

      {(statsState.status === 'error' || articlesState.status === 'error' || vocabState.status === 'error') && (
        <div className="card p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-brand-accent mt-0.5 shrink-0" />
            <p className="text-sm text-brand-muted">
              {statsState.error || articlesState.error || vocabState.error || '个人中心数据加载失败，请稍后重试'}
            </p>
          </div>
          <button onClick={() => void refreshAll()} className="btn-secondary inline-flex items-center gap-2 shrink-0">
            <RotateCcw className="w-4 h-4" />重试
          </button>
        </div>
      )}

      {isInitialLoading && (
        <div className="card p-8 text-center text-brand-muted font-sans text-sm animate-pulse">
          正在从后端同步学习统计、收藏文章与生词本...
        </div>
      )}

      <ProfileStats stats={stats} collectedArticleCount={collectedArticles.length} vocabCount={collectedWords.length} />

      {actionError && (
        <div className="border border-brand-border bg-white p-4 text-sm text-brand-muted flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-brand-accent mt-0.5 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      <ProfileTabs
        activeTab={activeTab}
        articles={collectedArticles}
        words={collectedWords}
        pendingArticleId={pendingArticleId}
        pendingVocabId={pendingVocabId}
        onTabChange={setActiveTab}
        onRemoveArticle={(articleId) => void removeArticle(articleId)}
        onRemoveVocabulary={(vocabId) => void removeVocabulary(vocabId)}
      />
    </div>
  );
}
