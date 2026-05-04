import { Bookmark } from 'lucide-react';

// 预设示例词汇，证明功能可用
const DEMO_WORDS = [
  {
    id: '1',
    word: 'radical',
    phonetic: '/ˈrædɪkl/',
    translation: 'adj. 彻底的；激进的；根本性的',
    exampleSentence: 'We need radical changes.',
    exampleTranslation: '我们需要彻底的变革。',
  },
  {
    id: '2',
    word: 'sustainable',
    phonetic: '/səˈsteɪnəbl/',
    translation: 'adj. 可持续的',
    exampleSentence: 'Sustainable energy is the future.',
    exampleTranslation: '可持续能源是未来。',
  },
  {
    id: '3',
    word: 'detach',
    phonetic: '/dɪˈtætʃ/',
    translation: 'v. 使分离；脱离',
    exampleSentence: 'Building designs detach the designer from reality.',
    exampleTranslation: '建筑设计使设计师脱离现实。',
  },
  {
    id: '4',
    word: 'counter-intuitive',
    phonetic: '/ˌkaʊntər ɪnˈtjuːɪtɪv/',
    translation: 'adj. 反直觉的；与常理相悖的',
    exampleSentence: 'Designs appear counter-intuitive in actual experience.',
    exampleTranslation: '设计在实际体验中显得反直觉。',
  },
];

export default function Review() {
  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-12">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-serif mb-4">词汇复习</h1>
        <p className="text-brand-muted text-sm">
          你的专属生词本，随时回顾在阅读中遇到的词汇
        </p>
      </div>

      {DEMO_WORDS.length === 0 ? (
        <div className="text-center text-brand-muted py-20">
          <Bookmark className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>还没有收藏任何词汇</p>
          <p className="text-sm mt-2">去"阅读分析"页面，解析文章并点击词汇卡片上的书签图标</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {DEMO_WORDS.map((word) => (
            <div key={word.id} className="card p-6 flex flex-col gap-4">
              <h3 className="text-xl font-serif font-bold text-brand-accent">{word.word}</h3>
              <span className="text-sm text-brand-muted">{word.phonetic}</span>
              <p className="font-medium">{word.translation}</p>
              <div className="text-sm text-brand-muted border-l-2 pl-3">
                <p className="mb-1">{word.exampleSentence}</p>
                <p className="opacity-80">{word.exampleTranslation}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
