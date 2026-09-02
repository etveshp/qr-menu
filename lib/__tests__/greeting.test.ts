import { describe, it, expect } from 'vitest';
import { getRandomGreeting } from '../supabase';

describe('getRandomGreeting', () => {
  it('returns empty for null/undefined/empty', () => {
    expect(getRandomGreeting(null)).toBe('');
    expect(getRandomGreeting('')).toBe('');
    expect(getRandomGreeting('   ')).toBe('');
  });

  it('picks a single greeting', () => {
    expect(getRandomGreeting('Ласкаво просимо!')).toBe('Ласкаво просимо!');
  });

  it('splits by newline and trims', () => {
    const raw = 'Привіт! \n  Гарного дня!\nЧас кави ☕';
    const pick = getRandomGreeting(raw, () => 0);
    expect(pick).toBe('Привіт!');
    const pick2 = getRandomGreeting(raw, () => 0.9);
    expect(pick2).toBe('Час кави ☕');
  });

  it('still splits by semicolon (legacy)', () => {
    const raw = 'Привіт!; Гарного дня!';
    expect(getRandomGreeting(raw, () => 0)).toBe('Привіт!');
  });

  it('ignores empty entries between separators', () => {
    const pick = getRandomGreeting('А\n\nБ', () => 0.5);
    expect(['А', 'Б']).toContain(pick);
  });
});
