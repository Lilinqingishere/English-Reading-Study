import { AlertCircle, Bookmark, Check } from 'lucide-react';
import type { ReviewRating, VocabEntry } from '../../types';

const reviewRatings: Array<{ value: ReviewRating; label: string; hint: string; className: string }> = [
  { value: 'again', label: 'Again', hint: '完全忘记', className: 'btn-secondary' },
  { value: 'hard', label: 'Hard', hint: '想起来很吃力', className: 'btn-secondary' },
  { value: 'good', label: 'Good', hint: '基本掌握', className: 'bg-[#FAF1DE] text-brand-dark border border-[#E8D8B8] hover:bg-[#F5E4C2]' },
  { value: 'easy', label: 'Easy', hint: '非常熟悉', className: 'bg-[#F6E7C8] text-brand-dark border border-[#E3CFA5] hover:bg-[#F1DDB7]' },
];

interface ReviewCardProps {
  currentWord: VocabEntry;
  progressText: string;
  isAnswerVisible: boolean;
  pendingRating: ReviewRating | null;
  feedback: string | null;
  onRevealAnswer: () => void;
  onSubmitRating: (rating: ReviewRating) => void;
}

export function ReviewCard({
  currentWord,
  progressText,
  isAnswerVisible,
  pendingRating,
  feedback,
  onRevealAnswer,
  onSubmitRating,
}: ReviewCardProps) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center text-xs text-brand-muted font-sans uppercase tracking-widest">
        <span>Review Progress</span>
        <span>{progressText}</span>
      </div>

      <div className="card p-8 md:p-12 flex flex-col gap-8 text-center">
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-1 text-xs text-brand-muted font-sans uppercase tracking-widest">
            <Bookmark className="w-3 h-3" /> 已收藏 · 复习 {currentWord.reviewCount} 次
          </span>
        </div>

        <div className="space-y-4">
          <h3 className="text-5xl md:text-6xl font-serif font-bold text-brand-accent">{currentWord.word}</h3>
          {currentWord.phonetic && <span className="text-sm text-brand-muted">{currentWord.phonetic}</span>}
        </div>

        {!isAnswerVisible ? (
          <button onClick={onRevealAnswer} className="btn-primary mx-auto">
            显示答案
          </button>
        ) : (
          <div className="flex flex-col gap-8 fade-in-up">
            <div className="space-y-4">
              <p className="font-medium text-brand-dark">{currentWord.translation}</p>
              {(currentWord.exampleEn || currentWord.exampleZh) && (
                <div className="text-sm text-brand-muted border-l-2 border-brand-border pl-4 text-left max-w-2xl mx-auto">
                  {currentWord.exampleEn && <p className="mb-2 italic">{currentWord.exampleEn}</p>}
                  {currentWord.exampleZh && <p className="opacity-80">{currentWord.exampleZh}</p>}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {reviewRatings.map((rating) => (
                <button
                  key={rating.value}
                  onClick={() => onSubmitRating(rating.value)}
                  disabled={pendingRating !== null}
                  className={`${rating.className} px-4 py-3 flex flex-col items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <span>{pendingRating === rating.value ? '提交中' : rating.label}</span>
                  <span className="text-[10px] opacity-70 normal-case tracking-normal">{rating.hint}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center text-xs text-brand-muted mt-auto pt-3 border-t border-brand-border">
          <span>FSRS State: {currentWord.fsrsState}</span>
          <span>下次 {currentWord.nextReviewAt ? new Date(currentWord.nextReviewAt).toLocaleDateString() : '待生成'}</span>
        </div>
      </div>

      {feedback && (
        <div className="border border-brand-border bg-white p-4 text-sm text-brand-muted flex items-center gap-2">
          {feedback.startsWith(currentWord.word) ? <Check className="w-4 h-4 text-brand-accent" /> : <AlertCircle className="w-4 h-4 text-brand-accent" />}
          <span>{feedback}</span>
        </div>
      )}
    </div>
  );
}
