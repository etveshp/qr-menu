import { describe, it, expect } from 'vitest';
import {
  PHOTO_BUCKET,
  CAFE_PHOTO_PATHS,
  ADVERTISING_PHOTO_PATHS,
  entityPhotoPaths,
  isDataUriPhoto,
  dataUriMime,
  dataUrlToBlob,
  objectPublicUrl,
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

describe('dataUriMime', () => {
  it('extracts the mime type', () => {
    expect(dataUriMime('data:image/webp;base64,QUJD')).toBe('image/webp');
    expect(dataUriMime('data:image/png;base64,QUJD')).toBe('image/png');
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

describe('dataUrlToBlob', () => {
  it('decodes a base64 data URL into a Blob', () => {
    const blob = dataUrlToBlob('data:image/png;base64,QUJD');
    expect(blob.type).toBe('image/png');
    expect(blob.size).toBe(3);
  });

  it('decodes a non-base64 data URL', () => {
    const blob = dataUrlToBlob('data:text/plain,hello%20world');
    expect(blob.type).toBe('text/plain');
    expect(blob.size).toBe(11);
  });

  it('falls back to application/octet-stream for a malformed value', () => {
    const blob = dataUrlToBlob('not-a-data-url');
    expect(blob.type).toBe('application/octet-stream');
  });
});

describe('objectPublicUrl', () => {
  it('builds a public URL for a stored object', () => {
    expect(objectPublicUrl(BASE, PHOTO_BUCKET, 'cafe/banner.webp')).toBe(
      `${BASE}/storage/v1/object/public/menu-photos/cafe/banner.webp`
    );
  });

  it('normalizes a trailing slash on the base URL', () => {
    expect(objectPublicUrl(`${BASE}/`, PHOTO_BUCKET, 'x.webp')).toBe(
      `${BASE}/storage/v1/object/public/menu-photos/x.webp`
    );
  });
});
