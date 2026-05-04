import { useState, useMemo } from 'react';
import { useStore } from '../store';
import { BrainCircuit, Check, X, RefreshCw } from 'lucide-react';
import { Vocabulary } from '../types';
 
// Ebbinghaus review intervals in milliseconds
const REVIEW_INTERVALS = [
5 * 60 * 1000,           // 5 minutes
30 * 60 * 1000,          // 30 minutes
12 * 60 * 60 * 1000,     // 12 hours
24 * 60 * 60 * 1000,     // 1 day
2 * 24 * 60 * 60 * 1000, // 2 days
4 * 24 * 60 * 60 * 1000, // 4 days
7 * 24 * 60 * 60 * 1000, // 7 days
15 * 24 * 60 * 60 * 1000 // 15 days
];
 
export default function Review() {
const vocabularies = useStore((state) => state.vocabularies);
const updateVocabularyReview = useStore((state) => state.updateVocabularyReview);
const [currentIndex, setCurrentIndex] = useState(0);
const [showMeaning, setShowMeaning] = useState(false);
 
// Get words that need to be reviewed today (or are past due)
const wordsToReview = useMemo(() => {
const now = Date.now();
return vocabularies
.filter((v) => v.isCollected && v.nextReviewDate <= now)
.sort((a, b) => a.nextReviewDate - b.nextReviewDate);
}, [vocabularies]);
 
const currentWord = wordsToReview[currentIndex];
 
const handleRemember = (remembered: boolean) => {
if (!currentWord) return;
 
let nextCount = currentWord.reviewCount;
let nextInterval = 0;
 
if (remembered) {
nextCount = Math.min(currentWord.reviewCount + 1, REVIEW_INTERVALS.length);
nextInterval = REVIEW_INTERVALS[nextCount - 1] || REVIEW_INTERVALS[REVIEW_INTERVALS.length - 1];
} else {
// If forgotten, reset or drop back
nextCount = Math.max(1, currentWord.reviewCount - 1);
nextInterval = REVIEW_INTERVALS[0]; // Review again soon
}
 
const nextDate = Date.now() + nextInterval;
updateVocabularyReview(currentWord.id, nextDate, nextCount);
setShowMeaning(false);
// We don't advance the index immediately if they forgot it, 
// maybe we just leave it in the queue for later, but for simplicity, 
// we move to the next word in the current session.
// The useMemo might recalculate and change the list, so we keep index 0.
// Wait, since we updated the word's nextReviewDate, it will drop out of `wordsToReview` 
// on next render. So we don't need to increment index, just keep it 0.
setCurrentIndex(0);
};
 
if (wordsToReview.length === 0) {
return (
<div className="max-w-2xl mx-auto flex flex-col items-center justify-center py-24 gap-6 text-center">
<div className="w-20 h-20 bg-brand-light rounded-full flex items-center justify-center mb-4">
<BrainCircuit className="w-10 h-10 text-brand-dark opacity-50" />
</div>
<h2 className="text-3xl font-serif text-brand-dark">今日复习已完成</h2>
<p className="text-brand-muted font-sans text-sm max-w-md leading-relaxed">
基于艾宾浩斯记忆曲线，您今天需要复习的词汇已经全部完成。
您可以去阅读分析或阅读拓展中添加更多生词。
</p>
</div>
);
}
 
return (
<div className="max-w-2xl mx-auto flex flex-col gap-12">
<div className="text-center mb-8">
<h1 className="text-4xl font-serif mb-4">智能词汇复习</h1>
<p className="text-brand-muted font-sans text-sm">
今日待复习词汇：<span className="font-bold text-brand-accent">{wordsToReview.length}</span> 个
</p>
</div>
 
{currentWord && (
<div className="flex flex-col gap-8 items-center animate-in fade-in duration-500 w-full">
{/* Card */}
<div 
className={`w-full max-w-md aspect-[4/3] relative cursor-pointer group transition-all duration-700 [transform-style:preserve-3d] ${showMeaning ? '[transform:rotateY(180deg)]' : ''}`}
onClick={() => setShowMeaning(!showMeaning)}
>
{/* Front */}
<div className="absolute inset-0 bg-white border border-brand-border flex flex-col items-center justify-center p-8 [backface-visibility:hidden] shadow-sm hover:shadow-md transition-shadow">
<h2 className="text-5xl font-serif font-bold text-brand-dark mb-4">{currentWord.word}</h2>
<p className="text-brand-muted font-sans tracking-wider">{currentWord.phonetic}</p>
<div className="absolute bottom-6 text-xs text-brand-muted font-sans uppercase tracking-widest flex items-center gap-2 opacity-50">
<RefreshCw className="w-3 h-3" />
点击翻转
</div>
</div>
 
{/* Back */}
<div className="absolute inset-0 bg-brand-dark text-white border border-brand-dark flex flex-col items-center justify-center p-8 [backface-visibility:hidden] [transform:rotateY(180deg)] shadow-md">
<h2 className="text-3xl font-serif font-bold text-brand-light mb-6">{currentWord.word}</h2>
<p className="text-xl font-sans font-medium mb-8 text-center text-brand-light">
{currentWord.translation}
</p>
<div className="w-full max-w-sm text-center border-t border-white/20 pt-6">
<p className="font-serif text-sm italic mb-2 text-white/90">{currentWord.exampleSentence}</p>
<p className="font-sans text-xs text-white/60">{currentWord.exampleTranslation}</p>
</div>
</div>
</div>
 
{/* Controls */}
<div className={`flex gap-4 w-full max-w-md transition-opacity duration-500 ${showMeaning ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
<button 
onClick={(e) => { e.stopPropagation(); handleRemember(false); }}
className="flex-1 py-4 border border-brand-border bg-white text-brand-dark font-sans text-sm font-medium hover:bg-brand-light transition-colors flex items-center justify-center gap-2"
>
<X className="w-4 h-4" />
不认识
</button>
<button 
onClick={(e) => { e.stopPropagation(); handleRemember(true); }}
className="flex-1 py-4 border border-brand-dark bg-brand-dark text-white font-sans text-sm font-medium hover:bg-brand-accent hover:border-brand-accent transition-colors flex items-center justify-center gap-2"
>
<Check className="w-4 h-4" />
认识
</button>
</div>
</div>
)}
</div>
);
}
