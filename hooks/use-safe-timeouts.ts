'use client';

import { useCallback, useEffect, useRef } from 'react';

export function useSafeTimeouts() {
  const timersRef = useRef<number[]>([]);

  useEffect(() => () => {
    for (const id of timersRef.current) clearTimeout(id);
    timersRef.current = [];
  }, []);

  return useCallback((handler: () => void, delay: number) => {
    const id = window.setTimeout(() => {
      timersRef.current = timersRef.current.filter((t) => t !== id);
      handler();
    }, delay);
    timersRef.current.push(id);
    return id;
  }, []);
}
