import { AlertCircle, BrainCircuit, RotateCcw } from 'lucide-react';

interface ReviewStatesProps {
  status: 'loading' | 'error' | 'empty';
  error: string | null;
  onRetry: () => void;
}

export function ReviewStates({ status, error, onRetry }: ReviewStatesProps) {
  if (status === 'loading') {
    return <div className="card p-10 text-center text-brand-muted font-sans text-sm animate-pulse">正在加载今日 FSRS 复习队列...</div>;
  }

  if (status === 'error') {
    return (
      <div className="card p-8 flex flex-col gap-4 items-center text-center">
        <AlertCircle className="w-6 h-6 text-brand-accent" />
        <p className="text-sm text-brand-muted">{error}</p>
        <button onClick={onRetry} className="btn-secondary inline-flex items-center gap-2">
          <RotateCcw className="w-4 h-4" />重试
        </button>
      </div>
    );
  }

  return (
    <div className="card p-10 text-center flex flex-col gap-4 items-center">
      <BrainCircuit className="w-8 h-8 text-brand-accent" />
      <h2 className="text-2xl font-serif">今日没有待复习词汇</h2>
      <p className="text-sm text-brand-muted max-w-md leading-relaxed">
        先在阅读分析页把核心词加入生词本，后端 FSRS 会根据你的反馈自动安排下次复习。
      </p>
    </div>
  );
}
