'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { TRANSLATIONS, Language } from '@/lib/translations';

const STORAGE_KEY = 'aura_lang';

export function useLanguage() {
  const [lang, setLang] = useState<Language>('uk');
  const hydratedRef = useRef(false);

  // Load saved language after mount to avoid SSR hydration mismatch.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedLang = localStorage.getItem(STORAGE_KEY);
    if (savedLang === 'uk' || savedLang === 'hu' || savedLang === 'en') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLang(savedLang as Language);
    }
    hydratedRef.current = true;
  }, []);

  const changeLanguage = useCallback((newLang: Language) => {
    setLang(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, newLang);
    }
  }, []);

  const t = useCallback(
    (key: keyof typeof TRANSLATIONS['uk']) => {
      return TRANSLATIONS[lang][key] || TRANSLATIONS['uk'][key] || key;
    },
    [lang]
  );

  return { lang, changeLanguage, t };
}