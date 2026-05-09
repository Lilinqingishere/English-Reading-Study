import { useEffect, useRef } from 'react';
import { api } from '../lib/api';

const REPORT_INTERVAL_SECONDS = 30;

export function useStudyTimeReporter() {
  const pendingSecondsRef = useRef(0);
  const lastTickRef = useRef(Date.now());
  const isFlushingRef = useRef(false);

  useEffect(() => {
    const flush = async () => {
      if (isFlushingRef.current || pendingSecondsRef.current <= 0) {
        return;
      }

      const seconds = Math.min(pendingSecondsRef.current, 3600);
      pendingSecondsRef.current -= seconds;
      isFlushingRef.current = true;

      try {
        await api.reportStudyTime(seconds);
      } catch {
        pendingSecondsRef.current += seconds;
      } finally {
        isFlushingRef.current = false;
      }
    };

    const accumulateVisibleSeconds = () => {
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - lastTickRef.current) / 1000);
      lastTickRef.current = now;

      if (document.visibilityState !== 'visible' || elapsedSeconds <= 0) {
        return;
      }

      pendingSecondsRef.current += elapsedSeconds;
      if (pendingSecondsRef.current >= REPORT_INTERVAL_SECONDS) {
        void flush();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        void flush();
      }
      lastTickRef.current = Date.now();
    };

    const timer = window.setInterval(accumulateVisibleSeconds, 1000);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      void flush();
    };
  }, []);
}
