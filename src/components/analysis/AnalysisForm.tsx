import { AlertCircle, Search } from 'lucide-react';

interface AnalysisFormProps {
  text: string;
  status: 'idle' | 'streaming' | 'success' | 'error';
  error: string | null;
  maxTextLength: number;
  canAnalyze: boolean;
  onTextChange: (value: string) => void;
  onAnalyze: () => void;
}

export function AnalysisForm({
  text,
  status,
  error,
  maxTextLength,
  canAnalyze,
  onTextChange,
  onAnalyze,
}: AnalysisFormProps) {
  return (
    <div className="card flex flex-col gap-6">
      <textarea
        className="w-full h-64 p-4 border border-brand-border bg-brand-light focus:bg-white focus:border-brand-dark outline-none resize-none font-sans text-sm leading-relaxed transition-colors"
        placeholder="在此粘贴英文文章，系统会通过 SSE 流式返回真实分析结果..."
        value={text}
        maxLength={maxTextLength}
        onChange={(event) => onTextChange(event.target.value)}
      />
      <div className="flex flex-col sm:flex-row justify-between gap-4 text-xs text-brand-muted font-sans">
        <span>建议输入 100–800 词的英文阅读材料</span>
        <span className={text.length > maxTextLength * 0.9 ? 'text-brand-accent' : ''}>
          {text.length}/{maxTextLength}
        </span>
      </div>

      {status === 'error' && error && (
        <div className="border border-brand-accent/40 bg-white p-4 flex items-start gap-3 text-sm text-brand-dark">
          <AlertCircle className="w-4 h-4 text-brand-accent mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-medium mb-1">分析失败</p>
            <p className="text-brand-muted leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={onAnalyze}
          disabled={!canAnalyze}
          className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === 'streaming' ? (
            <span className="animate-pulse">Streaming...</span>
          ) : (
            <>
              <Search className="w-4 h-4" />
              开始解析
            </>
          )}
        </button>
      </div>
    </div>
  );
}
