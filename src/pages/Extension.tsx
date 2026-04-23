import { useState } from 'react';
import { BookOpen, Bookmark, ChevronRight, ExternalLink } from 'lucide-react';
import { useStore } from '../store';
import { Article } from '../types';

const MOCK_ARTICLES: Article[] = [
  {
    id: 'ext_1',
    title: 'The Future of Artificial Intelligence in Education',
    content: 'Artificial intelligence is rapidly transforming the educational landscape. From personalized learning paths to automated grading systems, AI tools are making education more accessible and efficient than ever before. However, this technological shift also raises important questions about data privacy and the changing role of educators.',
    translatedContent: '人工智能正在迅速改变教育格局。从个性化学习路径到自动评分系统，人工智能工具使教育变得比以往任何时候都更容易获得和更高效。然而，这种技术转变也引发了有关数据隐私和教育工作者角色转变的重要问题。',
    coreVocabs: [
      {
        id: 'v_ext1_1',
        word: 'Transform',
        phonetic: '/trænsˈfɔːrm/',
        translation: 'v. 改变，使变形',
        exampleSentence: 'The new technology will completely transform our lives.',
        exampleTranslation: '这项新技术将彻底改变我们的生活。',
        frequency: 42,
        isCollected: false,
        nextReviewDate: Date.now(),
        reviewCount: 0,
        addedAt: Date.now()
      },
      {
        id: 'v_ext1_2',
        word: 'Accessible',
        phonetic: '/əkˈsesəbl/',
        translation: 'adj. 易接近的，可理解的',
        exampleSentence: 'The museum is accessible to wheelchair users.',
        exampleTranslation: '这家博物馆方便轮椅使用者进入。',
        frequency: 35,
        isCollected: false,
        nextReviewDate: Date.now(),
        reviewCount: 0,
        addedAt: Date.now()
      }
    ],
    longSentences: [
      {
        id: 's_ext1_1',
        english: 'From personalized learning paths to automated grading systems, AI tools are making education more accessible and efficient than ever before.',
        chinese: '从个性化学习路径到自动评分系统，人工智能工具使教育变得比以往任何时候都更容易获得和更高效。',
        analysis: 'From... to... 引导介词短语作状语。主干为 AI tools are making education more accessible and efficient。make + 宾语 + 宾补 结构。'
      }
    ],
    source: 'The Economist',
    difficulty: 'CET6',
    isCollected: false,
    addedAt: Date.now()
  },
  {
    id: 'ext_2',
    title: 'Climate Change: A Global Perspective',
    content: 'Global warming poses an unprecedented threat to our planet. Rising sea levels, extreme weather events, and diminishing biodiversity are just a few of the critical challenges we face. International cooperation and sustainable practices are essential to mitigate these impacts.',
    translatedContent: '全球变暖对我们的星球构成了前所未有的威胁。海平面上升、极端天气事件和生物多样性减少只是我们面临的几个严峻挑战。国际合作和可持续实践对于减轻这些影响至关重要。',
    coreVocabs: [
      {
        id: 'v_ext2_1',
        word: 'Unprecedented',
        phonetic: '/ʌnˈpresɪdəntɪd/',
        translation: 'adj. 前所未有的，史无前例的',
        exampleSentence: 'The situation is completely unprecedented.',
        exampleTranslation: '这种情况是完全前所未有的。',
        frequency: 18,
        isCollected: false,
        nextReviewDate: Date.now(),
        reviewCount: 0,
        addedAt: Date.now()
      }
    ],
    longSentences: [
      {
        id: 's_ext2_1',
        english: 'Rising sea levels, extreme weather events, and diminishing biodiversity are just a few of the critical challenges we face.',
        chinese: '海平面上升、极端天气事件和生物多样性减少只是我们面临的几个严峻挑战。',
        analysis: '主语由三个并列的名词短语组成。we face 是定语从句，修饰 challenges。'
      }
    ],
    source: 'National Geographic',
    difficulty: 'IELTS',
    isCollected: false,
    addedAt: Date.now()
  }
];

export default function Extension() {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const addArticle = useStore((state) => state.addArticle);
  const addVocabulary = useStore((state) => state.addVocabulary);
  const [saved, setSaved] = useState(false);

  const handleSelect = (article: Article) => {
    setSelectedArticle(article);
    setSaved(false);
    window.scrollTo(0, 0);
  };

  const handleSaveArticle = () => {
    if (selectedArticle) {
      addArticle({ ...selectedArticle, isCollected: true });
      setSaved(true);
    }
  };

  if (selectedArticle) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col gap-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex justify-between items-center border-b border-brand-border pb-4">
          <button 
            onClick={() => setSelectedArticle(null)}
            className="text-sm text-brand-muted hover:text-brand-dark flex items-center gap-1 transition-colors"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            返回列表
          </button>
          <div className="flex items-center gap-4">
            <span className="text-xs font-sans tracking-widest text-brand-muted uppercase border border-brand-border px-2 py-1">
              {selectedArticle.difficulty}
            </span>
            <button 
              onClick={handleSaveArticle}
              disabled={saved}
              className={`flex items-center gap-2 px-4 py-2 border text-sm font-medium transition-colors ${
                saved 
                  ? 'border-green-600 text-green-600 bg-green-50' 
                  : 'border-brand-dark text-brand-dark hover:bg-brand-dark hover:text-white'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              {saved ? '已收藏' : '收藏全文'}
            </button>
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-serif text-brand-dark leading-tight mb-4">
            {selectedArticle.title}
          </h1>
          <p className="text-sm font-sans text-brand-muted">
            Source: <span className="italic">{selectedArticle.source}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h2 className="text-sm font-sans tracking-widest text-brand-muted uppercase">原文 Original</h2>
            <div className="prose prose-sm font-serif text-brand-dark leading-relaxed whitespace-pre-wrap">
              {selectedArticle.content}
            </div>
          </div>
          <div className="space-y-4">
            <h2 className="text-sm font-sans tracking-widest text-brand-muted uppercase">译文 Translation</h2>
            <div className="prose prose-sm font-sans text-brand-muted leading-relaxed whitespace-pre-wrap">
              {selectedArticle.translatedContent}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-serif border-b border-brand-border pb-4">核心词汇 Core Vocabulary</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {selectedArticle.coreVocabs.map((vocab) => (
              <div key={vocab.id} className="card p-6 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-serif font-bold text-brand-accent">{vocab.word}</h3>
                    <span className="text-sm text-brand-muted font-sans">{vocab.phonetic}</span>
                  </div>
                  <button 
                    onClick={() => addVocabulary({ ...vocab, isCollected: true })}
                    className="text-brand-muted hover:text-brand-accent transition-colors"
                    title="加入生词本"
                  >
                    <Bookmark className="w-5 h-5" />
                  </button>
                </div>
                <p className="font-sans text-brand-dark font-medium">{vocab.translation}</p>
                <div className="text-sm text-brand-muted font-serif border-l-2 border-brand-border pl-3">
                  <p className="mb-1">{vocab.exampleSentence}</p>
                  <p className="font-sans opacity-80">{vocab.exampleTranslation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-serif border-b border-brand-border pb-4">长难句解析 Long Sentences</h2>
          <div className="flex flex-col gap-6">
            {selectedArticle.longSentences.map((sentence) => (
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
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-12">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-serif mb-4">阅读拓展</h1>
        <p className="text-brand-muted font-sans text-sm">
          精选外刊优质文章，拓宽视野与词汇量
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {MOCK_ARTICLES.map((article) => (
          <div 
            key={article.id} 
            className="card flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group cursor-pointer border-l-4 border-l-transparent hover:border-l-brand-accent"
            onClick={() => handleSelect(article)}
          >
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-sans tracking-widest text-brand-muted uppercase border border-brand-border px-2 py-1">
                  {article.difficulty}
                </span>
                <span className="text-xs font-sans text-brand-muted flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" />
                  {article.source}
                </span>
              </div>
              <h2 className="text-2xl font-serif text-brand-dark group-hover:text-brand-accent transition-colors duration-300 mb-3">
                {article.title}
              </h2>
              <p className="text-sm font-sans text-brand-muted line-clamp-2 leading-relaxed">
                {article.content}
              </p>
            </div>
            <div className="hidden md:flex w-12 h-12 bg-brand-light rounded-full items-center justify-center group-hover:bg-brand-dark group-hover:text-white transition-colors duration-300 shrink-0">
              <ChevronRight className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}