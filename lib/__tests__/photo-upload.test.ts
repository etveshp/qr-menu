import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Category } from '../supabase';

const uploadMock = vi.fn();
const upsertMock = vi.fn();
const getSessionMock = vi.fn();

const DATA_URI = `data:image/webp;base64,${Buffer.from('abc').toString('base64')}`;

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
  upsertMock.mockResolvedValue({ error: null });
  getSessionMock.mockResolvedValue({ data: { session: null } });
  vi.stubGlobal('fetch', vi.fn());
  vi.doMock('@supabase/supabase-js', () => ({
    createClient: () => ({
      from: () => ({
        select: () => ({ order: async () => ({ data: [], error: null }) }),
        upsert: upsertMock,
      }),
      storage: { from: () => ({ upload: uploadMock }) },
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
  it('uploads the inline photo to Storage and stores the public URL', async () => {
    const { saveCategory } = await import('../supabase');

    await saveCategory(category({ id: 'cat-1', photo: DATA_URI }));

    expect(uploadMock).toHaveBeenCalledTimes(1);
    const [objectPath, blob] = uploadMock.mock.calls[0];
    expect(objectPath).toBe('categories/cat-1.webp');
    expect(blob).toBeInstanceOf(Blob);

    expect(upsertMock).toHaveBeenCalledTimes(1);
    const payload = upsertMock.mock.calls[0][0];
    expect(payload.photo).toContain('/storage/v1/object/public/menu-photos/categories/cat-1.webp');
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

    await saveCategory(category({ id: 'cat-2', photo: 'https://example.com/x.webp' }));

    expect(uploadMock).not.toHaveBeenCalled();
    const payload = upsertMock.mock.calls[0][0];
    expect(payload.photo).toBe('https://example.com/x.webp');
  });
});
