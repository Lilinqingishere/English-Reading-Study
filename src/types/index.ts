export interface Article {
  id: string;
  title: string;
  content: string;
  translatedContent: string;
  coreVocabs: Vocabulary[];
  longSentences: LongSentence[];
  isCollected: boolean;
  source?: string;
  difficulty?: 'CET4' | 'CET6' | 'IELTS';
  addedAt: number;
}

export interface Vocabulary {
  id: string;
  word: string;
  phonetic: string;
  translation: string;
  exampleSentence: string;
  exampleTranslation: string;
  frequency: number;
  isCollected: boolean;
  nextReviewDate: number;
  reviewCount: number;
  addedAt: number;
}

export interface LongSentence {
  id: string;
  english: string;
  chinese: string;
  analysis: string;
}

export interface UserStats {
  totalStudyTimeSeconds: number;
  streakDays?: number;
  totalArticlesAnalyzed?: number;
  collectedArticleCount?: number;
  totalVocabCount?: number;
  lastStudyDate: string | null;
}

export type Difficulty = 'CET4' | 'CET6' | 'IELTS';

export type ReviewRating = 'again' | 'hard' | 'good' | 'easy';

export interface AnalyzeVocabulary {
  id: string;
  word: string;
  phonetic: string;
  translation: string;
  exampleEn: string;
  exampleZh: string;
}

export interface AnalyzeSentence {
  id: string;
  english: string;
  chinese: string;
  analysis: string;
}

export interface AnalyzeResponse {
  articleId: string;
  title: string;
  difficulty: Difficulty;
  wordCount: number;
  originalText: string;
  translation: string;
  coreVocabulary: AnalyzeVocabulary[];
  longSentences: AnalyzeSentence[];
  tokensUsed: number;
  durationMs: number;
  analysisModel: string;
}

export interface AnalyzeMetaEvent {
  articleId: string;
  title: string;
  difficulty: Difficulty;
  wordCount: number;
  analysisModel: string;
}

export interface AnalyzeTranslationEvent {
  translation: string;
}

export interface AnalyzeDoneEvent {
  articleId: string;
  tokensUsed: number;
  durationMs: number;
}

export interface ArticleSummary {
  id: string;
  title: string;
  originalText: string;
  translation: string;
  difficulty: Difficulty;
  wordCount: number;
  isCollected: boolean;
  sourceType: string;
  sourceName: string | null;
  sourceUrl: string | null;
  sourceLicense: string | null;
  attributionText: string | null;
  publishedAt: string | null;
  createdAt: string;
  analysisModel: string | null;
}

export interface ArticleDetail extends ArticleSummary {
  coreVocabulary: AnalyzeVocabulary[];
  longSentences: AnalyzeSentence[];
}

export interface VocabEntry {
  id: string;
  word: string;
  phonetic: string | null;
  translation: string;
  exampleEn: string | null;
  exampleZh: string | null;
  sourceArticleId: string | null;
  isCollected: boolean;
  reviewCount: number;
  lapses: number;
  stability: number;
  difficulty: number;
  fsrsState: string;
  lastRating: ReviewRating | null;
  lastReviewAt: string | null;
  nextReviewAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StatsResponse {
  totalStudyTimeSeconds: number;
  streakDays: number;
  totalArticlesAnalyzed: number;
  collectedArticleCount: number;
  totalVocabCount: number;
  lastStudyDate: string | null;
}

export interface ReviewSubmitResponse {
  vocabulary: VocabEntry;
  reviewedCountDelta: number;
}
