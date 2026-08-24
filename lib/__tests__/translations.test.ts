import { describe, it, expect } from 'vitest';
import { TRANSLATIONS, type Language } from '../translations';

const LANGS: Language[] = ['uk', 'hu', 'en'];

describe('TRANSLATIONS', () => {
  it('has identical key sets across all languages', () => {
    const ukKeys = Object.keys(TRANSLATIONS.uk).sort();
    for (const lang of LANGS) {
      expect(Object.keys(TRANSLATIONS[lang]).sort(), lang).toEqual(ukKeys);
    }
  });

  it('has no empty translation values', () => {
    for (const lang of LANGS) {
      for (const [key, value] of Object.entries(TRANSLATIONS[lang])) {
        expect(value, `${lang}.${key}`).toBeTruthy();
      }
    }
  });

  it('includes table placeholder in tableGreeting', () => {
    expect(TRANSLATIONS.uk.tableGreeting).toContain('{number}');
    expect(TRANSLATIONS.hu.tableGreeting).toContain('{number}');
    expect(TRANSLATIONS.en.tableGreeting).toContain('{number}');
  });
});
