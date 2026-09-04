import { describe, expect, it } from 'vitest';
import { arrayMove, nextSortOrder, sortBySortOrder } from '@/lib/reorder';

describe('arrayMove', () => {
  const items = ['a', 'b', 'c', 'd'];

  it('moves an item forward', () => {
    expect(arrayMove(items, 0, 2)).toEqual(['b', 'c', 'a', 'd']);
  });

  it('moves an item backward', () => {
    expect(arrayMove(items, 3, 1)).toEqual(['a', 'd', 'b', 'c']);
  });

  it('returns the same array when moving to the same index', () => {
    expect(arrayMove(items, 1, 1)).toEqual(items);
  });

  it('does not mutate the input array', () => {
    const input = items.slice();
    arrayMove(input, 0, 3);
    expect(input).toEqual(items);
  });

  it('ignores out-of-range indices', () => {
    expect(arrayMove(items, -1, 2)).toEqual(items);
    expect(arrayMove(items, 1, 99)).toEqual(items);
  });
});

describe('nextSortOrder', () => {
  it('returns 0 for an empty list', () => {
    expect(nextSortOrder([])).toBe(0);
  });

  it('returns max + 1 for contiguous orders', () => {
    expect(nextSortOrder([{ sortOrder: 0 }, { sortOrder: 1 }, { sortOrder: 2 }])).toBe(3);
  });

  it('falls back to list length when max + 1 is already used (legacy default-0 data)', () => {
    expect(nextSortOrder([{ sortOrder: 0 }, { sortOrder: 0 }, { sortOrder: 0 }])).toBe(3);
  });

  it('treats missing sortOrder as 0', () => {
    expect(nextSortOrder([{}, { sortOrder: 0 }])).toBe(2);
  });
});

describe('sortBySortOrder', () => {
  it('sorts ascending and is stable', () => {
    const items = [
      { id: 'c', sortOrder: 2 },
      { id: 'a', sortOrder: 0 },
      { id: 'a2', sortOrder: 0 },
      { id: 'b', sortOrder: 1 },
    ];
    const sorted = sortBySortOrder(items);
    expect(sorted.map(i => i.id)).toEqual(['a', 'a2', 'b', 'c']);
  });

  it('treats missing sortOrder as 0 and does not mutate input', () => {
    const items = [{ id: 'x' }, { id: 'y', sortOrder: 1 }];
    const sorted = sortBySortOrder(items);
    expect(sorted.map(i => i.id)).toEqual(['x', 'y']);
    expect(items[0].sortOrder).toBeUndefined();
  });
});