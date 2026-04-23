import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Article, Vocabulary, UserStats } from '../types';

interface StoreState {
  articles: Article[];
  vocabularies: Vocabulary[];
  stats: UserStats;
  addArticle: (article: Article) => void;
  removeArticle: (id: string) => void;
  toggleArticleCollection: (id: string) => void;
  addVocabulary: (vocab: Vocabulary) => void;
  removeVocabulary: (id: string) => void;
  toggleVocabularyCollection: (id: string) => void;
  updateVocabularyReview: (id: string, nextReviewDate: number, reviewCount: number) => void;
  addStudyTime: (seconds: number) => void;
}

const initialStats: UserStats = {
  totalStudyTimeSeconds: 0,
  lastStudyDate: new Date().toISOString().split('T')[0],
};

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      articles: [],
      vocabularies: [],
      stats: initialStats,

      addArticle: (article) =>
        set((state) => {
          if (!state.articles.find((a) => a.id === article.id)) {
            return { articles: [...state.articles, article] };
          }
          return state;
        }),

      removeArticle: (id) =>
        set((state) => ({
          articles: state.articles.filter((a) => a.id !== id),
        })),

      toggleArticleCollection: (id) =>
        set((state) => ({
          articles: state.articles.map((a) =>
            a.id === id ? { ...a, isCollected: !a.isCollected } : a
          ),
        })),

      addVocabulary: (vocab) =>
        set((state) => {
          if (!state.vocabularies.find((v) => v.id === vocab.id)) {
            return { vocabularies: [...state.vocabularies, vocab] };
          }
          return state;
        }),

      removeVocabulary: (id) =>
        set((state) => ({
          vocabularies: state.vocabularies.filter((v) => v.id !== id),
        })),

      toggleVocabularyCollection: (id) =>
        set((state) => ({
          vocabularies: state.vocabularies.map((v) =>
            v.id === id ? { ...v, isCollected: !v.isCollected } : v
          ),
        })),

      updateVocabularyReview: (id, nextReviewDate, reviewCount) =>
        set((state) => ({
          vocabularies: state.vocabularies.map((v) =>
            v.id === id ? { ...v, nextReviewDate, reviewCount } : v
          ),
        })),

      addStudyTime: (seconds) =>
        set((state) => {
          const today = new Date().toISOString().split('T')[0];
          let newStats = { ...state.stats };
          
          if (newStats.lastStudyDate !== today) {
            newStats.lastStudyDate = today;
          }
          
          newStats.totalStudyTimeSeconds += seconds;
          return { stats: newStats };
        }),
    }),
    {
      name: 'english-academy-storage',
    }
  )
);
