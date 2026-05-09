import { BookmarkMinus, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ArticleSummary, VocabEntry } from '../../types';

interface ProfileTabsProps {
  activeTab: 'articles' | 'words';
  articles: ArticleSummary[];
  words: VocabEntry[];
  pendingArticleId: string | null;
  pendingVocabId: string | null;
  onTabChange: (tab: 'articles' | 'words') => void;
  onRemoveArticle: (articleId: string) => void;
  onRemoveVocabulary: (vocabId: string) => void;
}

export function ProfileTabs({
  activeTab,
  articles,
  words,
  pendingArticleId,
  pendingVocabId,
  onTabChange,
  onRemoveArticle,
  onRemoveVocabulary,
}: ProfileTabsProps) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex border-b border-brand-border">
        <button
          className={`py-4 px-8 font-sans text-sm font-medium tracking-wide transition-colors relative ${
            activeTab === 'articles' ? 'text-brand-dark' : 'text-brand-muted hover:text-brand-dark'
          }`}
          onClick={() => onTabChange('articles')}
        >
          已收藏的文章
          {activeTab === 'articles' && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-brand-dark" />}
        </button>
        <button
          className={`py-4 px-8 font-sans text-sm font-medium tracking-wide transition-colors relative ${
            activeTab === 'words' ? 'text-brand-dark' : 'text-brand-muted hover:text-brand-dark'
          }`}
          onClick={() => onTabChange('words')}
        >
          我的生词本
          {activeTab === 'words' && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-brand-dark" />}
        </button>
      </div>

      <div key={activeTab} className="fade-in-up">
        {activeTab === 'articles' && (
          <div className="grid grid-cols-1 gap-4">
            {articles.length === 0 ? (
              <div className="text-center py-12 text-brand-muted font-sans text-sm border border-dashed border-brand-border">
                暂无收藏文章，去阅读拓展看看吧。
                <Link to="/extension" className="text-brand-dark underline ml-2">前往阅读拓展</Link>
              </div>
            ) : (
              articles.map((article) => (
                <div key={article.id} className="card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group">
                  <Link to={`/extension?articleId=${encodeURIComponent(article.id)}`} className="flex-1 block">
                    <h3 className="text-xl font-serif text-brand-dark mb-2">{article.title}</h3>
                    <p className="text-sm font-sans text-brand-muted line-clamp-1">{article.originalText}</p>
                    <p className="text-xs text-brand-muted mt-2 uppercase tracking-widest">
                      {article.sourceName ?? 'Custom Article'} · {article.difficulty} · {article.wordCount} words
                    </p>
                  </Link>
                  <div className="flex items-center gap-4 shrink-0">
                    {article.sourceUrl && (
                      <a
                        href={article.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand-muted hover:text-brand-accent transition-colors"
                        title="查看来源"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => onRemoveArticle(article.id)}
                      disabled={pendingArticleId === article.id}
                      className="text-brand-muted hover:text-brand-accent transition-colors flex items-center gap-1 text-xs uppercase tracking-widest font-sans disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <BookmarkMinus className="w-4 h-4" />
                      {pendingArticleId === article.id ? '处理中' : '取消收藏'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'words' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {words.length === 0 ? (
              <div className="col-span-full text-center py-12 text-brand-muted font-sans text-sm border border-dashed border-brand-border">
                生词本空空如也，去阅读分析添加生词吧。
                <Link to="/analysis" className="text-brand-dark underline ml-2">前往阅读分析</Link>
              </div>
            ) : (
              words.map((word) => (
                <div key={word.id} className="card p-6 flex flex-col gap-3 group relative">
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-serif font-bold text-brand-dark group-hover:text-brand-accent transition-colors">{word.word}</h3>
                    <button
                      onClick={() => onRemoveVocabulary(word.id)}
                      disabled={pendingVocabId === word.id}
                      className="text-brand-muted hover:text-brand-accent transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                      title="移出生词本"
                    >
                      <BookmarkMinus className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-xs text-brand-muted font-sans tracking-widest">{word.phonetic ?? 'No phonetic'}</span>
                  <p className="font-sans text-brand-dark text-sm">{word.translation}</p>
                  {(word.exampleEn || word.exampleZh) && (
                    <div className="text-xs text-brand-muted border-l-2 border-brand-border pl-3">
                      {word.exampleEn && <p className="mb-1 italic">{word.exampleEn}</p>}
                      {word.exampleZh && <p className="opacity-80">{word.exampleZh}</p>}
                    </div>
                  )}
                  <div className="mt-auto pt-4 border-t border-brand-border flex justify-between items-center text-xs font-sans text-brand-muted">
                    <span>复习 {word.reviewCount} 次</span>
                    <span>{word.nextReviewAt ? new Date(word.nextReviewAt).toLocaleDateString() : '待复习'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
