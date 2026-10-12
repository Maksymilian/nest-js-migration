import { CACHE_MANAGER, type Cache } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';

/** How long a cache call may take before the read falls back to PostgreSQL. */
const CACHE_TIMEOUT_MS = 250;

/**
 * Cache-aside for read models, on Redis. A cache failure never fails a read: it logs a warning
 * and reads from PostgreSQL. Forgetting keys does fail, so the invalidation handler is retried.
 */
@Injectable()
export class ReadCache {
  private readonly logger = new Logger(ReadCache.name);

  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {
    // @nestjs/cache-manager may wrap the Redis store in another Keyv: a store that emits `error`
    // without a listener would crash the process when Redis drops the connection.
    let lastWarning = 0;
    for (const store of cache.stores ?? []) {
      store.on('error', (error: unknown) => {
        if (Date.now() - lastWarning > 10_000) {
          lastWarning = Date.now();
          this.logger.warn(`Cache unavailable, reading from PostgreSQL: ${(error as Error)?.message ?? error}`);
        }
      });
    }
  }

  async getOrLoad<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
    try {
      const cached = await withTimeout(this.cache.get<T>(key));
      if (cached !== undefined && cached !== null) {
        return cached;
      }
    } catch (error) {
      this.logger.warn(`Cache read of ${key} failed, reading from PostgreSQL: ${(error as Error).message}`);
      return load(); // the cache is down: don't wait for a write that fails too
    }
    const value = await load();
    try {
      await withTimeout(this.cache.set(key, value, ttlMs));
    } catch (error) {
      this.logger.warn(`Cache write of ${key} failed: ${(error as Error).message}`);
    }
    return value;
  }

  /** Deletes the keys. Throws when the cache is unreachable, so the caller can retry. */
  async forget(keys: readonly string[]): Promise<void> {
    await withTimeout(this.cache.mdel([...keys]));
  }

  /** A round trip through the cache, for the health check. */
  async ping(): Promise<void> {
    const key = 'health:ping';
    await withTimeout(this.cache.set(key, Date.now(), 5000));
    await withTimeout(this.cache.get(key));
  }
}

async function withTimeout<T>(operation: Promise<T>): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`cache timed out after ${CACHE_TIMEOUT_MS} ms`)), CACHE_TIMEOUT_MS);
  });
  try {
    return await Promise.race([operation, timeout]);
  } finally {
    clearTimeout(timer);
  }
}
