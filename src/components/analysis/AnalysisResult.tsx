import { AlertCircle, Bookmark, Check, ChevronRight, Plus } from 'lucide-react';
import type { AnalyzeResponse, AnalyzeVocabulary } from '../../types';
import { renderTextBlocks } from '../../lib/textBlocks';

interface AnalysisResultProps {
  result: AnalyzeResponse;
  error: string | null;
  isStreaming: boolean;
  isArticleCollected: boolean;
  isCollectingArticle: boolean;
  collectedVocabIds: Set<string>;
  pendingVocabId: string | null;
  onReset: () => void;
  onCollectArticle: () => void;
  onAddVocab: (vocab: AnalyzeVocabulary) => void;
}

export function AnalysisResult({
  result,
  error,
  isStreaming,
  isArticleCollected,
  isCollectingArticle,
  collectedVocabIds,
  pendingVocabId,
  onReset,
  onCollectArticle,
  onAddVocab,
}: AnalysisResultProps) {
  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col sm:flex-row justify-between gap-4 border-b pb-4">
        <button onClick={onReset} className="text-sm text-brand-muted hover:text-brand-dark flex items-center gap-1">
          <ChevronRight className="w-4 h-4 rotate-180" />重新输入
        </button>
        <button
          onClick={onCollectArticle}
          disabled={isStreaming || isArticleCollected || isCollectingArticle || !result.articleId}
          className={`flex items-center justify-center gap-2 px-4 py-2 border text-sm transition-colors ${
            isArticleCollected
              ? 'border-brand-accent text-brand-accent bg-white'
              : 'border-brand-dark hover:bg-brand-dark hover:text-white'
          } disabled:cursor-not-allowed disabled:opacity-80`}
        >
          {isArticleCollected ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          {isArticleCollected ? '已收藏' : isCollectingArticle ? '收藏中...' : '收藏全文'}
        </button>
      </div>

      {error && (
        <div className="border border-brand-border bg-white p-4 text-sm text-brand-muted flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-brand-accent mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <section className="space-y-4">
        <div>
          <h2 className="text-3xl font-serif">{result.title || '正在生成标题...'}</h2>
          <p className="text-xs uppercase tracking-widest text-brand-muted mt-2">
            {result.difficulty} · {result.wordCount} words · {result.analysisModel || 'streaming'} · {result.durationMs}ms
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-sm tracking-widest text-brand-muted uppercase mb-3">原文 Original</h2>
          <div className="bg-brand-light p-6 border border-brand-border text-sm leading-7 font-sans max-h-[520px] overflow-y-auto overscroll-contain space-y-4">
            {renderTextBlocks(result.originalText, '原文为空', 'whitespace-pre-wrap')}
          </div>
        </div>
        <div>
          <h2 className="text-sm tracking-widest text-brand-muted uppercase mb-3">译文 Translation</h2>
          <div className="text-brand-muted bg-brand-light p-6 border border-brand-border text-sm leading-7 font-sans min-h-40 max-h-[520px] overflow-y-auto overscroll-contain space-y-4">
            {renderTextBlocks(result.translation, '译文正在返回中...', 'whitespace-pre-wrap')}
          </div>
        </div>
      </div>

      <section className="space-y-6">
        <h2 className="text-2xl font-serif border-b pb-4">核心词汇 Core Vocabulary</h2>
        {result.coreVocabulary.length === 0 ? (
          <div className="border border-dashed border-brand-border p-6 text-sm text-brand-muted text-center">核心词汇正在返回中...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {result.coreVocabulary.map((vocab) => {
              const isCollected = collectedVocabIds.has(vocab.id);
              return (
                <div key={vocab.id} className="card p-6 flex flex-col gap-4 fade-in-up">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-serif font-bold text-brand-accent">{vocab.word}</h3>
                      <span className="text-sm text-brand-muted">{vocab.phonetic}</span>
                    </div>
                    <button
                      onClick={() => onAddVocab(vocab)}
                      disabled={isStreaming || isCollected || pendingVocabId === vocab.id}
                      className="text-xs font-sans uppercase tracking-widest text-brand-muted hover:text-brand-accent transition-colors disabled:text-brand-accent disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      {isCollected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                      {isCollected ? '已加入' : pendingVocabId === vocab.id ? '加入中' : '生词本'}
                    </button>
                  </div>
                  <p className="font-medium text-sm">{vocab.translation}</p>
                  <div className="text-sm text-brand-muted border-l-2 border-brand-border pl-3">
                    <p className="mb-1">{vocab.exampleEn}</p>
                    <p className="opacity-80">{vocab.exampleZh}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-serif border-b pb-4">长难句解析 Long Sentences</h2>
        {result.longSentences.length === 0 ? (
          <div className="border border-dashed border-brand-border p-6 text-sm text-brand-muted text-center">长难句解析正在返回中...</div>
        ) : (
          result.longSentences.map((sentence) => (
            <div key={sentence.id} className="bg-brand-light p-6 border border-brand-border fade-in-up">
              <p className="font-serif text-lg mb-4">{sentence.english}</p>
              <p className="text-brand-muted mb-6">{sentence.chinese}</p>
              <div className="bg-white p-4 border border-brand-border text-sm">
                <span className="font-bold text-brand-accent mr-2">结构分析:</span>
                {sentence.analysis}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
