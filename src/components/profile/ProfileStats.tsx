import { BookMarked, BrainCircuit, Clock } from 'lucide-react';
import type { StatsResponse } from '../../types';

interface ProfileStatsProps {
  stats: StatsResponse | null;
  collectedArticleCount: number;
  vocabCount: number;
}

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function ProfileStats({ stats, collectedArticleCount, vocabCount }: ProfileStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="card flex flex-col items-center justify-center gap-2 p-10 bg-[#f0e6cc] text-brand-dark border-none relative overflow-hidden group">
        <Clock className="w-8 h-8 text-brand-accent mb-2 group-hover:scale-110 transition-transform duration-500" />
        <h3 className="text-3xl font-serif font-bold">{formatTime(stats?.totalStudyTimeSeconds ?? 0)}</h3>
        <p className="text-sm font-sans text-brand-muted uppercase tracking-widest">学习总时长</p>
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-brand-accent rounded-full opacity-20 blur-3xl group-hover:opacity-30 transition-opacity duration-500" />
      </div>

      <div className="card flex flex-col items-center justify-center gap-2 p-10 group relative overflow-hidden">
        <BookMarked className="w-8 h-8 text-brand-dark mb-2 group-hover:text-brand-accent transition-colors duration-500" />
        <h3 className="text-3xl font-serif font-bold text-brand-dark">{stats?.collectedArticleCount ?? collectedArticleCount}</h3>
        <p className="text-sm font-sans text-brand-muted uppercase tracking-widest">收藏文章数</p>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-brand-light rounded-full opacity-50 blur-3xl group-hover:opacity-100 transition-opacity duration-500" />
      </div>

      <div className="card flex flex-col items-center justify-center gap-2 p-10 group relative overflow-hidden">
        <BrainCircuit className="w-8 h-8 text-brand-dark mb-2 group-hover:text-brand-accent transition-colors duration-500" />
        <h3 className="text-3xl font-serif font-bold text-brand-dark">{stats?.totalVocabCount ?? vocabCount}</h3>
        <p className="text-sm font-sans text-brand-muted uppercase tracking-widest">生词本词汇</p>
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-light rounded-full opacity-50 blur-3xl group-hover:opacity-100 transition-opacity duration-500" />
      </div>
    </div>
  );
}
