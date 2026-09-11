import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const createdTopics: string[] = [];
const removeChannel = vi.fn();

beforeEach(() => {
  createdTopics.length = 0;
  removeChannel.mockClear();
  vi.resetModules();
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key');
  vi.doMock('@supabase/supabase-js', () => {
    const makeChannel = (topic: string) => {
      createdTopics.push(topic);
      const channel = {
        on: () => channel,
        subscribe: () => channel,
      };
      return channel;
    };
    return {
      createClient: () => ({
        channel: makeChannel,
        removeChannel,
        from: () => ({
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: null, error: null }),
            }),
          }),
        }),
      }),
    };
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.doUnmock('@supabase/supabase-js');
  vi.resetModules();
});

describe('realtime channel topics are unique per subscription', () => {
  it('cafe_info re-subscription uses a fresh topic and cleans up', async () => {
    const { subscribeCafeInfo } = await import('../supabase');
    const offA = subscribeCafeInfo(vi.fn(), { skipInitial: true });
    const offB = subscribeCafeInfo(vi.fn(), { skipInitial: true });
    expect(createdTopics).toHaveLength(2);
    expect(createdTopics[0]).toMatch(/^cafe-info-\d+$/);
    expect(createdTopics[0]).not.toBe(createdTopics[1]);
    offA();
    offB();
    expect(removeChannel).toHaveBeenCalledTimes(2);
  });

  it('categories re-subscription uses a fresh topic', async () => {
    const { subscribeCategories } = await import('../supabase');
    subscribeCategories(vi.fn(), { skipInitial: true });
    subscribeCategories(vi.fn(), { skipInitial: true });
    expect(createdTopics).toHaveLength(2);
    expect(createdTopics[0]).toMatch(/^categories-\d+$/);
    expect(new Set(createdTopics).size).toBe(2);
  });

  it('products re-subscription uses a fresh topic', async () => {
    const { subscribeProducts } = await import('../supabase');
    subscribeProducts(vi.fn(), { skipInitial: true });
    subscribeProducts(vi.fn(), { skipInitial: true });
    expect(createdTopics).toHaveLength(2);
    expect(createdTopics[0]).toMatch(/^products-\d+$/);
    expect(new Set(createdTopics).size).toBe(2);
  });
});
