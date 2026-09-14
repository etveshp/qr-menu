import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Category } from '../supabase';

const uploadMock = vi.fn();
const removeMock = vi.fn();
const upsertMock = vi.fn();
const getSessionMock = vi.fn();

const DATA_URI = `data:image/webp;base64,${Buffer.from('abc').toString('base64')}`;
const CATEGORY_PATHS = ['categories/cat-1.webp', 'categories/cat-1-original.webp'];

function category(overrides: Partial<Category>): Category {
  return {
    id: 'cat-1',
    nameUk: 'Кава',
    nameHu: '',
    nameEn: '',
    photo: '',
    sortOrder: 0,
    ...overrides,
  } as Category;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key');
  uploadMock.mockResolvedValue({ error: null });
  removeMock.mockResolvedValue({ error: null });
  upsertMock.mockResolvedValue({ error: null });
  getSessionMock.mockResolvedValue({ data: { session: null } });
  vi.stubGlobal('fetch', vi.fn());
  vi.doMock('@supabase/supabase-js', () => ({
    createClient: () => ({
      from: () => ({
        select: () => ({ order: async () => ({ data: [], error: null }) }),
        upsert: upsertMock,
        delete: () => ({ eq: async () => ({ error: null }) }),
      }),
      storage: { from: () => ({ upload: uploadMock, remove: removeMock }) },
      auth: { getSession: getSessionMock },
    }),
  }));
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.doUnmock('@supabase/supabase-js');
  vi.resetModules();
});

describe('saveCategory inline photo handling', () => {
  it('uploads the inline photo to Storage with a cache-busting version', async () => {
    const { saveCategory } = await import('../supabase');

    await saveCategory(category({ id: 'cat-1', photo: DATA_URI }));

    expect(uploadMock).toHaveBeenCalledTimes(1);
    const [objectPath, blob] = uploadMock.mock.calls[0];
    expect(objectPath).toBe('categories/cat-1.webp');
    expect(blob).toBeInstanceOf(Blob);

    const payload = upsertMock.mock.calls[0][0];
    expect(payload.photo).toContain('/storage/v1/object/public/menu-photos/categories/cat-1.webp?v=');
  });

  it('never fetches the data: URI (CSP blocks fetch("data:") in the browser)', async () => {
    const { saveCategory } = await import('../supabase');

    await saveCategory(category({ id: 'cat-1', photo: DATA_URI }));

    const fetchMock = vi.mocked(fetch);
    const dataCalls = fetchMock.mock.calls.filter((call) => String(call[0]).startsWith('data:'));
    expect(dataCalls).toHaveLength(0);
  });

  it('passes through already-stored URLs unchanged', async () => {
    const { saveCategory } = await import('../supabase');

    await saveCategory(
      category({
        id: 'cat-2',
        photo: 'https://example.com/x.webp',
        photoOriginal: 'https://example.com/x-original.webp',
      })
    );

    expect(uploadMock).not.toHaveBeenCalled();
    expect(removeMock).not.toHaveBeenCalled();
    const payload = upsertMock.mock.calls[0][0];
    expect(payload.photo).toBe('https://example.com/x.webp');
  });

  it('removes stored objects when the category photo is cleared', async () => {
    const { saveCategory } = await import('../supabase');

    await saveCategory(category({ id: 'cat-1', photo: '', photoOriginal: '' }));

    expect(removeMock).toHaveBeenCalledWith(CATEGORY_PATHS);
  });
});

describe('deleteCategory storage cleanup', () => {
  it('removes the category photo objects', async () => {
    const { deleteCategory } = await import('../supabase');

    await deleteCategory('cat-1');

    expect(removeMock).toHaveBeenCalledWith(CATEGORY_PATHS);
  });
});

describe('deleteProduct storage cleanup', () => {
  it('removes the product photo objects', async () => {
    const { deleteProduct } = await import('../supabase');

    await deleteProduct('prod-7');

    expect(removeMock).toHaveBeenCalledWith([
      'products/prod-7.webp',
      'products/prod-7-original.webp',
    ]);
  });
});

describe('saveAdvertising storage cleanup', () => {
  it('removes the popup objects when the ad photo is cleared', async () => {
    const { saveAdvertising } = await import('../supabase');

    await saveAdvertising({ photo: '', photoOriginal: '', delaySeconds: 5, enabled: false, showUntil: '', categoryId: '', productId: '' });

    expect(removeMock).toHaveBeenCalledWith([
      'advertising/popup.webp',
      'advertising/popup-original.webp',
    ]);
  });
});
