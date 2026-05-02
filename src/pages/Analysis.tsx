import { useState } from 'react';
import { BookOpen, Search, Bookmark, ChevronRight, Check } from 'lucide-react';
import { useStore } from '../store';
import { Article, Vocabulary } from '../types';

type AlignedLine = { english: string; chinese: string; isBreak?: boolean };

async function translateChunk(chunk: string) {
  const url = new URL('https://api.mymemory.translated.net/get');
  url.searchParams.set('q', chunk);
  url.searchParams.set('langpair', 'en|zh-CN');

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Translate failed: ${res.status}`);

  const data: unknown = await res.json();
  const translatedText = (data as any)?.responseData?.translatedText;
  if (typeof translatedText !== 'string') throw new Error('Invalid translate response');

  return translatedText;
}

function splitTextForAlignment(text: string) {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [] as AlignedLine[];

  const paragraphs = normalized
    .split(/\n\s*\n+/g)
    .map((p) => p.replace(/\n+/g, ' ').trim())
    .filter(Boolean);

  const lines: AlignedLine[] = [];

  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i];
    const matches = p.match(/[^.!?]+[.!?]+|[^.!?]+$/g);
    const sentences = (matches ?? [p]).map((s) => s.trim()).filter(Boolean);

    for (const s of sentences) {
      lines.push({ english: s, chinese: '' });
    }

    if (i !== paragraphs.length - 1) {
      lines.push({ english: '', chinese: '', isBreak: true });
    }
  }

  return lines;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>
) {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  const workers = new Array(Math.max(1, concurrency)).fill(0).map(async () => {
    while (true) {
      const current = nextIndex;
      nextIndex += 1;
      if (current >= items.length) return;
      results[current] = await mapper(items[current], current);
    }
  });

  await Promise.all(workers);
  return results;
}

async function translateAlignedLines(lines: AlignedLine[]) {
  const targets = lines.filter((l) => !l.isBreak && l.english.trim().length > 0).map((l) => l.english);
  if (targets.length === 0) return lines;

  const translated = await mapWithConcurrency(targets, 3, (s) => translateChunk(s));

  let cursor = 0;
  return lines.map((l) => {
    if (l.isBreak) return l;
    const next = translated[cursor] ?? '';
    cursor += 1;
    return { ...l, chinese: next };
  });
}

function alignedLinesToText(lines: AlignedLine[], side: 'english' | 'chinese') {
  const raw = lines
    .map((l) => {
      if (l.isBreak) return '';
      return side === 'english' ? l.english : l.chinese;
    })
    .join('\n');

  return raw.replace(/\n{3,}/g, '\n\n').trim();
}

function detectTitle(text: string) {
  const firstLine = text.replace(/\r\n/g, '\n').split('\n').find((l) => l.trim().length > 0) ?? '';
  const t = firstLine.trim();
  if (!t) return 'Untitled';
  return t.length > 50 ? `${t.substring(0, 50)}...` : t;
}

function splitIntoTranslateChunks(text: string, maxLen = 420) {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];

  const paragraphs = normalized.split(/\n\s*\n+/g).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];

  const flush = (buf: string[]) => {
    if (buf.length === 0) return;
    const combined = buf.join('\n\n').trim();
    if (combined) chunks.push(combined);
    buf.length = 0;
  };

  const splitLong = (input: string) => {
    const sentences = input.split(/(?<=[.!?])\s+/g);
    if (sentences.length === 1) {
      const pieces: string[] = [];
      for (let i = 0; i < input.length; i += maxLen) pieces.push(input.slice(i, i + maxLen));
      return pieces;
    }
    return sentences;
  };

  const buf: string[] = [];
  let currentLen = 0;

  for (const p of paragraphs) {
    const parts = p.length > maxLen ? splitLong(p) : [p];
    for (const part of parts) {
      const candidateLen = currentLen + (buf.length ? 2 : 0) + part.length;
      if (candidateLen > maxLen) {
        flush(buf);
        buf.push(part);
        currentLen = part.length;
      } else {
        buf.push(part);
        currentLen = candidateLen;
      }
    }
  }

  flush(buf);
  return chunks;
}

async function translateEnToZh(text: string) {
  const chunks = splitIntoTranslateChunks(text);
  if (chunks.length === 0) return '';

  const translatedChunks: string[] = [];
  for (const chunk of chunks) {
    translatedChunks.push(await translateChunk(chunk));
  }

  return translatedChunks.join('\n\n');
}

export default function Analysis() {
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<Article | null>(null);
  const [alignedLines, setAlignedLines] = useState<AlignedLine[]>([]);
  const addArticle = useStore((state) => state.addArticle);
  const addVocabulary = useStore((state) => state.addVocabulary);
  const [saved, setSaved] = useState(false);
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set());

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setIsAnalyzing(true);
    setSaved(false);
    setAlignedLines([]);

    try {
      const baseLines = splitTextForAlignment(text);
      const translatedLines = await translateAlignedLines(baseLines);
      setAlignedLines(translatedLines);

      const translatedContent = alignedLinesToText(translatedLines, 'chinese');
      const mockResult: Article = {
        id: Date.now().toString(),
        title: detectTitle(text),
        content: text,
        translatedContent: translatedContent || '未获取到译文，请检查输入内容后重试。',
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
          } as Vocabulary,
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
          } as Vocabulary
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
    } catch (e) {
      const fallbackResult: Article = {
        id: Date.now().toString(),
        title: detectTitle(text),
        content: text,
        translatedContent: '翻译失败，请稍后重试。',
        coreVocabs: [],
        longSentences: [],
        isCollected: false,
        addedAt: Date.now()
      };
      setResult(fallbackResult);
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
                setAlignedLines([]);
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

          <div className="space-y-6">
            <div className="flex items-end justify-between gap-6 border-b border-brand-border pb-4">
              <h2 className="text-2xl font-serif">中英对照全文</h2>
              <div className="text-xs font-sans tracking-widest text-brand-muted uppercase">
                Sentence-aligned
              </div>
            </div>

            {alignedLines.length > 0 ? (
              <div className="border border-brand-border bg-white">
                {alignedLines.map((line, idx) => {
                  if (line.isBreak) {
                    return <div key={`b_${idx}`} className="h-6 bg-brand-light" />;
                  }

                  return (
                    <div
                      key={`l_${idx}`}
                      className="grid grid-cols-1 md:grid-cols-2 gap-4 px-5 py-4 border-b border-brand-border last:border-b-0"
                    >
                      <div className="font-serif text-brand-dark leading-relaxed">
                        {line.english}
                      </div>
                      <div className="font-sans text-brand-muted leading-relaxed">
                        {line.chinese || '...'}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
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
            )}
          </div>

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
        </div>
      )}
    </div>
  );
}
