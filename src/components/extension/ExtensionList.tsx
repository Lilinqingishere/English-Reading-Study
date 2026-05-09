import { AlertCircle, BookOpen, RotateCcw } from 'lucide-react';
import type { AsyncStatus } from '../../hooks/useAsyncData';
import type { ArticleSummary } from '../../types';

interface ExtensionListProps {
  articles: ArticleSummary[];
  status: AsyncStatus;
  error: string | null;
  onReload: () => void;
  onSelect: (articleId: string) => void;
}

export function ExtensionList({ articles, status, error, onReload, onSelect }: ExtensionListProps) {
  return (
    <div className="grid grid-cols-1 gap-6">
      {status === 'loading' && (
        <div className="card p-10 text-center text-brand-muted font-sans text-sm animate-pulse">正在从后端加载真实文章...</div>
      )}

      {status === 'error' && (
        <div className="card p-8 flex flex-col gap-4 items-center text-center">
          <AlertCircle className="w-6 h-6 text-brand-accent" />
          <p className="text-sm text-brand-muted">{error}</p>
          <button onClick={onReload} className="btn-secondary inline-flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />重试
          </button>
        </div>
      )}

      {status === 'empty' && (
        <div className="card p-10 text-center text-brand-muted font-sans text-sm">
          后端暂未返回阅读拓展文章，请先在后端执行 seed，再刷新页面。
        </div>
      )}

      {(status === 'success' || status === 'empty') && articles.map((article) => (
        <article
          key={article.id}
          className="card p-6 cursor-pointer hover:border-brand-accent transition-colors group"
          onClick={() => onSelect(article.id)}
        >
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-brand-accent mb-3">
                <BookOpen className="w-4 h-4" />
                <span className="text-xs uppercase tracking-widest font-sans">{article.sourceName ?? 'Reading Source'}</span>
              </div>
              <h2 className="text-2xl font-serif group-hover:text-brand-accent transition-colors">{article.title}</h2>
              <p className="text-sm text-brand-muted mt-3 line-clamp-2">{article.originalText}</p>
            </div>
            <div className="flex md:flex-col items-center md:items-end gap-3 text-xs text-brand-muted font-sans shrink-0">
              <span>{article.difficulty}</span>
              <span>{article.wordCount} words</span>
              {article.isCollected && <span className="text-brand-accent">已收藏</span>}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
