// Pure helpers for storing menu photos in Supabase Storage.
// A photo column keeps holding a single string: either an inline data: URI
// (legacy / fallback when Storage is unavailable) or the public Storage URL.
// Object paths are deterministic per slot so re-saving a crop overwrites the
// same object (upsert) instead of accumulating orphans.

export const PHOTO_BUCKET = 'menu-photos';

// Paths for the single-row entities (cafe_info id=1, advertising id=1).
export const CAFE_PHOTO_PATHS = {
  banner: 'cafe/banner.webp',
  logo: 'cafe/logo.webp',
  bannerOriginal: 'cafe/banner-original.webp',
  logoOriginal: 'cafe/logo-original.webp',
} as const;

export const ADVERTISING_PHOTO_PATHS = {
  photo: 'advertising/popup.webp',
  photoOriginal: 'advertising/popup-original.webp',
} as const;

export type EntityKind = 'category' | 'product';

export const entityPhotoPaths = (kind: EntityKind, id: string) => {
  const folder = kind === 'category' ? 'categories' : 'products';
  return {
    photo: `${folder}/${id}.webp`,
    photoOriginal: `${folder}/${id}-original.webp`,
  };
};

const DATA_URI_RE = /^data:image\/(?:webp|png|jpe?g|gif|avif);base64,/i;

export const isDataUriPhoto = (value: string): boolean => DATA_URI_RE.test(value);

export const dataUriMime = (value: string): string => {
  const m = /^data:([^;,]+);base64,/.exec(value);
  return m ? m[1].toLowerCase() : 'image/webp';
};

export const dataUriToBase64 = (value: string): string => {
  const m = /^data:image\/[^;,]+;base64,([\s\S]*)$/.exec(value);
  return m ? m[1] : '';
};

/** Public URL of a stored object, e.g. `${baseUrl}/storage/v1/object/public/menu-photos/cafe/banner.webp`. */
export const objectPublicUrl = (baseUrl: string, bucket: string, path: string): string =>
  `${baseUrl.replace(/\/+$/, '')}/storage/v1/object/public/${bucket}/${path}`;

/** Inverse of objectPublicUrl: extracts the object path, or null for foreign URLs. */
export const storagePathFromPublicUrl = (baseUrl: string, bucket: string, url: string): string | null => {
  const prefix = `${baseUrl.replace(/\/+$/, '')}/storage/v1/object/public/${bucket}/`;
  return url.startsWith(prefix) ? url.slice(prefix.length) : null;
};

/** Trigger a file download in the browser. Shared utility used by QR download components. */
export const triggerDownload = (blob: Blob, filename: string): void => {
  const a = document.createElement('a');
  const objectUrl = URL.createObjectURL(blob);
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
};

/** Crop an image to WebP using canvas. Enforces exact aspect ratio. */
export const cropImageToWebP = (
  imageSrc: string,
  pixels: { x: number; y: number; width: number; height: number },
  aspect: number,
  quality: number = 0.8
): Promise<string> => {
  return new Promise((resolve) => {
    const img = new window.Image();
    if (!imageSrc.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let srcX = pixels.x;
      let srcY = pixels.y;
      let srcW = pixels.width;
      let srcH = pixels.height;
      if (srcW / srcH > aspect) {
        srcW = Math.round(srcH * aspect);
      } else {
        srcH = Math.round(srcW / aspect);
      }
      srcX += Math.round((pixels.width - srcW) / 2);
      srcY += Math.round((pixels.height - srcH) / 2);
      srcW = Math.max(1, Math.min(srcW, img.width - srcX));
      srcH = Math.max(1, Math.min(srcH, img.height - srcY));
      const outW = Math.max(1, Math.round(srcW));
      const outH = Math.max(1, Math.round(outW / aspect));
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(imageSrc); return; }
      ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, outW, outH);
      resolve(canvas.toDataURL('image/webp', quality));
    };
    img.onerror = () => { resolve(imageSrc); };
    img.src = imageSrc;
  });
};
