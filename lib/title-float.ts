/**
 * Геометрія «напливу» назви страви та ціни над фото у розкритій картці (ProductModal).
 *
 * При скролі контенту картки рядок назви+ціни не ховається під фото, а плавно
 * напливає над нижнім краєм фото на висоту свого рядка і зупиняється, коли його
 * нижній край досягає нижнього краю фото. Одночасно знизу фото «пропагується»
 * вгору затемнюючий градієнт — рівно такої висоти, щоб назву і ціну було видно.
 *
 * Уся логіка тут — чиста функція від scrollTop контейнера та виміряних розмірів,
 * щоб її можна було покрити юніт-тестами без DOM.
 */

/** Додатковий «повітряний» зазор градієнта над рядком назви, px. */
export const TITLE_FLOAT_GRADIENT_GAP = 12;

export interface TitleFloatInput {
  /** Поточна позиція скролу контейнера з контентом, px (0..scrollHeight). */
  scrollTop: number;
  /** Верхній падінг контейнера скролу (відступ рядка назви від фото), px. */
  paddingTop: number;
  /** Висота рядка «назва + ціна», px. */
  rowHeight: number;
}

export interface TitleFloatState {
  /**
   * Прогрес переходу 0..1: 0 — рядок ще повністю під фото (у потоці контенту),
   * 1 — рядок повністю наплив над фото (нижній край збігається з нижнім краєм фото).
   */
  progress: number;
  /** Зсув копії ряду вгору відносно нижнього краю фото, px (0 — упритул до фото). */
  cloneBottom: number;
  /** Прозорість «світлої» копії над фото, 0..1. */
  cloneOpacity: number;
  /** Прозорість оригінального рядка у потоці контенту, 0..1. */
  inFlowOpacity: number;
  /** Висота затемнюючого градієнта знизу фото, px. */
  gradientHeight: number;
  /** Прозорість градієнта, 0..1. */
  gradientOpacity: number;
}

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

export function computeTitleFloat({ scrollTop, paddingTop, rowHeight }: TitleFloatInput): TitleFloatState {
  const safeRow = Math.max(1, rowHeight);
  // Повний шлях, який проходить рядок до повного напливу над фото:
  // спершу піднімається від свого місця (відступ paddingTop), далі — на висоту рядка.
  const total = paddingTop + safeRow;
  const travel = Math.min(Math.max(scrollTop, 0), total);
  // Частка рядка, що вже опинилась над фото (0 — рядок цілком під фото).
  const progress = clamp01((scrollTop - paddingTop) / safeRow);
  return {
    progress,
    cloneBottom: total - travel,
    cloneOpacity: progress,
    inFlowOpacity: 1 - progress,
    gradientHeight: (safeRow + TITLE_FLOAT_GRADIENT_GAP) * progress,
    gradientOpacity: progress,
  };
}