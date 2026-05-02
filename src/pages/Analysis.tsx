import { useState } from 'react';
import { BookOpen, Search, Bookmark, ChevronRight, Check } from 'lucide-react';
import { useStore } from '../store';
import { Article, Vocabulary } from '../types';

export default function Analysis() {
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<Article | null>(null);
  const addArticle = useStore((state) => state.addArticle);
  const addVocabulary = useStore((state) => state.addVocabulary);
  const [saved, setSaved] = useState(false);
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set());

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setIsAnalyzing(true);
    setSaved(false);
    
    try {
      // 调用免费 MyMemory 翻译 API，en|zh 表示英文→中文
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|zh`
      );
      const data = await response.json();
      const translatedContent = data.responseData.translatedText || '翻译失败，请稍后重试';

      const mockResult: Article = {
        id: Date.now().toString(),
        title: text.split('\n')[0].substring(0, 50) + '...',
        content: text,
        translatedContent: translatedContent, // 改成真实翻译结果
        coreVocabs: [
          {
            id: `v_${Date.now()}_1`,
            word: 'Analysis',
            phonetic: '/əˈnælɪsɪs/',
            translation: 'n. 分析；分解；验定',
            exampleSentence: 'The careful analysis of the results is very important.',
            exampleTranslation: '仔细分析结果是非常重要的。',
            frequency: 15,
            isCollected: false,
            nextReviewDate: Date.now(),
            reviewCount: 0,
            addedAt: Date.now()
          },
          {
            id: `v_${Date.now()}_2`,
            word: 'Significant',
            phonetic: '/sɪɡˈnɪfɪkənt/',
            translation: 'adj. 重要的；有意义的',
            exampleSentence: 'There is a significant difference between the two.',
            exampleTranslation: '两者之间存在显著差异。',
            frequency: 28,
            isCollected: false,
            nextReviewDate: Date.now(),
            reviewCount: 0,
            addedAt: Date.now()
          }
        ],
        longSentences: [
          {
            id: `s_${Date.now()}_1`,
            english: 'The study of history is not merely a collection of dates and events, but a profound exploration of human nature.',
            chinese: '对历史的研究不仅仅是日期和事件的集合，而是对人性的深刻探索。',
            analysis: '主句主干为 The study is not... but...。of history作后置定语修饰study。not merely... but (also)... 连接两个并列的表语。'
          }
        ],
        isCollected: false,
        addedAt: Date.now()
      };
      setResult(mockResult);
    } catch (error) {
      // 如果翻译失败，回退为提示信息
      const mockResult: Article = {
        id: Date.now().toString(),
        title: text.split('\n')[0].substring(0, 50) + '...',
        content: text,
        translatedContent: '翻译服务暂时不可用，请稍后再试',
        coreVocabs: [], // 至少不显示假词汇
        longSentences: [],
        isCollected: false,
        addedAt: Date.now()
      };
      setResult(mockResult);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveArticle = () => {
    if (result) {
      addArticle({ ...result, isCollected: true });
      setSaved(true);
    }
  };

  const handleSaveWord = (vocab: Vocabulary) => {
    addVocabulary({ ...vocab, isCollected: true });
    setSavedWords(new Set([...savedWords, vocab.id]));
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-12">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-serif mb-4">阅读分析</h1>
        <p className="text-brand-muted font-sans text-sm">
          输入您的英文段落，获取深度解析与核心词汇
        </p>
      </div>

      {!result ? (
        <div className="card flex flex-col gap-6">
          <textarea
            className="w-full h-64 p-4 border border-brand-border bg-brand-light focus:bg-white focus:border-brand-dark outline-none resize-none font-sans transition-colors duration-300 text-brand-dark"
            placeholder="在此粘贴您的英文阅读文章..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="flex justify-end">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !text.trim()}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <span className="animate-pulse">翻译中...</span>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  开始解析
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex justify-between items-center border-b border-brand-border pb-4">
            <button 
              onClick={() => setResult(null)}
              className="text-sm text-brand-muted hover:text-brand-dark flex items-center gap-1 transition-colors"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              重新输入
            </button>
            <button 
              onClick={handleSaveArticle}
              disabled={saved}
              className={`flex items-center gap-2 px-4 py-2 border text-sm font-medium transition-colors ${
                saved 
                  ? 'border-green-600 text-green-600 bg-green-50' 
                  : 'border-brand-dark text-brand-dark hover:bg-brand-dark hover:text-white'
              }`}
            >
              {saved ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              {saved ? '已收藏' : '收藏全文'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h2 className="text-sm font-sans tracking-widest text-brand-muted uppercase">原文 Original</h2>
              <div className="prose prose-sm font-serif text-brand-dark leading-relaxed whitespace-pre-wrap">
                {result.content}
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-sm font-sans tracking-widest text-brand-muted uppercase">译文 Translation</h2>
              <div className="prose prose-sm font-sans text-brand-muted leading-relaxed whitespace-pre-wrap">
                {result.translatedContent}
              </div>
            </div>
          </div>

          {result.coreVocabs.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-serif border-b border-brand-border pb-4">核心词汇 Core Vocabulary</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {result.coreVocabs.map((vocab) => (
                  <div key={vocab.id} className="card p-6 flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-serif font-bold text-brand-accent">{vocab.word}</h3>
                        <span className="text-sm text-brand-muted font-sans">{vocab.phonetic}</span>
                      </div>
                      <button 
                        onClick={() => handleSaveWord(vocab)}
                        disabled={savedWords.has(vocab.id)}
                        className="text-brand-muted hover:text-brand-accent transition-colors"
                        title="加入生词本"
                      >
                        {savedWords.has(vocab.id) ? <Check className="w-5 h-5 text-green-600" /> : <Bookmark className="w-5 h-5" />}
                      </button>
                    </div>
                    <p className="font-sans text-brand-dark font-medium">{vocab.translation}</p>
                    <div className="text-sm text-brand-muted font-serif border-l-2 border-brand-border pl-3">
                      <p className="mb-1">{vocab.exampleSentence}</p>
                      <p className="font-sans opacity-80">{vocab.exampleTranslation}</p>
                    </div>
                    <div className="mt-auto pt-4 flex items-center justify-between text-xs text-brand-muted font-sans border-t border-brand-border">
                      <span>历年考频</span>
                      <span className="font-bold text-brand-dark">{vocab.frequency} 次</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.longSentences.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-serif border-b border-brand-border pb-4">长难句解析 Long Sentences</h2>
              <div className="flex flex-col gap-6">
                {result.longSentences.map((sentence) => (
                  <div key={sentence.id} className="bg-brand-light p-6 md:p-8">
                    <p className="font-serif text-lg leading-relaxed text-brand-dark mb-4">{sentence.english}</p>
                    <p className="font-sans text-brand-muted mb-6">{sentence.chinese}</p>
                    <div className="bg-white p-4 border border-brand-border text-sm font-sans text-brand-dark leading-relaxed">
                      <span className="font-bold text-brand-accent mr-2">结构分析:</span>
                      {sentence.analysis}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
