import type { Cache } from '@nestjs/cache-manager';
import { ReadCache } from './read-cache.js';

function cache(overrides: Partial<Cache>): Cache {
  return { stores: [], get: vi.fn(async () => undefined), set: vi.fn(async () => true), mdel: vi.fn(async () => true), ...overrides } as unknown as Cache;
}

describe('ReadCache', () => {
  it('returns a cached value without loading', async () => {
    const load = vi.fn();
    const readCache = new ReadCache(cache({ get: vi.fn(async () => ({ streak: 3 })) as Cache['get'] }));

    await expect(readCache.getOrLoad('streak:ada', 1000, load)).resolves.toEqual({ streak: 3 });
    expect(load).not.toHaveBeenCalled();
  });

  it('loads and caches on a miss', async () => {
    const store = cache({});
    const readCache = new ReadCache(store);

    await expect(readCache.getOrLoad('streak:ada', 1000, async () => 4)).resolves.toBe(4);
    expect(store.set).toHaveBeenCalledWith('streak:ada', 4, 1000);
  });

  it('reads from the source when the cache fails or hangs', async () => {
    const failing = new ReadCache(cache({ get: vi.fn(async () => Promise.reject(new Error('ECONNREFUSED'))) as Cache['get'] }));
    const hanging = new ReadCache(cache({ get: vi.fn(() => new Promise(() => {})) as Cache['get'], set: vi.fn(() => new Promise(() => {})) as Cache['set'] }));

    await expect(failing.getOrLoad('streak:ada', 1000, async () => 5)).resolves.toBe(5);
    await expect(hanging.getOrLoad('streak:ada', 1000, async () => 6)).resolves.toBe(6);
  });

  it('fails to forget when the cache fails, so invalidation is retried', async () => {
    const readCache = new ReadCache(cache({ mdel: vi.fn(async () => Promise.reject(new Error('ECONNREFUSED'))) as Cache['mdel'] }));

    await expect(readCache.forget(['streak:ada'])).rejects.toThrow('ECONNREFUSED');
  });
});
