'use client';

import { useEffect } from 'react';

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function useFocusTrap(
  ref: React.RefObject<HTMLElement | null>,
  active: boolean
) {
  useEffect(() => {
    if (!active || !ref.current) return;
    const el = ref.current;
    const focusables = el.querySelectorAll<HTMLElement>(FOCUSABLE);
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    first?.focus();

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !focusables.length) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [active, ref]);
}