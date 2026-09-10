import { describe, expect, it } from 'vitest';
import {
  createModifierGroup,
  createModifierOption,
  missingRequiredGroups,
  normalizeModifierGroups,
  selectedDelta,
  selectionSignature,
  selectionSummary,
  toggleSelection,
  type ModifierSelection,
} from '@/lib/modifiers';
import type { ModifierGroup } from '@/lib/supabase';

const group = (over: Partial<ModifierGroup>): ModifierGroup => ({
  id: 'g1',
  nameUk: 'Смак',
  nameHu: '',
  nameEn: '',
  type: 'single',
  required: true,
  display: 'chips',
  sortOrder: 0,
  options: [],
  ...over,
});

describe('normalizeModifierGroups', () => {
  it('returns [] for non-array input', () => {
    expect(normalizeModifierGroups(null)).toEqual([]);
    expect(normalizeModifierGroups({})).toEqual([]);
    expect(normalizeModifierGroups('x')).toEqual([]);
  });

  it('normalizes partial groups and options with defaults', () => {
    const result = normalizeModifierGroups([
      { nameUk: 'Смак', type: 'weird', options: [{ nameUk: 'Апельсин', priceDelta: -5 }] },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('single');
    expect(result[0].required).toBe(false);
    expect(result[0].display).toBe('chips');
    expect(result[0].options[0].priceDelta).toBe(0);
    expect(result[0].id).toBeTruthy();
    expect(result[0].options[0].id).toBeTruthy();
  });

  it('keeps valid multiple/tiles/required values', () => {
    const result = normalizeModifierGroups([
      { id: 'g', nameUk: 'Додатки', type: 'multiple', required: true, display: 'tiles', options: [] },
    ]);
    expect(result[0]).toMatchObject({ id: 'g', type: 'multiple', required: true, display: 'tiles' });
  });
});

describe('createModifierGroup / createModifierOption', () => {
  it('creates a single required chips group by default', () => {
    const g = createModifierGroup();
    expect(g.type).toBe('single');
    expect(g.required).toBe(true);
    expect(g.display).toBe('chips');
    expect(g.options).toEqual([]);
    expect(g.id).toMatch(/^mod-/);
  });

  it('creates an option with zero delta', () => {
    const o = createModifierOption();
    expect(o.priceDelta).toBe(0);
    expect(o.id).toMatch(/^opt-/);
  });
});

describe('selectedDelta', () => {
  it('sums deltas of selected options only', () => {
    const groups = [
      group({ id: 'flavor', options: [
        { id: 'a', nameUk: 'Апельсин', nameHu: '', nameEn: '', priceDelta: 0, sortOrder: 0 },
        { id: 'b', nameUk: 'Персик', nameHu: '', nameEn: '', priceDelta: 5, sortOrder: 1 },
      ] }),
      group({ id: 'size', type: 'multiple', options: [
        { id: 's', nameUk: 'Великий', nameHu: '', nameEn: '', priceDelta: 10, sortOrder: 0 },
      ] }),
    ];
    const selection: ModifierSelection = { flavor: ['b'], size: ['s'] };
    expect(selectedDelta(groups, selection)).toBe(15);
    expect(selectedDelta(groups, {})).toBe(0);
  });
});

describe('selectionSignature', () => {
  it('is stable regardless of group and selection order', () => {
    const g1 = group({ id: 'a', sortOrder: 0 });
    const g2 = group({ id: 'b', sortOrder: 1, type: 'multiple' });
    const sig1 = selectionSignature([g1, g2], { b: ['y', 'x'], a: ['1'] });
    const sig2 = selectionSignature([g2, g1], { a: ['1'], b: ['x', 'y'] });
    expect(sig1).toBe('a:1|b:x,y');
    expect(sig1).toBe(sig2);
  });

  it('returns empty string when nothing is selected', () => {
    expect(selectionSignature([group({})], {})).toBe('');
  });
});

describe('missingRequiredGroups', () => {
  it('reports required groups without a selection', () => {
    const required = group({ id: 'r', required: true });
    const optional = group({ id: 'o', required: false });
    expect(missingRequiredGroups([required, optional], {})).toEqual([required]);
    expect(missingRequiredGroups([required, optional], { r: ['x'] })).toEqual([]);
  });
});

describe('toggleSelection', () => {
  it('replaces the choice for single groups (radio behaviour)', () => {
    const groups = [group({ id: 'f', type: 'single' })];
    expect(toggleSelection(groups, { f: ['a'] }, 'f', 'b')).toEqual({ f: ['b'] });
    expect(toggleSelection(groups, { f: ['a'] }, 'f', 'a')).toEqual({ f: [] });
  });

  it('adds/removes choices for multiple groups', () => {
    const groups = [group({ id: 't', type: 'multiple' })];
    expect(toggleSelection(groups, {}, 't', 'x')).toEqual({ t: ['x'] });
    expect(toggleSelection(groups, { t: ['x'] }, 't', 'y')).toEqual({ t: ['x', 'y'] });
    expect(toggleSelection(groups, { t: ['x', 'y'] }, 't', 'x')).toEqual({ t: ['y'] });
  });

  it('returns the same selection for an unknown group', () => {
    expect(toggleSelection([group({})], { g1: ['a'] }, 'nope', 'x')).toEqual({ g1: ['a'] });
  });
});

describe('selectionSummary', () => {
  it('joins localized option names in group order', () => {
    const groups = [
      group({ id: 'flavor', sortOrder: 0, options: [
        { id: 'a', nameUk: 'Апельсин', nameHu: 'Narancs', nameEn: 'Orange', priceDelta: 0, sortOrder: 0 },
      ] }),
      group({ id: 'size', sortOrder: 1, options: [
        { id: 's', nameUk: '0.5 л', nameHu: '0.5 l', nameEn: '0.5 l', priceDelta: 10, sortOrder: 0 },
      ] }),
    ];
    expect(selectionSummary(groups, { size: ['s'], flavor: ['a'] }, 'uk')).toBe('Апельсин · 0.5 л');
    expect(selectionSummary(groups, { flavor: ['a'] }, 'en')).toBe('Orange');
  });
});
