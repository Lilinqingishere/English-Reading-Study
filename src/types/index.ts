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
  lastStudyDate: string;
}
