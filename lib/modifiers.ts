import type { ModifierDisplay, ModifierGroup, ModifierOption, ModifierType } from './supabase';

/** Selected option ids per modifier group id. */
export type ModifierSelection = Record<string, string[]>;

const asString = (v: unknown): string => (typeof v === 'string' ? v : '');

const asNumber = (v: unknown): number => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};

const normalizeOption = (raw: unknown, index: number): ModifierOption => {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    id: asString(o.id) || `opt-${index}`,
    nameUk: asString(o.nameUk),
    nameHu: asString(o.nameHu),
    nameEn: asString(o.nameEn),
    priceDelta: Math.max(0, asNumber(o.priceDelta)),
    photo: asString(o.photo) || undefined,
    sortOrder: typeof o.sortOrder === 'number' ? o.sortOrder : index,
  };
};

const asType = (v: unknown): ModifierType => (v === 'multiple' ? 'multiple' : 'single');
const asDisplay = (v: unknown): ModifierDisplay => (v === 'tiles' ? 'tiles' : 'chips');

/** Coerce arbitrary JSON (e.g. from the DB jsonb column) into valid modifier groups. */
export function normalizeModifierGroups(raw: unknown): ModifierGroup[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((g): g is Record<string, unknown> => Boolean(g) && typeof g === 'object')
    .map((g, gi) => ({
      id: asString(g.id) || `mod-${gi}`,
      nameUk: asString(g.nameUk),
      nameHu: asString(g.nameHu),
      nameEn: asString(g.nameEn),
      type: asType(g.type),
      required: Boolean(g.required),
      display: asDisplay(g.display),
      sortOrder: typeof g.sortOrder === 'number' ? g.sortOrder : gi,
      options: Array.isArray(g.options) ? g.options.map((o, oi) => normalizeOption(o, oi)) : [],
    }));
}

let idCounter = 0;
const randomId = (prefix: string): string =>
  `${prefix}-${Date.now().toString(36)}${(idCounter++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export const createModifierGroup = (overrides: Partial<ModifierGroup> = {}): ModifierGroup => ({
  id: overrides.id ?? randomId('mod'),
  nameUk: '',
  nameHu: '',
  nameEn: '',
  type: 'single',
  required: true,
  display: 'chips',
  sortOrder: 0,
  options: [],
  ...overrides,
});

export const createModifierOption = (overrides: Partial<ModifierOption> = {}): ModifierOption => ({
  id: overrides.id ?? randomId('opt'),
  nameUk: '',
  nameHu: '',
  nameEn: '',
  priceDelta: 0,
  sortOrder: 0,
  ...overrides,
});

export const localizedGroupName = (group: ModifierGroup, lang: string): string => {
  if (lang === 'hu') return group.nameHu || group.nameUk;
  if (lang === 'en') return group.nameEn || group.nameUk;
  return group.nameUk;
};

export const localizedOptionName = (option: ModifierOption, lang: string): string => {
  if (lang === 'hu') return option.nameHu || option.nameUk;
  if (lang === 'en') return option.nameEn || option.nameUk;
  return option.nameUk;
};

const sortByOrder = <T extends { sortOrder: number }>(items: T[]): T[] =>
  [...items].sort((a, b) => a.sortOrder - b.sortOrder);

/** Sum of price deltas for the selected options. */
export function selectedDelta(groups: ModifierGroup[], selection: ModifierSelection): number {
  let delta = 0;
  for (const group of groups) {
    const ids = selection[group.id] ?? [];
    for (const id of ids) {
      const option = group.options.find((o) => o.id === id);
      if (option) delta += option.priceDelta;
    }
  }
  return delta;
}

/** Stable signature of a selection, used as a cart line key. */
export function selectionSignature(groups: ModifierGroup[], selection: ModifierSelection): string {
  const parts: string[] = [];
  for (const group of sortByOrder(groups)) {
    const ids = [...(selection[group.id] ?? [])].sort();
    if (ids.length > 0) parts.push(`${group.id}:${ids.join(',')}`);
  }
  return parts.join('|');
}

/** Build a group-keyed selection from a flat list of option ids. */
export function selectionFromOptionIds(groups: ModifierGroup[], optionIds: string[]): ModifierSelection {
  const selection: ModifierSelection = {};
  for (const optionId of optionIds) {
    const group = groups.find((g) => g.options.some((o) => o.id === optionId));
    if (!group) continue;
    selection[group.id] = [...(selection[group.id] ?? []), optionId];
  }
  return selection;
}

/** Groups marked required that have no selection yet. */
export function missingRequiredGroups(groups: ModifierGroup[], selection: ModifierSelection): ModifierGroup[] {
  return groups.filter((group) => group.required && (selection[group.id]?.length ?? 0) === 0);
}

/** Initial selection: preselect the first option of each required single-choice group. */
export function defaultSelection(groups: ModifierGroup[]): ModifierSelection {
  const selection: ModifierSelection = {};
  for (const group of groups) {
    if (group.required && group.type === 'single' && group.options[0]) {
      selection[group.id] = [group.options[0].id];
    }
  }
  return selection;
}

/**
 * Apply the "single" rule: keep only the last picked option for single-choice
 * groups, leave multiple-choice groups untouched.
 */
export function toggleSelection(
  groups: ModifierGroup[],
  selection: ModifierSelection,
  groupId: string,
  optionId: string
): ModifierSelection {
  const group = groups.find((g) => g.id === groupId);
  if (!group) return selection;
  const current = selection[groupId] ?? [];
  if (group.type === 'single') {
    return { ...selection, [groupId]: current.includes(optionId) ? [] : [optionId] };
  }
  const next = current.includes(optionId)
    ? current.filter((id) => id !== optionId)
    : [...current, optionId];
  return { ...selection, [groupId]: next };
}

/** Human-readable summary of the selection (for cart lines), e.g. "Апельсин · 0.5 л". */
export function selectionSummary(
  groups: ModifierGroup[],
  selection: ModifierSelection,
  lang: string
): string {
  const parts: string[] = [];
  for (const group of sortByOrder(groups)) {
    const ids = selection[group.id] ?? [];
    for (const id of ids) {
      const option = group.options.find((o) => o.id === id);
      if (option && option.nameUk.trim()) parts.push(localizedOptionName(option, lang));
    }
  }
  return parts.join(' · ');
}
