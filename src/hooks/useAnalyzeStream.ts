import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import type { AnalyzeResponse } from '../types';

export type AnalyzeStreamStatus = 'idle' | 'streaming' | 'success' | 'error';
const ANALYSIS_RESULT_STORAGE_KEY = 'english-reading:last-analysis-result';

const emptyResult = (text: string): AnalyzeResponse => ({
  articleId: '',
  title: '',
  difficulty: 'CET4',
  wordCount: 0,
  originalText: text,
  translation: '',
  coreVocabulary: [],
  longSentences: [],
  tokensUsed: 0,
  durationMs: 0,
  analysisModel: '',
});

export function useAnalyzeStream() {
  const [result, setResult] = useState<AnalyzeResponse | null>(() => restoreStoredResult());
  const [status, setStatus] = useState<AnalyzeStreamStatus>(() => (restoreStoredResult() ? 'success' : 'idle'));
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  useEffect(() => {
    if (status !== 'success' || !result) {
      return;
    }

    window.sessionStorage.setItem(ANALYSIS_RESULT_STORAGE_KEY, JSON.stringify(result));
  }, [result, status]);

  const analyze = async (text: string) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setStatus('streaming');
    setError(null);
    setResult(emptyResult(text));

    try {
      await api.analyzeStream(
        text,
        {
          onMeta: (event) => {
            setResult((prev) => ({
              ...(prev ?? emptyResult(text)),
              articleId: event.articleId,
              title: event.title,
              difficulty: event.difficulty,
              wordCount: event.wordCount,
              analysisModel: event.analysisModel,
            }));
          },
          onTranslation: (event) => {
            setResult((prev) => ({
              ...(prev ?? emptyResult(text)),
              translation: event.translation,
            }));
          },
          onVocabulary: (event) => {
            setResult((prev) => {
              const current = prev ?? emptyResult(text);
              if (current.coreVocabulary.some((item) => item.id === event.id)) {
                return current;
              }

              return {
                ...current,
                coreVocabulary: [...current.coreVocabulary, event],
              };
            });
          },
          onSentence: (event) => {
            setResult((prev) => {
              const current = prev ?? emptyResult(text);
              if (current.longSentences.some((item) => item.id === event.id)) {
                return current;
              }

              return {
                ...current,
                longSentences: [...current.longSentences, event],
              };
            });
          },
          onDone: (event) => {
            setResult((prev) => ({
              ...(prev ?? emptyResult(text)),
              articleId: event.articleId,
              tokensUsed: event.tokensUsed,
              durationMs: event.durationMs,
            }));
          },
        },
        null,
        controller.signal,
      );
      setStatus('success');
    } catch (err) {
      if (controller.signal.aborted) {
        return;
      }

      setError(err instanceof Error ? err.message : '阅读分析失败，请稍后重试');
      setStatus('error');
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null;
      }
    }
  };

  const reset = () => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setStatus('idle');
    setResult(null);
    setError(null);
    window.sessionStorage.removeItem(ANALYSIS_RESULT_STORAGE_KEY);
  };

  return {
    analyze,
    reset,
    result,
    status,
    error,
  };
}

function restoreStoredResult(): AnalyzeResponse | null {
  try {
    const stored = window.sessionStorage.getItem(ANALYSIS_RESULT_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as AnalyzeResponse) : null;
  } catch {
    window.sessionStorage.removeItem(ANALYSIS_RESULT_STORAGE_KEY);
    return null;
  }
}
