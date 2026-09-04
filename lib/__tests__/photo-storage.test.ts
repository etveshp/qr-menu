import { describe, it, expect } from 'vitest';
import {
  PHOTO_BUCKET,
  CAFE_PHOTO_PATHS,
  ADVERTISING_PHOTO_PATHS,
  entityPhotoPaths,
  isDataUriPhoto,
  dataUriMime,
  dataUriToBase64,
  objectPublicUrl,
  storagePathFromPublicUrl,
} from '../photo-storage';

const BASE = 'https://abc123.supabase.co';

describe('isDataUriPhoto', () => {
  it('accepts base64 data URIs of common image types', () => {
    expect(isDataUriPhoto('data:image/webp;base64,UklGR')).toBe(true);
    expect(isDataUriPhoto('data:image/png;base64,iVBOR')).toBe(true);
    expect(isDataUriPhoto('data:image/jpeg;base64,/9j/4')).toBe(true);
    expect(isDataUriPhoto('data:image/gif;base64,R0lGOD')).toBe(true);
  });

  it('rejects non-photo values', () => {
    expect(isDataUriPhoto('')).toBe(false);
    expect(isDataUriPhoto('https://abc.supabase.co/storage/v1/object/public/menu-photos/x.webp')).toBe(false);
    expect(isDataUriPhoto('data:text/html;base64,PGg=')).toBe(false);
    expect(isDataUriPhoto('data:image/webp,'.replace(';base64,', ','))).toBe(false); // not base64
  });
});

describe('dataUriMime / dataUriToBase64', () => {
  it('extracts mime and payload', () => {
    expect(dataUriMime('data:image/webp;base64,QUJD')).toBe('image/webp');
    expect(dataUriToBase64('data:image/webp;base64,QUJD')).toBe('QUJD');
    expect(dataUriToBase64('no data uri')).toBe('');
  });
});

describe('object paths', () => {
  it('defines stable single-row paths', () => {
    expect(CAFE_PHOTO_PATHS.banner).toBe('cafe/banner.webp');
    expect(ADVERTISING_PHOTO_PATHS.photoOriginal).toBe('advertising/popup-original.webp');
  });

  it('builds deterministic entity paths from the id', () => {
    expect(entityPhotoPaths('category', 'cat-123')).toEqual({
      photo: 'categories/cat-123.webp',
      photoOriginal: 'categories/cat-123-original.webp',
    });
    expect(entityPhotoPaths('product', 'prod-7').photo).toBe('products/prod-7.webp');
  });
});

describe('objectPublicUrl / storagePathFromPublicUrl', () => {
  it('round-trips public URLs', () => {
    const path = 'cafe/banner.webp';
    const url = objectPublicUrl(BASE, PHOTO_BUCKET, path);
    expect(url).toBe(`${BASE}/storage/v1/object/public/menu-photos/cafe/banner.webp`);
    expect(storagePathFromPublicUrl(BASE, PHOTO_BUCKET, url)).toBe(path);
  });

  it('returns null for foreign or malformed URLs', () => {
    expect(storagePathFromPublicUrl(BASE, PHOTO_BUCKET, 'https://other.com/x.webp')).toBeNull();
    expect(storagePathFromPublicUrl(BASE, PHOTO_BUCKET, '')).toBeNull();
    expect(storagePathFromPublicUrl(BASE, PHOTO_BUCKET, `${BASE}/storage/v1/object/public/other-bucket/x`)).toBeNull();
  });
});
