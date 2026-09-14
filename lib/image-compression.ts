export type ImageTarget = 'cafeBanner' | 'cafeLogo' | 'category' | 'product' | 'advertising';

export interface ImageCompressionSetting {
  /** Longest-side cap applied before cropping (also the max crop source resolution). */
  maxWidth: number;
  maxHeight: number;
  /** WebP quality for the initial conversion of the uploaded file. */
  quality: number;
}

/**
 * Upload compression settings. Compared to the original pipeline these keep
 * the full 2x linear resolution (4x pixels) and a high WebP quality, so the
 * cropped result stays sharp on retina screens. Photos are stored in Storage
 * and referenced by URL, so their size no longer affects the menu JSON.
 */
export const IMAGE_COMPRESSION: Record<ImageTarget, ImageCompressionSetting> = {
  cafeBanner: { maxWidth: 2400, maxHeight: 1350, quality: 0.9 },
  cafeLogo: { maxWidth: 500, maxHeight: 500, quality: 0.92 },
  category: { maxWidth: 1200, maxHeight: 900, quality: 0.9 },
  product: { maxWidth: 1200, maxHeight: 1200, quality: 0.9 },
  advertising: { maxWidth: 1080, maxHeight: 1920, quality: 0.9 },
};

/** WebP quality for the final crop export per target. */
export const CROP_QUALITY: Record<ImageTarget, number> = {
  cafeBanner: 0.9,
  cafeLogo: 0.92,
  category: 0.9,
  product: 0.9,
  advertising: 0.9,
};

/** Baseline of the previous (heavily compressed) pipeline, kept for reference/tests. */
export const IMAGE_COMPRESSION_BASELINE: Record<ImageTarget, ImageCompressionSetting> = {
  cafeBanner: { maxWidth: 1200, maxHeight: 675, quality: 0.75 },
  cafeLogo: { maxWidth: 250, maxHeight: 250, quality: 0.85 },
  category: { maxWidth: 600, maxHeight: 450, quality: 0.75 },
  product: { maxWidth: 600, maxHeight: 600, quality: 0.75 },
  advertising: { maxWidth: 540, maxHeight: 960, quality: 0.8 },
};
