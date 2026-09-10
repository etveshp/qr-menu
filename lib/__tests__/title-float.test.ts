import { describe, expect, it } from 'vitest';
import { computeTitleFloat, TITLE_FLOAT_BOTTOM_GAP } from '@/lib/title-float';

const PADDING = 20;
const ROW = 50;
const PHOTO = 300; // типова висота 4:3 фото на мобільному (≈390px width)

describe('computeTitleFloat', () => {
  it('at scrollTop 0 keeps the row fully in flow (no clone, no gradient)', () => {
    const s = computeTitleFloat({ scrollTop: 0, paddingTop: PADDING, rowHeight: ROW, photoHeight: PHOTO });
    expect(s.progress).toBe(0);
    expect(s.cloneOpacity).toBe(0);
    expect(s.inFlowOpacity).toBe(1);
    expect(s.gradientHeight).toBe(0);
    expect(s.gradientOpacity).toBe(0);
    expect(s.cloneBottom).toBe(PADDING + ROW);
  });

  it('starts rising only after the row reaches the photo bottom edge', () => {
    const s = computeTitleFloat({ scrollTop: PADDING, paddingTop: PADDING, rowHeight: ROW, photoHeight: PHOTO });
    expect(s.progress).toBe(0);
    expect(s.cloneOpacity).toBe(0);
    expect(s.inFlowOpacity).toBe(1);
    expect(s.cloneBottom).toBe(ROW);
  });

  it('is fully over the photo when scrolled by paddingTop + rowHeight', () => {
    const s = computeTitleFloat({ scrollTop: PADDING + ROW, paddingTop: PADDING, rowHeight: ROW, photoHeight: PHOTO });
    expect(s.progress).toBe(1);
    expect(s.cloneOpacity).toBe(1);
    expect(s.inFlowOpacity).toBe(0);
    expect(s.cloneBottom).toBe(TITLE_FLOAT_BOTTOM_GAP);
    expect(s.gradientHeight).toBe(PHOTO / 3);
    expect(s.gradientOpacity).toBe(1);
  });

  it('cross-fades in the middle of the transition', () => {
    const s = computeTitleFloat({ scrollTop: PADDING + ROW / 2, paddingTop: PADDING, rowHeight: ROW, photoHeight: PHOTO });
    expect(s.progress).toBe(0.5);
    expect(s.cloneOpacity).toBe(0.5);
    expect(s.inFlowOpacity).toBe(0.5);
    expect(s.cloneBottom).toBe((ROW + TITLE_FLOAT_BOTTOM_GAP) / 2);
    expect(s.gradientHeight).toBe(PHOTO / 3 / 2);
  });

  it('clamps negative scrollTop to the rest state', () => {
    const s = computeTitleFloat({ scrollTop: -100, paddingTop: PADDING, rowHeight: ROW, photoHeight: PHOTO });
    expect(s.progress).toBe(0);
    expect(s.cloneOpacity).toBe(0);
    expect(s.inFlowOpacity).toBe(1);
  });

  it('clamps excessive scrollTop to the fully-floated state', () => {
    const s = computeTitleFloat({ scrollTop: 1000, paddingTop: PADDING, rowHeight: ROW, photoHeight: PHOTO });
    expect(s.progress).toBe(1);
    expect(s.cloneOpacity).toBe(1);
    expect(s.inFlowOpacity).toBe(0);
    expect(s.cloneBottom).toBe(TITLE_FLOAT_BOTTOM_GAP);
  });

  it('guards against zero/negative row height', () => {
    const s = computeTitleFloat({ scrollTop: 100, paddingTop: PADDING, rowHeight: 0, photoHeight: PHOTO });
    expect(Number.isFinite(s.progress)).toBe(true);
    expect(s.progress).toBe(1);
    expect(s.cloneBottom).toBe(TITLE_FLOAT_BOTTOM_GAP);
  });
});