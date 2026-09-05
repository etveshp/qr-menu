'use client';

import { useSyncExternalStore } from 'react';

function subscribe(query: string) {
  return (callback: () => void) => {
    if (typeof window === 'undefined') return () => {};
    const mql = window.matchMedia(query);
    mql.addEventListener('change', callback);
    return () => mql.removeEventListener('change', callback);
  };
}

function getSnapshot(query: string) {
  return () => (typeof window !== 'undefined' ? window.matchMedia(query).matches : false);
}

function getServerSnapshot() {
  return false;
}

/**
 * SSR-safe media query. During hydration React uses the server snapshot
 * (`false`), so the first client render always matches the SSR HTML; the real
 * value is applied right after hydration.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(subscribe(query), getSnapshot(query), getServerSnapshot);
}
