import { useState } from 'react';
import { api } from '../lib/api';
import { useAnalyzeStream } from '../hooks/useAnalyzeStream';
import { AnalysisForm } from '../components/analysis/AnalysisForm';
import { AnalysisResult } from '../components/analysis/AnalysisResult';
import type { AnalyzeVocabulary } from '../types';

const MAX_TEXT_LENGTH = 8000;

export default function Analysis() {
  const [text, setText] = useState('');
  const { analyze, reset, result, status, error: streamError } = useAnalyzeStream();
  const [actionError, setActionError] = useState<string | null>(null);
  const [isArticleCollected, setIsArticleCollected] = useState(false);
  const [isCollectingArticle, setIsCollectingArticle] = useState(false);
  const [collectedVocabIds, setCollectedVocabIds] = useState<Set<string>>(new Set());
  const [pendingVocabId, setPendingVocabId] = useState<string | null>(null);

  const trimmedText = text.trim();
  const canAnalyze = trimmedText.length > 0 && trimmedText.length <= MAX_TEXT_LENGTH && status !== 'streaming';
  const visibleError = actionError ?? streamError;

  const handleAnalyze = async () => {
    if (!canAnalyze) {
      return;
    }

    setActionError(null);
    setIsArticleCollected(false);
    setCollectedVocabIds(new Set());
    await analyze(trimmedText);
  };

  const handleCollectArticle = async () => {
    if (!result?.articleId || isArticleCollected || isCollectingArticle || status === 'streaming') {
      return;
    }

    setIsCollectingArticle(true);
    setActionError(null);

    try {
      await api.collectArticle(result.articleId, true);
      setIsArticleCollected(true);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '收藏文章失败，请稍后重试');
    } finally {
      setIsCollectingArticle(false);
    }
  };

  const handleAddVocab = async (vocab: AnalyzeVocabulary) => {
    if (!result?.articleId || status === 'streaming' || collectedVocabIds.has(vocab.id) || pendingVocabId === vocab.id) {
      return;
    }

    setPendingVocabId(vocab.id);
    setActionError(null);

    try {
      const created = await api.createVocab(vocab, result.articleId);
      setCollectedVocabIds((prev) => new Set(prev).add(vocab.id).add(created.id));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '加入生词本失败，请稍后重试');
    } finally {
      setPendingVocabId(null);
    }
  };

  const resetInput = () => {
    reset();
    setActionError(null);
    setIsArticleCollected(false);
    setCollectedVocabIds(new Set());
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
      <div className="text-center mb-2">
        <h1 className="text-4xl font-serif">阅读分析</h1>
      </div>

      {!result ? (
        <AnalysisForm
          text={text}
          status={status}
          error={visibleError}
          maxTextLength={MAX_TEXT_LENGTH}
          canAnalyze={canAnalyze}
          onTextChange={setText}
          onAnalyze={() => void handleAnalyze()}
        />
      ) : (
        <AnalysisResult
          result={result}
          error={visibleError}
          isStreaming={status === 'streaming'}
          isArticleCollected={isArticleCollected}
          isCollectingArticle={isCollectingArticle}
          collectedVocabIds={collectedVocabIds}
          pendingVocabId={pendingVocabId}
          onReset={resetInput}
          onCollectArticle={() => void handleCollectArticle()}
          onAddVocab={(vocab) => void handleAddVocab(vocab)}
        />
      )}
    </div>
  );
}
