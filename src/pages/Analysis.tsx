import { useState } from 'react';
import { Search, Bookmark, Check, ChevronRight } from 'lucide-react';
import { Article, Vocabulary } from '../types';

// 完整示例解析数据
const DEMO_RESULT: Article = {
  id: 'demo_analysis',
  title: 'Could urban engineers learn from dance?',
  content: `The way we travel around cities has a major impact on whether they are sustainable. Transportation is estimated to account for 30% of energy consumption in most of the world's most developed nations, so lowering the need for energy-using vehicles is essential for decreasing the environmental impact of mobility.`,
  translatedContent: `我们在城市中的出行方式对城市的可持续性有着重大影响。据估计，在大多数发达国家，交通运输约占能源消耗的30%，因此降低对耗能车辆的需求对于减少出行对环境的影响至关重要。`,
  coreVocabs: [
    {
      id: 'v1',
      word: 'radical',
      phonetic: '/ˈrædɪkl/',
      translation: 'adj. 彻底的；激进的',
      exampleSentence: 'We need radical changes.',
      exampleTranslation: '我们需要彻底的变革。',
      frequency: 5,
      isCollected: false,
      nextReviewDate: Date.now(),
      reviewCount: 0,
      addedAt: Date.now()
    },
    {
      id: 'v2',
      word: 'sustainable',
      phonetic: '/səˈsteɪnəbl/',
      translation: 'adj. 可持续的',
      exampleSentence: 'Sustainable energy is the future.',
      exampleTranslation: '可持续能源是未来。',
      frequency: 10,
      isCollected: false,
      nextReviewDate: Date.now(),
      reviewCount: 0,
      addedAt: Date.now()
    }
  ],
  longSentences: [
    {
      id: 'ls1',
      english: 'Transportation is estimated to account for 30% of energy consumption in most of the world\'s most developed nations.',
      chinese: '据估计，在大多数发达国家，交通运输约占能源消耗的30%。',
      analysis: '主语Transportation，谓语is estimated，后接不定式to account for...'
    }
  ],
  isCollected: false,
  addedAt: Date.now()
};

export default function Analysis() {
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<Article | null>(null);
  const [saved, setSaved] = useState(false);

  const handleAnalyze = () => {
    if (!text.trim()) return;
    setIsAnalyzing(true);
    setSaved(false);
    // 模拟解析延迟，直接返回预设结果
    setTimeout(() => {
      setResult(DEMO_RESULT);
      setIsAnalyzing(false);
    }, 800);
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-12">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-serif mb-4">阅读分析</h1>
        <p className="text-brand-muted text-sm">输入英文段落，获取深度解析与核心词汇</p>
      </div>

      {!result ? (
        <div className="card flex flex-col gap-6">
          <textarea
            className="w-full h-64 p-4 border border-brand-border bg-brand-light focus:bg-white focus:border-brand-dark outline-none resize-none"
            placeholder="在此粘贴英文文章...（任意内容，解析将展示示例结果）"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="flex justify-end">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !text.trim()}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              {isAnalyzing ? <span className="animate-pulse">Analyzing...</span> : <><Search className="w-4 h-4" />开始解析</>}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-12">
          <div className="flex justify-between items-center border-b pb-4">
            <button onClick={() => setResult(null)} className="text-sm text-brand-muted hover:text-brand-dark flex items-center gap-1">
              <ChevronRight className="w-4 h-4 rotate-180" />重新输入
            </button>
            <button
              onClick={() => setSaved(true)}
              disabled={saved}
              className={`flex items-center gap-2 px-4 py-2 border text-sm ${saved ? 'border-green-600 text-green-600 bg-green-50' : 'border-brand-dark hover:bg-brand-dark hover:text-white'}`}
            >
              {saved ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              {saved ? '已收藏' : '收藏全文'}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div><h2 className="text-sm tracking-widest text-brand-muted uppercase">原文 Original</h2><div className="prose prose-sm whitespace-pre-wrap bg-brand-light p-6 border">{result.content}</div></div>
            <div><h2 className="text-sm tracking-widest text-brand-muted uppercase">译文 Translation</h2><div className="prose prose-sm text-brand-muted whitespace-pre-wrap bg-brand-light p-6 border">{result.translatedContent}</div></div>
          </div>
          <div className="space-y-6">
            <h2 className="text-2xl font-serif border-b pb-4">核心词汇 Core Vocabulary</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {result.coreVocabs.map((vocab) => (
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
          </div>
          <div className="space-y-6">
            <h2 className="text-2xl font-serif border-b pb-4">长难句解析 Long Sentences</h2>
            {result.longSentences.map((sentence) => (
              <div key={sentence.id} className="bg-brand-light p-6">
                <p className="font-serif text-lg mb-4">{sentence.english}</p>
                <p className="text-brand-muted mb-6">{sentence.chinese}</p>
                <div className="bg-white p-4 border text-sm">
                  <span className="font-bold text-brand-accent mr-2">结构分析:</span>{sentence.analysis}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
