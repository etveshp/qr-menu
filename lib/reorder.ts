// Чиста логіка впорядкування категорій і страв (drag & drop в адмінці).
// Винесено в окремий модуль, щоб покрити юніт-тестами без DOM/БД.

/** Переміщує елемент з позиції `from` на позицію `to` (індекси поточного масиву). */
export const arrayMove = <T>(items: T[], from: number, to: number): T[] => {
  const next = items.slice();
  if (from < 0 || from >= next.length || to < 0 || to >= next.length) return next;
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
};

/**
 * Наступний `sortOrder` для нового елемента. При консистентному (суцільному)
 * порядку 0..n-1 це просто `items.length`; якщо в даних є прогалини/старі
 * значення (усі 0) — береться максимум (max+1), але не менше `items.length`,
 * щоб позиція була унікальною й після всіх наявних.
 */
export const nextSortOrder = (items: Array<{ sortOrder?: number }>): number => {
  const max = items.reduce((m, i) => Math.max(m, i.sortOrder ?? 0), -1);
  return Math.max(items.length, max + 1);
};

/** Стабільне сортування за `sortOrder` (зростання). Не мутує вхідний масив. */
export const sortBySortOrder = <T extends { sortOrder?: number }>(items: T[]): T[] =>
  items.slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
