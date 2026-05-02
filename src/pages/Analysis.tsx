import { useState } from 'react';
import { Search, Bookmark, ChevronRight, Check, Plus, Trash2 } from 'lucide-react';
import { useStore } from '../store';
import { Article, Vocabulary } from '../types';

// 高精度的内置词库，由你提供，绝对准确
const MASTER_DICTIONARY: Record<string, { phonetic: string; translation: string; exampleSentence: string; exampleTranslation: string }> = {
  radical: {
    phonetic: '/ˈrædɪkl/',
    translation: 'adj. 彻底的；激进的；根本性的',
    exampleSentence: 'We need radical changes to make travel around cities healthier.',
    exampleTranslation: '我们需要彻底的变革，让城市出行更健康。'
  },
  detach: {
    phonetic: '/dɪˈtætʃ/',
    translation: 'v. 使分离；脱离；拆开',
    exampleSentence: 'Building designs detach the designer from the physical and social realities.',
    exampleTranslation: '建筑设计使设计师脱离了物理和社会现实。'
  },
  'counter-intuitive': {
    phonetic: '/ˌkaʊntər ɪnˈtjuːɪtɪv/',
    translation: 'adj. 反直觉的；与常理相悖的',
    exampleSentence: 'Designs that seem logical in models appear counter-intuitive in actual experience.',
    exampleTranslation: '在模型上看似合理的设计，在实际体验中却显得反直觉。'
  },
  choreography: {
    phonetic: '/ˌkɒriˈɒɡrəfi/',
    translation: 'n. 舞蹈编排；编舞艺术',
    exampleSentence: 'Choreography may not seem an obvious choice for tackling this problem.',
    exampleTranslation: '编舞似乎不是解决这个问题的显而易见的选择。'
  },
  sustainable: {
    phonetic: '/səˈsteɪnəbl/',
    translation: 'adj. 可持续的',
    exampleSentence: 'We need sustainable energy sources.',
    exampleTranslation: '我们需要可持续的能源。'
  },
  transportation: {
    phonetic: '/ˌtrænspərˈteɪʃn/',
    translation: 'n. 运输；交通',
    exampleSentence: 'Transportation is a major source of pollution.',
    exampleTranslation: '交通运输是污染的主要来源。'
  },
  essential: {
    phonetic: '/ɪˈsenʃl/',
    translation: 'adj. 必要的；本质的',
    exampleSentence: 'Water is essential for life.',
    exampleTranslation: '水对生命至关重要。'
  },
  profound: {
    phonetic: '/prəˈfaʊnd/',
    translation: 'adj. 深刻的；意义深远的',
    exampleSentence: 'It was a profound experience.',
    exampleTranslation: '这是一次深刻的体验。'
  },
  exploration: {
    phonetic: '/ˌekspləˈreɪʃn/',
    translation: 'n. 探索；勘探',
    exampleSentence: 'Space exploration inspires us all.',
    exampleTranslation: '太空探索激励着我们所有人。'
  }
};

function extractKeywordsFromText(text: string, limit: number): string[] {
  const words = text.match(/[A-Za-z]+/g) || [];
  const stopWords = new Set([
    'the','a','an','and','or','but','if','then','else','when','while','where','who','whom','whose','which','what','why','how',
    'is','am','are','was','were','be','been','being','do','does','did','doing','have','has','had','having',
    'will','would','can','could','may','might','must','shall','should',
    'of','to','in','on','at','for','from','with','without','as','by','about','into','over','after','before','between','through',
    'this','that','these','those','it','its','they','them','their','we','our','you','your','he','him','his','she','her',
    'not','no','yes','more','most','less','least','very','also','just','than','too','so',
  ]);
  
  const wordCounts = new Map<string, number>();
  words.forEach(w => {
    const lower = w.toLowerCase();
    if (lower.length >= 4 && !stopWords.has(lower)) {
      wordCounts.set(lower, (wordCounts.get(lower) || 0) + 1);
    }
  });

  return Array.from(wordCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(item => item[0]);
}

export default function Analysis() {
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<Article | null>(null);
  const addArticle = useStore((state) => state.addArticle);
  const addVocabulary = useStore((state) => state.addVocabulary);
  const [saved, setSaved] = useState(false);
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set());
  const [customSentences, setCustomSentences] = useState<{ id: string; english: string; chinese: string; analysis: string }[]>([]);
  const [newSentenceEnglish, setNewSentenceEnglish] = useState('');
  const [newSentenceChinese, setNewSentenceChinese] = useState('');
  const [newSentenceAnalysis, setNewSentenceAnalysis] = useState('');

  const handleAnalyze = () => {
    if (!text.trim()) return;
    setIsAnalyzing(true);
    setSaved(false);

    // 提取关键词并匹配内置词库
    const keywords = extractKeywordsFromText(text, 10);
    const now = Date.now();
    const coreVocabs: Vocabulary[] = [];
    const matchedWords = new Set<string>();

    keywords.forEach((word, idx) => {
      const dictEntry = MASTER_DICTIONARY[word];
      if (dictEntry && !matchedWords.has(word)) {
        matchedWords.add(word);
        coreVocabs.push({
          id: `v_${now}_${idx}`,
          word: word,
          phonetic: dictEntry.phonetic,
          translation: dictEntry.translation,
          exampleSentence: dictEntry.exampleSentence,
          exampleTranslation: dictEntry.exampleTranslation,
          frequency: 1,
          isCollected: false,
          nextReviewDate: now,
          reviewCount: 0,
          addedAt: now
        });
      }
    });

    const mockResult: Article = {
      id: Date.now().toString(),
      title: text.split('\n')[0].substring(0, 50) + '...',
      content: text,
      // 移除假翻译，提示用户使用浏览器翻译
      translatedContent: '请使用浏览器自带的翻译功能查看中文翻译（右键点击页面 -> "翻译成中文"）。',
      coreVocabs: coreVocabs.length > 0 ? coreVocabs : [
        {
          id: `v_${now}_0`,
          word: 'No match',
          phonetic: '',
          translation: '未在内置词库中匹配到单词，可以自行在下方“自定义长难句”区域添加。',
          exampleSentence: '',
          exampleTranslation: '',
          frequency: 0,
          isCollected: false,
          nextReviewDate: now,
          reviewCount: 0,
          addedAt: now
        }
      ],
      longSentences: customSentences,
      isCollected: false,
      addedAt: Date.now()
    };
    setResult(mockResult);
    setIsAnalyzing(false);
  };

  const handleAddCustomSentence = () => {
    if (!newSentenceEnglish.trim()) return;
    const newSentence = {
      id: `cs_${Date.now()}`,
      english: newSentenceEnglish,
      chinese: newSentenceChinese,
      analysis: newSentenceAnalysis
    };
    setCustomSentences([...customSentences, newSentence]);
    setNewSentenceEnglish('');
    setNewSentenceChinese('');
    setNewSentenceAnalysis('');
    
    // 如果文章已经生成，实时更新结果
    if (result) {
      setResult({
        ...result,
        longSentences: [...result.longSentences, newSentence]
      });
    }
  };

  const handleRemoveCustomSentence = (id: string) => {
    const updated = customSentences.filter(s => s.id !== id);
    setCustomSentences(updated);
    if (result) {
      setResult({ ...result, longSentences: updated });
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
          输入您的英文段落，获取深度解析与核心词汇。使用浏览器自带翻译获取译文。
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
                <span className="animate-pulse">Analyzing...</span>
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
              onClick={() => {
                setResult(null);
                setCustomSentences([]);
              }}
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

          {/* 原文展示 */}
          <div className="space-y-4">
            <h2 className="text-sm font-sans tracking-widest text-brand-muted uppercase">原文 Original</h2>
            <div className="prose prose-sm font-serif text-brand-dark leading-relaxed whitespace-pre-wrap bg-brand-light p-6 border border-brand-border">
              {result.content}
            </div>
          </div>

          {/* 核心词汇 */}
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
                </div>
              ))}
            </div>
          </div>

          {/* 自定义长难句解析 */}
          <div className="space-y-6">
            <h2 className="text-2xl font-serif border-b border-brand-border pb-4">长难句解析 Long Sentences</h2>
            
            {/* 添加自定义句子 */}
            <div className="bg-brand-light p-6 border border-brand-border space-y-4">
              <h3 className="text-sm font-sans font-semibold text-brand-dark uppercase tracking-wider">添加你的长难句</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-brand-muted mb-1">英文原文</label>
                  <textarea
                    className="w-full p-2 border border-brand-border bg-white focus:border-brand-dark outline-none resize-none text-sm"
                    rows={3}
                    placeholder="粘贴你读不懂的英文句子"
                    value={newSentenceEnglish}
                    onChange={(e) => setNewSentenceEnglish(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-muted mb-1">中文翻译</label>
                  <textarea
                    className="w-full p-2 border border-brand-border bg-white focus:border-brand-dark outline-none resize-none text-sm"
                    rows={3}
                    placeholder="输入你自己理解的中文翻译"
                    value={newSentenceChinese}
                    onChange={(e) => setNewSentenceChinese(e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-brand-muted mb-1">语法结构分析</label>
                  <textarea
                    className="w-full p-2 border border-brand-border bg-white focus:border-brand-dark outline-none resize-none text-sm"
                    rows={2}
                    placeholder="简单分析一下句子结构"
                    value={newSentenceAnalysis}
                    onChange={(e) => setNewSentenceAnalysis(e.target.value)}
                  />
                </div>
              </div>
              <button
                onClick={handleAddCustomSentence}
                disabled={!newSentenceEnglish.trim()}
                className="btn-primary flex items-center gap-2 text-sm px-4 py-2 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                添加到解析列表
              </button>
            </div>

            {/* 显示已添加的长难句 */}
            <div className="flex flex-col gap-6">
              {result.longSentences.length === 0 ? (
                <p className="text-center text-brand-muted text-sm py-8">尚未添加任何长难句，使用上方表单开始构建你的专属解析。</p>
              ) : (
                result.longSentences.map((sentence) => (
                  <div key={sentence.id} className="bg-brand-light p-6 md:p-8 relative group">
                    <button
                      onClick={() => handleRemoveCustomSentence(sentence.id)}
                      className="absolute top-2 right-2 text-brand-muted hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="删除此句"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <p className="font-serif text-lg leading-relaxed text-brand-dark mb-4">{sentence.english}</p>
                    <p className="font-sans text-brand-muted mb-6">{sentence.chinese}</p>
                    <div className="bg-white p-4 border border-brand-border text-sm font-sans text-brand-dark leading-relaxed">
                      <span className="font-bold text-brand-accent mr-2">结构分析:</span>
                      {sentence.analysis}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
