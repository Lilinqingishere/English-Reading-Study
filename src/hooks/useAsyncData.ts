import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from 'react';

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error';

interface AsyncDataOptions<T> {
  isEmpty?: (value: T) => boolean;
}

export interface AsyncDataState<T> {
  data: T | null;
  status: AsyncStatus;
  error: string | null;
  reload: () => Promise<void>;
  setData: Dispatch<SetStateAction<T | null>>;
}

export function useAsyncData<T>(
  loadData: () => Promise<T>,
  options: AsyncDataOptions<T> = {},
): AsyncDataState<T> {
  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<AsyncStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const isEmptyRef = useRef(options.isEmpty);

  useEffect(() => {
    isEmptyRef.current = options.isEmpty;
  }, [options.isEmpty]);

  const reload = useCallback(async () => {
    setStatus('loading');
    setError(null);

    try {
      const value = await loadData();
      setData(value);
      setStatus(isEmptyRef.current?.(value) ? 'empty' : 'success');
    } catch (err) {
      setError(err instanceof Error ? err.message : '请求失败，请稍后重试');
      setStatus('error');
    }
  }, [loadData]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    data,
    status,
    error,
    reload,
    setData,
  };
}
