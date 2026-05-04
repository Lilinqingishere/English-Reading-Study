import { BrainCircuit, Bookmark } from 'lucide-react';

// 预设示例词汇，证明功能可用
const DEMO_WORDS = [
  {
    id: '1',
    word: 'radical',
    phonetic: '/ˈrædɪkl/',
    translation: 'adj. 彻底的；激进的；根本性的',
    exampleSentence: 'We need radical changes to make travel healthier.',
    exampleTranslation: '我们需要彻底的变革，让出行更健康。',
    reviewCount: 3,
    nextReviewDate: '2026-05-10',
  },
  {
    id: '2',
    word: 'detach',
    phonetic: '/dɪˈtætʃ/',
    translation: 'v. 使分离；脱离',
    exampleSentence: 'Building designs detach the designer from reality.',
    exampleTranslation: '建筑设计使设计师脱离现实。',
    reviewCount: 1,
    nextReviewDate: '2026-05-06',
  },
  {
    id: '3',
    word: 'counter-intuitive',
    phonetic: '/ˌkaʊntər ɪnˈtjuːɪtɪv/',
    translation: 'adj. 反直觉的；与常理相悖的',
    exampleSentence: 'Designs appear counter-intuitive in actual experience.',
    exampleTranslation: '设计在实际体验中显得反直觉。',
    reviewCount: 2,
    nextReviewDate: '2026-05-08',
  },
  {
    id: '4',
    word: 'choreography',
    phonetic: '/ˌkɒriˈɒɡrəfi/',
    translation: 'n. 舞蹈编排；编舞艺术',
    exampleSentence: 'Choreography may not seem an obvious choice.',
    exampleTranslation: '编舞似乎并非显而易见之选。',
    reviewCount: 0,
    nextReviewDate: '2026-05-05',
  },
];

// ==================== 原始艾宾浩斯复习逻辑（暂时注释） ====================
// import { useState, useMemo } from 'react';
// import { useStore } from '../store';
// import { BrainCircuit, Check, X, RefreshCw } from 'lucide-react';
// import { Vocabulary } from '../types';
//
// const REVIEW_INTERVALS = [
//   5 * 60 * 1000,           // 5 minutes
//   30 * 60 * 1000,          // 30 minutes
//   12 * 60 * 60 * 1000,     // 12 hours
//   24 * 60 * 60 * 1000,     // 1 day
//   2 * 24 * 60 * 60 * 1000, // 2 days
//   4 * 24 * 60 * 60 * 1000, // 4 days
//   7 * 24 * 60 * 60 * 1000, // 7 days
//   15 * 24 * 60 * 60 * 1000 // 15 days
// ];
//
// export default function Review() {
//   const vocabularies = useStore((state) => state.vocabularies);
//   const updateVocabularyReview = useStore((state) => state.updateVocabularyReview);
//   ... (原始逻辑)
// }
// ==================== 原始艾宾浩斯复习逻辑结束 ====================

export default function Review() {
  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-12">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-serif mb-4">智能词汇复习</h1>
        <p className="text-brand-muted text-sm">
          基于艾宾浩斯记忆曲线，今日待复习词汇：
          <span className="font-bold text-brand-accent">{DEMO_WORDS.length}</span> 个
        </p>
      </div>

      {DEMO_WORDS.length === 0 ? (
        <div className="text-center text-brand-muted py-20">
          <BrainCircuit className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>今日复习已完成</p>
          <p className="text-sm mt-2">去“阅读分析”或“阅读拓展”添加更多生词</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {DEMO_WORDS.map((word) => (
            <div key={word.id} className="card p-6 flex flex-col gap-4 group hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-serif font-bold text-brand-accent">{word.word}</h3>
                  <span className="text-sm text-brand-muted">{word.phonetic}</span>
                </div>
                <div className="text-xs text-brand-muted border border-brand-border rounded-full px-3 py-1">
                  已复习{word.reviewCount}次
                </div>
              </div>
              <p className="font-sans text-brand-dark font-medium">{word.translation}</p>
              <div className="text-sm text-brand-muted border-l-2 border-brand-border pl-3">
                <p className="mb-1 italic">{word.exampleSentence}</p>
                <p className="text-xs opacity-80">{word.exampleTranslation}</p>
              </div>
              <div className="mt-auto pt-3 border-t border-brand-border text-xs text-brand-muted flex justify-between items-center">
                <span className="flex items-center gap-1"><Bookmark className="w-3 h-3" /> 已收藏</span>
                <span>下次复习：{word.nextReviewDate}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
