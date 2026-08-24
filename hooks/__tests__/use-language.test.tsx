import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useLanguage } from '../use-language';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

beforeEach(() => {
  localStorage.clear();
});

describe('useLanguage', () => {
  it('defaults to uk', () => {
    const { result } = renderHook(() => useLanguage());
    expect(result.current.lang).toBe('uk');
  });

  it('loads saved language from localStorage', () => {
    localStorage.setItem('aura_lang', 'hu');
    const { result } = renderHook(() => useLanguage());
    expect(result.current.lang).toBe('hu');
  });

  it('changes language and persists', () => {
    const { result } = renderHook(() => useLanguage());
    act(() => result.current.changeLanguage('en'));
    expect(result.current.lang).toBe('en');
    expect(localStorage.getItem('aura_lang')).toBe('en');
  });

  it('translates keys per language', () => {
    const { result } = renderHook(() => useLanguage());
    act(() => result.current.changeLanguage('hu'));
    expect(result.current.t('categories')).toBe('Kategóriák');
  });
});