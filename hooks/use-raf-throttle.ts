'use client';

import { useCallback, useEffect, useRef } from 'react';

export function useRafThrottle(callback: () => void): () => void {
  const callbackRef = useRef(callback);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => () => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
    }
  }, []);

  return useCallback(() => {
    if (frameRef.current !== null) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      callbackRef.current();
    });
  }, []);
}
