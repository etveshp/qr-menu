'use client';

import { useCallback, useState } from 'react';
import { TRANSLATIONS, Language } from '@/lib/translations';

const STORAGE_KEY = 'aura_lang';

export function useLanguage() {
  const [lang, setLang] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem(STORAGE_KEY);
      if (savedLang === 'uk' || savedLang === 'hu' || savedLang === 'en') {
        return savedLang as Language;
      }
    }
    return 'uk';
  });

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
