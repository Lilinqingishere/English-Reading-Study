import { useCallback, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { useAsyncData } from '../hooks/useAsyncData';
import { ReviewCard } from '../components/review/ReviewCard';
import { ReviewStates } from '../components/review/ReviewStates';
import type { ReviewRating, VocabEntry } from '../types';

export default function Review() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnswerVisible, setIsAnswerVisible] = useState(false);
  const [pendingRating, setPendingRating] = useState<ReviewRating | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadQueue = useCallback(() => api.getTodayReview(50), []);
  const queueState = useAsyncData<VocabEntry[]>(loadQueue, {
    isEmpty: (value) => value.length === 0,
  });

  const queue = queueState.data ?? [];
  const currentWord = queue[currentIndex] ?? null;
  const reviewedCount = currentIndex;
  const totalCount = queue.length;

  const progressText = useMemo(() => {
    if (totalCount === 0) {
      return '0 / 0';
    }
    return `${Math.min(reviewedCount + 1, totalCount)} / ${totalCount}`;
  }, [reviewedCount, totalCount]);

  const submitRating = async (rating: ReviewRating) => {
    if (!currentWord || pendingRating) {
      return;
    }

    setPendingRating(rating);
    setFeedback(null);

    try {
      await api.submitReview(currentWord.id, rating);
      const nextIndex = currentIndex + 1;
      setIsAnswerVisible(false);
      setFeedback(`${currentWord.word} 已提交 FSRS 反馈：${rating}`);

      if (nextIndex >= totalCount) {
        await queueState.reload();
        setCurrentIndex(0);
      } else {
        setCurrentIndex(nextIndex);
      }
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : '复习提交失败，请稍后重试');
    } finally {
      setPendingRating(null);
    }
  };

  const retryQueue = async () => {
    setCurrentIndex(0);
    setIsAnswerVisible(false);
    setFeedback(null);
    await queueState.reload();
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-12">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-serif mb-4">智能词汇复习</h1>
        <p className="text-brand-muted text-sm">
          今日待复习词汇：
          <span className="font-bold text-brand-accent">{totalCount}</span> 个
        </p>
      </div>

      {(queueState.status === 'loading' || queueState.status === 'error' || queueState.status === 'empty') && (
        <ReviewStates status={queueState.status} error={queueState.error} onRetry={() => void retryQueue()} />
      )}

      {queueState.status === 'success' && currentWord && (
        <ReviewCard
          currentWord={currentWord}
          progressText={progressText}
          isAnswerVisible={isAnswerVisible}
          pendingRating={pendingRating}
          feedback={feedback}
          onRevealAnswer={() => setIsAnswerVisible(true)}
          onSubmitRating={(rating) => void submitRating(rating)}
        />
      )}
    </div>
  );
}
