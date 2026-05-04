import { BrainCircuit, Bookmark } from 'lucide-react';

const DEMO_WORDS = [
  { id: '1', word: 'radical', phonetic: '/ˈrædɪkl/', translation: 'adj. 彻底的', exampleSentence: 'We need radical changes.', exampleTranslation: '我们需要彻底的变革。', reviewCount: 3, nextReviewDate: '2026-05-10' },
  { id: '2', word: 'detach', phonetic: '/dɪˈtætʃ/', translation: 'v. 脱离', exampleSentence: 'Building designs detach the designer.', exampleTranslation: '建筑设计使设计师脱离。', reviewCount: 1, nextReviewDate: '2026-05-06' },
  { id: '3', word: 'counter-intuitive', phonetic: '/ˌkaʊntər ɪnˈtjuːɪtɪv/', translation: 'adj. 反直觉的', exampleSentence: 'Designs appear counter-intuitive.', exampleTranslation: '设计显得反直觉。', reviewCount: 2, nextReviewDate: '2026-05-08' },
  { id: '4', word: 'choreography', phonetic: '/ˌkɒriˈɒɡrəfi/', translation: 'n. 编舞', exampleSentence: 'Choreography is an art.', exampleTranslation: '编舞是一门艺术。', reviewCount: 0, nextReviewDate: '2026-05-05' }
];

export default function Review() {
  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-12">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-serif mb-4">智能词汇复习</h1>
        <p className="text-brand-muted text-sm">今日待复习词汇：<span className="font-bold text-brand-accent">{DEMO_WORDS.length}</span> 个</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {DEMO_WORDS.map((word) => (
          <div key={word.id} className="card p-6 flex flex-col gap-4">
            <h3 className="text-2xl font-serif font-bold text-brand-accent">{word.word}</h3>
            <span className="text-sm text-brand-muted">{word.phonetic}</span>
            <p className="font-medium">{word.translation}</p>
            <div className="text-sm text-brand-muted border-l-2 pl-3">
              <p className="mb-1 italic">{word.exampleSentence}</p>
              <p className="text-xs opacity-80">{word.exampleTranslation}</p>
            </div>
            <div className="flex justify-between items-center text-xs text-brand-muted mt-auto pt-3 border-t border-brand-border">
              <span className="flex items-center gap-1"><Bookmark className="w-3 h-3" /> 已收藏</span>
              <span>已复习{word.reviewCount}次 · 下次 {word.nextReviewDate}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
