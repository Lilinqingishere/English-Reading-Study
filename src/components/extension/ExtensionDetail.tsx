import { AlertCircle, Bookmark, Check, ChevronRight, ExternalLink, RotateCcw } from 'lucide-react';
import type { ArticleDetail } from '../../types';
import { renderTextBlocks } from '../../lib/textBlocks';

interface ExtensionDetailProps {
  selectedArticleId: string;
  article: ArticleDetail | null;
  status: 'idle' | 'loading' | 'success' | 'error';
  error: string | null;
  pendingCollectId: string | null;
  onBack: () => void;
  onRetry: (articleId: string) => void;
  onToggleCollect: (articleId: string, isCollected: boolean) => void;
}

export function ExtensionDetail({
  selectedArticleId,
  article,
  status,
  error,
  pendingCollectId,
  onBack,
  onRetry,
  onToggleCollect,
}: ExtensionDetailProps) {
  const hasAttribution =
    Boolean(article?.attributionText) ||
    Boolean(article?.sourceUrl) ||
    Boolean(article?.sourceLicense) ||
    Boolean(article?.sourceName);

  return (
    <div className="flex flex-col gap-8">
      <button onClick={onBack} className="text-sm text-brand-muted hover:text-brand-dark flex items-center gap-1 w-fit">
        <ChevronRight className="w-4 h-4 rotate-180" />返回列表
      </button>

      {status === 'loading' && (
        <div className="card p-10 text-center text-brand-muted font-sans text-sm animate-pulse">正在加载真实文章详情...</div>
      )}

      {status === 'error' && (
        <div className="card p-8 flex flex-col gap-4 items-center text-center">
          <AlertCircle className="w-6 h-6 text-brand-accent" />
          <p className="text-sm text-brand-muted">{error}</p>
          <button onClick={() => onRetry(selectedArticleId)} className="btn-secondary inline-flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />重试
          </button>
        </div>
      )}

      {status === 'success' && article && (
        <>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 border-b border-brand-border pb-6">
            <div>
              <h1 className="text-3xl font-serif">{article.title}</h1>
              <p className="text-xs text-brand-muted uppercase tracking-widest mt-3">
                {article.sourceName ?? 'Unknown Source'} · {article.difficulty} · {article.wordCount} words
              </p>
            </div>
            <button
              onClick={() => onToggleCollect(article.id, !article.isCollected)}
              disabled={pendingCollectId === article.id}
              className={`flex items-center justify-center gap-2 px-4 py-2 border text-sm transition-colors ${
                article.isCollected
                  ? 'border-brand-accent text-brand-accent bg-white'
                  : 'border-brand-dark hover:bg-brand-dark hover:text-white'
              } disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {article.isCollected ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              {article.isCollected ? '已收藏' : '收藏文章'}
            </button>
          </div>

          {error && <div className="border border-brand-border bg-white p-4 text-sm text-brand-muted">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            <div className="flex flex-col">
              <h2 className="text-sm uppercase tracking-widest text-brand-muted mb-3">原文 Original</h2>
              <div className="flex-1 bg-brand-light p-6 border border-brand-border text-sm leading-7 font-sans min-h-40 max-h-[520px] overflow-y-auto overscroll-contain space-y-4">
                {renderTextBlocks(article.originalText, '原文为空', 'whitespace-pre-wrap')}
              </div>
            </div>
            <div className="flex flex-col">
              <h2 className="text-sm uppercase tracking-widest text-brand-muted mb-3">译文 Translation</h2>
              <div className="flex-1 text-brand-muted bg-brand-light p-6 border border-brand-border text-sm leading-7 font-sans min-h-40 max-h-[520px] overflow-y-auto overscroll-contain space-y-4">
                {renderTextBlocks(article.translation, '译文为空', 'whitespace-pre-wrap')}
              </div>
            </div>
          </div>

          {article.coreVocabulary.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-2xl font-serif border-b border-brand-border pb-4">核心词汇 Core Vocabulary</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {article.coreVocabulary.map((vocab) => (
                  <div key={vocab.id} className="card p-6 flex flex-col gap-3">
                    <div>
                      <h3 className="text-xl font-serif font-bold text-brand-accent">{vocab.word}</h3>
                      {vocab.phonetic && <span className="text-sm text-brand-muted">{vocab.phonetic}</span>}
                    </div>
                    <p className="font-medium text-sm">{vocab.translation}</p>
                    <div className="text-sm text-brand-muted border-l-2 border-brand-border pl-3">
                      <p className="mb-1">{vocab.exampleEn}</p>
                      <p className="opacity-80">{vocab.exampleZh}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {hasAttribution && (
            <div className="card p-6 flex flex-col gap-3">
              <h2 className="text-sm uppercase tracking-widest text-brand-muted">Attribution</h2>
              {article.attributionText && <p className="text-sm text-brand-dark leading-relaxed">{article.attributionText}</p>}
              <div className="flex flex-wrap gap-4 text-xs text-brand-muted font-sans">
                {article.sourceUrl && (
                  <a
                    href={article.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 hover:text-brand-accent transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />查看原始来源
                  </a>
                )}
                {article.sourceLicense && <span>License: {article.sourceLicense}</span>}
                {article.analysisModel && <span>Analyzed by {article.analysisModel}</span>}
              </div>
            </div>
          )}

          {article.longSentences.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-2xl font-serif border-b border-brand-border pb-4">长难句解析 Long Sentences</h2>
              {article.longSentences.map((sentence) => (
                <div key={sentence.id} className="bg-brand-light p-6 border border-brand-border">
                  <p className="font-serif text-lg mb-4">{sentence.english}</p>
                  <p className="text-brand-muted mb-4">{sentence.chinese}</p>
                  <p className="bg-white border border-brand-border p-4 text-sm">{sentence.analysis}</p>
                </div>
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
