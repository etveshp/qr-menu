import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act, cleanup } from '@testing-library/react';
import { useMenuData } from '../use-menu-data';

const mocks = vi.hoisted(() => ({
  subscribeCafeInfo: vi.fn(),
  subscribeCategories: vi.fn(),
  subscribeProducts: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  subscribeCafeInfo: mocks.subscribeCafeInfo,
  subscribeCategories: mocks.subscribeCategories,
  subscribeProducts: mocks.subscribeProducts,
}));

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
});

beforeEach(() => {
  localStorage.clear();
});

function setupSubscriptions() {
  const unsubscribes = [vi.fn(), vi.fn(), vi.fn()];
  mocks.subscribeCafeInfo.mockImplementation((cb: (d: unknown) => void) => {
    cb({ name: 'Кав\'ярня', description: '', banner: '', logo: '', instagram: '' });
    return unsubscribes[0];
  });
  mocks.subscribeCategories.mockImplementation((cb: (d: unknown) => void) => {
    cb([]);
    return unsubscribes[1];
  });
  mocks.subscribeProducts.mockImplementation((cb: (d: unknown) => void) => {
    cb([]);
    return unsubscribes[2];
  });
  return unsubscribes;
}

describe('useMenuData', () => {
  it('loads data via subscriptions and stops loading', async () => {
    setupSubscriptions();
    const { result } = renderHook(() => useMenuData());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.cafeInfo?.name).toBe('Кав\'ярня');
  });

  it('uses initialData when provided', async () => {
    mocks.subscribeCafeInfo.mockReturnValue(vi.fn());
    mocks.subscribeCategories.mockReturnValue(vi.fn());
    mocks.subscribeProducts.mockReturnValue(vi.fn());
    const initial = {
      cafeInfo: { name: 'Світ Кави' },
      categories: [{ id: 'c1', nameUk: 'Кава' } as any],
      products: [{ id: 'p1' } as any],
    };
    const { result } = renderHook(() => useMenuData(initial));
    expect(result.current.cafeInfo?.name).toBe('Світ Кави');
  });

  it('reads cafeInfo from localStorage cache', async () => {
    localStorage.setItem('cafeInfo', JSON.stringify({ name: 'Кеш' }));
    mocks.subscribeCafeInfo.mockReturnValue(vi.fn());
    mocks.subscribeCategories.mockReturnValue(vi.fn());
    mocks.subscribeProducts.mockReturnValue(vi.fn());
    const { result } = renderHook(() => useMenuData());
    expect(result.current.cafeInfo?.name).toBe('Кеш');
  });

  it('unsubscribes all on unmount', () => {
    const unsubscribes = setupSubscriptions();
    const { unmount } = renderHook(() => useMenuData());
    unmount();
    unsubscribes.forEach((u) => expect(u).toHaveBeenCalled());
  });
});