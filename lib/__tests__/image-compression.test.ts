import { describe, it, expect } from 'vitest';
import {
  IMAGE_COMPRESSION,
  CROP_QUALITY,
  IMAGE_COMPRESSION_BASELINE,
  type ImageTarget,
} from '../image-compression';

const TARGETS = Object.keys(IMAGE_COMPRESSION) as ImageTarget[];

describe('image compression settings', () => {
  it('covers every upload target', () => {
    expect(TARGETS).toEqual(['cafeBanner', 'cafeLogo', 'category', 'product', 'advertising']);
  });

  it('at least doubles the linear resolution of every target', () => {
    for (const target of TARGETS) {
      const current = IMAGE_COMPRESSION[target];
      const baseline = IMAGE_COMPRESSION_BASELINE[target];
      expect(current.maxWidth).toBeGreaterThanOrEqual(baseline.maxWidth * 2);
      expect(current.maxHeight).toBeGreaterThanOrEqual(baseline.maxHeight * 2);
    }
  });

  it('uses a high WebP quality for both conversions', () => {
    for (const target of TARGETS) {
      expect(IMAGE_COMPRESSION[target].quality).toBeGreaterThanOrEqual(0.9);
      expect(CROP_QUALITY[target]).toBeGreaterThanOrEqual(0.9);
    }
  });
});
