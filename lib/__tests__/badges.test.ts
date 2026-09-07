import { describe, expect, it } from 'vitest';
import { PRODUCT_BADGES, PRODUCT_BADGE_KEYS, productBadgeById } from '@/lib/badges';

describe('product badges', () => {
  it('exposes the expected badge ids', () => {
    expect(PRODUCT_BADGES.map((b) => b.id)).toEqual(['new', 'sale', 'no-sugar', 'lent']);
  });

  it('maps every badge to a translation key and tailwind classes', () => {
    for (const badge of PRODUCT_BADGES) {
      expect(PRODUCT_BADGE_KEYS[badge.id]).toMatch(/^badge/);
      expect(badge.className).toContain('bg-[#');
    }
  });

  it('finds a badge by id and returns undefined for unknown ones', () => {
    expect(productBadgeById('sale')?.id).toBe('sale');
    expect(productBadgeById('')).toBeUndefined();
    expect(productBadgeById(undefined)).toBeUndefined();
  });
});
