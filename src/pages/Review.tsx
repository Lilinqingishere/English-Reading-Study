import { Bookmark } from 'lucide-react';
import { useStore } from '../store';

export default function Review() {
  const vocabulary = useStore((state) => state.vocabulary);

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-12">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-serif mb-4">词汇复习</h1>
        <p className="text-brand-muted text-sm">你的专属生词本</p>
      </div>
      {vocabulary.length === 0 ? (
        <div className="text-center text-brand-muted py-20">
          <Bookmark className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>还没有收藏任何词汇</p>
          <p className="text-sm mt-2">去“阅读分析”页面，解析文章并点击词汇卡片上的书签图标</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {vocabulary.map((vocab) => (
            <div key={vocab.id} className="card p-6 flex flex-col gap-4">
              <h3 className="text-xl font-serif font-bold text-brand-accent">{vocab.word}</h3>
              <span className="text-sm text-brand-muted">{vocab.phonetic}</span>
              <p className="font-medium">{vocab.translation}</p>
              <div className="text-sm text-brand-muted border-l-2 pl-3">
                <p className="mb-1">{vocab.exampleSentence}</p>
                <p className="opacity-80">{vocab.exampleTranslation}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
