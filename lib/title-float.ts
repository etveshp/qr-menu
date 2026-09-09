/**
 * Геометрія «напливу» назви страви та ціни над фото у розкритій картці (ProductModal).
 *
 * При скролі контенту картки рядок назви+ціни не ховається під фото, а плавно
 * напливає над нижнім краєм фото на висоту свого рядка і зупиняється, лишаючи
 * невеликий відступ (TITLE_FLOAT_BOTTOM_GAP) від нижнього краю фото. Одночасно
 * знизу фото «пропагується» вгору затемнюючий градієнт — рівно такої висоти,
 * щоб назву і ціну було видно.
 *
 * Уся логіка тут — чиста функція від scrollTop контейнера та виміряних розмірів,
 * щоб її можна було покрити юніт-тестами без DOM.
 */

/** Додатковий «повітряний» зазор градієнта над рядком назви, px. */
export const TITLE_FLOAT_GRADIENT_GAP = 12;

/** Мультиплікатор висоти градієнта відносно рядка — градієнт піднімається вище, щоб
 *  назву+ціну було видно навіть на світлому фото. */
const GRADIENT_HEIGHT_MULT = 3;

/** Відступ між нижнім краєм фото та нижнім краєм напливлого рядка назви, px. */
export const TITLE_FLOAT_BOTTOM_GAP = 16;

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
   * 1 — рядок повністю наплив над фото (нижній край на TITLE_FLOAT_BOTTOM_GAP вище нижнього краю фото).
   */
  progress: number;
  /** Зсув нижнього краю копії ряду над нижнім краєм фото, px (у напливі — TITLE_FLOAT_BOTTOM_GAP). */
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
  // У фазі «під фото» копія рухається від свого місця до нижнього краю фото;
  // у фазі напливу вона доходить до спокою на TITLE_FLOAT_BOTTOM_GAP вище нижнього краю фото.
  const cloneBottom =
    travel <= paddingTop
      ? total - travel
      : safeRow - progress * (safeRow - TITLE_FLOAT_BOTTOM_GAP);
  return {
    progress,
    cloneBottom,
    cloneOpacity: progress > 0 ? 1 : 0,
    inFlowOpacity: 1 - progress,
    gradientHeight: (safeRow * GRADIENT_HEIGHT_MULT + TITLE_FLOAT_BOTTOM_GAP) * progress,
    gradientOpacity: progress,
  };
}