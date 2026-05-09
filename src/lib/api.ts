import type {
  AnalyzeDoneEvent,
  AnalyzeMetaEvent,
  AnalyzeResponse,
  AnalyzeSentence,
  AnalyzeTranslationEvent,
  AnalyzeVocabulary,
  ArticleDetail,
  ArticleSummary,
  Difficulty,
  ReviewRating,
  ReviewSubmitResponse,
  StatsResponse,
  VocabEntry,
} from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '');

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

type RequestBody = Record<string, unknown> | undefined;

export interface AnalyzeStreamHandlers {
  onMeta?: (event: AnalyzeMetaEvent) => void;
  onTranslation?: (event: AnalyzeTranslationEvent) => void;
  onVocabulary?: (event: AnalyzeVocabulary) => void;
  onSentence?: (event: AnalyzeSentence) => void;
  onDone?: (event: AnalyzeDoneEvent) => void;
}

async function request<T>(path: string, options: RequestInit & { bodyJson?: RequestBody } = {}): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.bodyJson !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body: options.bodyJson === undefined ? options.body : JSON.stringify(options.bodyJson),
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const data = text ? (JSON.parse(text) as unknown) : null;

  if (!response.ok) {
    throw new ApiError(response.status, extractErrorDetail(data, response.statusText));
  }

  return data as T;
}

function extractErrorDetail(data: unknown, fallback: string): string {
  if (typeof data === 'object' && data !== null && 'detail' in data) {
    const detail = (data as { detail: unknown }).detail;
    if (typeof detail === 'string') {
      return detail;
    }
  }
  return fallback || '请求失败，请稍后重试';
}

function buildQuery(params: Record<string, string | number | boolean | null | undefined>): string {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      query.set(key, String(value));
    }
  });

  const value = query.toString();
  return value ? `?${value}` : '';
}

async function requestAnalyzeStream(
  text: string,
  hintDifficulty: Difficulty | null | undefined,
  handlers: AnalyzeStreamHandlers,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/analyze/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      hintDifficulty: hintDifficulty ?? null,
    }),
    signal,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new ApiError(response.status, body || response.statusText);
  }

  if (!response.body) {
    throw new Error('浏览器不支持流式响应，请改用非流式分析');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split(/\r?\n\r?\n/);
    buffer = blocks.pop() ?? '';
    blocks.forEach((block) => dispatchAnalyzeStreamBlock(block, handlers));
  }

  buffer += decoder.decode();
  if (buffer.trim()) {
    dispatchAnalyzeStreamBlock(buffer, handlers);
  }
}

function dispatchAnalyzeStreamBlock(block: string, handlers: AnalyzeStreamHandlers): void {
  let eventName = 'message';
  const dataLines: string[] = [];

  block.split(/\r?\n/).forEach((line) => {
    if (line.startsWith('event:')) {
      eventName = line.slice('event:'.length).trim();
      return;
    }

    if (line.startsWith('data:')) {
      dataLines.push(line.slice('data:'.length).trimStart());
    }
  });

  const data = dataLines.join('\n');
  if (!data) {
    return;
  }

  if (eventName === 'error') {
    throw new Error(data);
  }

  const parsed = JSON.parse(data) as unknown;
  if (eventName === 'meta') {
    handlers.onMeta?.(parsed as AnalyzeMetaEvent);
    return;
  }

  if (eventName === 'translation') {
    handlers.onTranslation?.(parsed as AnalyzeTranslationEvent);
    return;
  }

  if (eventName === 'vocab') {
    handlers.onVocabulary?.(parsed as AnalyzeVocabulary);
    return;
  }

  if (eventName === 'sentence') {
    handlers.onSentence?.(parsed as AnalyzeSentence);
    return;
  }

  if (eventName === 'done') {
    handlers.onDone?.(parsed as AnalyzeDoneEvent);
  }
}

export const api = {
  analyze(text: string, hintDifficulty?: Difficulty | null) {
    return request<AnalyzeResponse>('/analyze', {
      method: 'POST',
      bodyJson: {
        text,
        hintDifficulty: hintDifficulty ?? null,
      },
    });
  },

  analyzeStream(text: string, handlers: AnalyzeStreamHandlers, hintDifficulty?: Difficulty | null, signal?: AbortSignal) {
    return requestAnalyzeStream(text, hintDifficulty, handlers, signal);
  },

  listArticles(params: { difficulty?: Difficulty | null; collected?: boolean | null; limit?: number; offset?: number } = {}) {
    return request<ArticleSummary[]>(`/articles${buildQuery({
      difficulty: params.difficulty,
      collected: params.collected,
      limit: params.limit ?? 50,
      offset: params.offset ?? 0,
    })}`);
  },

  getArticle(articleId: string) {
    return request<ArticleDetail>(`/articles/${encodeURIComponent(articleId)}`);
  },

  collectArticle(articleId: string, isCollected: boolean) {
    return request<ArticleSummary>(`/articles/${encodeURIComponent(articleId)}/collect`, {
      method: 'POST',
      bodyJson: { isCollected },
    });
  },

  listVocab(params: { limit?: number; offset?: number } = {}) {
    return request<VocabEntry[]>(`/vocab${buildQuery({
      limit: params.limit ?? 100,
      offset: params.offset ?? 0,
    })}`);
  },

  createVocab(vocab: AnalyzeVocabulary, sourceArticleId?: string | null) {
    return request<VocabEntry>('/vocab', {
      method: 'POST',
      bodyJson: {
        word: vocab.word,
        phonetic: vocab.phonetic || null,
        translation: vocab.translation,
        exampleEn: vocab.exampleEn || null,
        exampleZh: vocab.exampleZh || null,
        sourceArticleId: sourceArticleId ?? null,
      },
    });
  },

  deleteVocab(vocabId: string) {
    return request<void>(`/vocab/${encodeURIComponent(vocabId)}`, {
      method: 'DELETE',
    });
  },

  getTodayReview(limit = 50) {
    return request<VocabEntry[]>(`/review/today${buildQuery({ limit })}`);
  },

  submitReview(vocabId: string, rating: ReviewRating) {
    return request<ReviewSubmitResponse>(`/review/${encodeURIComponent(vocabId)}`, {
      method: 'POST',
      bodyJson: { rating },
    });
  },

  getStats() {
    return request<StatsResponse>('/stats');
  },

  reportStudyTime(seconds: number) {
    return request<StatsResponse>('/stats/study-time', {
      method: 'POST',
      bodyJson: { seconds },
    });
  },
};
