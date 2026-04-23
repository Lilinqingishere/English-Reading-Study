import { useState } from 'react';
import { useStore } from '../store';
import { Clock, BookMarked, BrainCircuit, ExternalLink, ChevronRight, BookmarkMinus } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Profile() {
  const stats = useStore((state) => state.stats);
  const articles = useStore((state) => state.articles);
  const vocabularies = useStore((state) => state.vocabularies);
  const removeArticle = useStore((state) => state.removeArticle);
  const removeVocabulary = useStore((state) => state.removeVocabulary);
  const [activeTab, setActiveTab] = useState<'articles' | 'words'>('articles');

  const collectedArticles = articles.filter(a => a.isCollected);
  const collectedWords = vocabularies.filter(v => v.isCollected);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-12">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-serif mb-4">个人中心</h1>
        <p className="text-brand-muted font-sans text-sm">
          查看您的学习数据与收藏内容
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card flex flex-col items-center justify-center gap-2 p-10 bg-brand-dark text-white border-none relative overflow-hidden group">
          <Clock className="w-8 h-8 text-brand-accent mb-2 group-hover:scale-110 transition-transform duration-500" />
          <h3 className="text-3xl font-serif font-bold">{formatTime(stats.totalStudyTimeSeconds)}</h3>
          <p className="text-sm font-sans text-brand-light opacity-80 uppercase tracking-widest">学习总时长</p>
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-brand-accent rounded-full opacity-20 blur-3xl group-hover:opacity-40 transition-opacity duration-500" />
        </div>

        <div className="card flex flex-col items-center justify-center gap-2 p-10 group relative overflow-hidden">
          <BookMarked className="w-8 h-8 text-brand-dark mb-2 group-hover:text-brand-accent transition-colors duration-500" />
          <h3 className="text-3xl font-serif font-bold text-brand-dark">{collectedArticles.length}</h3>
          <p className="text-sm font-sans text-brand-muted uppercase tracking-widest">收藏文章数</p>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-brand-light rounded-full opacity-50 blur-3xl group-hover:opacity-100 transition-opacity duration-500" />
        </div>

        <div className="card flex flex-col items-center justify-center gap-2 p-10 group relative overflow-hidden">
          <BrainCircuit className="w-8 h-8 text-brand-dark mb-2 group-hover:text-brand-accent transition-colors duration-500" />
          <h3 className="text-3xl font-serif font-bold text-brand-dark">{collectedWords.length}</h3>
          <p className="text-sm font-sans text-brand-muted uppercase tracking-widest">生词本词汇</p>
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-light rounded-full opacity-50 blur-3xl group-hover:opacity-100 transition-opacity duration-500" />
        </div>
      </div>

      <div className="flex flex-col gap-8">
        <div className="flex border-b border-brand-border">
          <button
            className={`py-4 px-8 font-sans text-sm font-medium tracking-wide transition-colors relative ${
              activeTab === 'articles' ? 'text-brand-dark' : 'text-brand-muted hover:text-brand-dark'
            }`}
            onClick={() => setActiveTab('articles')}
          >
            已收藏的文章
            {activeTab === 'articles' && (
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-brand-dark" />
            )}
          </button>
          <button
            className={`py-4 px-8 font-sans text-sm font-medium tracking-wide transition-colors relative ${
              activeTab === 'words' ? 'text-brand-dark' : 'text-brand-muted hover:text-brand-dark'
            }`}
            onClick={() => setActiveTab('words')}
          >
            我的生词本
            {activeTab === 'words' && (
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-brand-dark" />
            )}
          </button>
        </div>

        <div className="animate-in fade-in duration-500">
          {activeTab === 'articles' && (
            <div className="grid grid-cols-1 gap-4">
              {collectedArticles.length === 0 ? (
                <div className="text-center py-12 text-brand-muted font-sans text-sm border border-dashed border-brand-border">
                  暂无收藏文章，去阅读拓展看看吧。
                  <Link to="/extension" className="text-brand-dark underline ml-2">前往阅读拓展</Link>
                </div>
              ) : (
                collectedArticles.map(article => (
                  <div key={article.id} className="card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group">
                    <div className="flex-1">
                      <h3 className="text-xl font-serif text-brand-dark mb-2">{article.title}</h3>
                      <p className="text-sm font-sans text-brand-muted line-clamp-1">{article.content}</p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <button 
                        onClick={() => removeArticle(article.id)}
                        className="text-brand-muted hover:text-brand-accent transition-colors flex items-center gap-1 text-xs uppercase tracking-widest font-sans"
                      >
                        <BookmarkMinus className="w-4 h-4" />
                        取消收藏
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'words' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {collectedWords.length === 0 ? (
                <div className="col-span-full text-center py-12 text-brand-muted font-sans text-sm border border-dashed border-brand-border">
                  生词本空空如也，去阅读分析添加生词吧。
                  <Link to="/analysis" className="text-brand-dark underline ml-2">前往阅读分析</Link>
                </div>
              ) : (
                collectedWords.map(word => (
                  <div key={word.id} className="card p-6 flex flex-col gap-3 group relative">
                    <div className="flex justify-between items-start">
                      <h3 className="text-xl font-serif font-bold text-brand-dark group-hover:text-brand-accent transition-colors">{word.word}</h3>
                      <button 
                        onClick={() => removeVocabulary(word.id)}
                        className="text-brand-muted hover:text-brand-accent transition-colors opacity-0 group-hover:opacity-100"
                        title="移出生词本"
                      >
                        <BookmarkMinus className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="text-xs text-brand-muted font-sans tracking-widest">{word.phonetic}</span>
                    <p className="font-sans text-brand-dark text-sm">{word.translation}</p>
                    <div className="mt-auto pt-4 border-t border-brand-border flex justify-between items-center text-xs font-sans text-brand-muted">
                      <span>复习 {word.reviewCount} 次</span>
                      <span>考频 {word.frequency}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}