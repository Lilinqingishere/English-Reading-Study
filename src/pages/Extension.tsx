import { useState } from 'react';
import { BookOpen, Bookmark, ChevronRight, ExternalLink } from 'lucide-react';
import { Article } from '../types';

const MOCK_ARTICLES: Article[] = [
  {
    id: 'ext_1',
    title: 'The Future of Artificial Intelligence in Education',
    content: 'Artificial intelligence is rapidly transforming the educational landscape...',
    translatedContent: '人工智能正在迅速改变教育格局...',
    coreVocabs: [],
    longSentences: [],
    source: 'The Economist',
    difficulty: 'CET6',
    isCollected: false,
    addedAt: Date.now()
  } as Article,
  {
    id: 'ext_2',
    title: 'Climate Change: A Global Perspective',
    content: 'Global warming poses an unprecedented threat...',
    translatedContent: '全球变暖对我们的星球构成了前所未有的威胁...',
    coreVocabs: [],
    longSentences: [],
    source: 'National Geographic',
    difficulty: 'IELTS',
    isCollected: false,
    addedAt: Date.now()
  } as Article
];

export default function Extension() {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-12">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-serif mb-4">阅读拓展</h1>
        <p className="text-brand-muted text-sm">精选外刊文章，拓宽视野与词汇量</p>
      </div>
      {selectedArticle ? (
        <div className="flex flex-col gap-8">
          <button onClick={() => setSelectedArticle(null)} className="text-sm text-brand-muted hover:text-brand-dark flex items-center gap-1">
            <ChevronRight className="w-4 h-4 rotate-180" />返回列表
          </button>
          <h1 className="text-3xl font-serif">{selectedArticle.title}</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div><h2 className="text-sm uppercase text-brand-muted">原文</h2><p className="whitespace-pre-wrap">{selectedArticle.content}</p></div>
            <div><h2 className="text-sm uppercase text-brand-muted">译文</h2><p className="whitespace-pre-wrap text-brand-muted">{selectedArticle.translatedContent}</p></div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {MOCK_ARTICLES.map((article) => (
            <div key={article.id} className="card p-6 cursor-pointer hover:border-brand-accent" onClick={() => setSelectedArticle(article)}>
              <h2 className="text-2xl font-serif">{article.title}</h2>
              <p className="text-sm text-brand-muted mt-2">{article.source} · 难度: {article.difficulty}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
