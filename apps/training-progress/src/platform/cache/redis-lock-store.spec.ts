import type { ConfigService } from '@nestjs/config';
import { LocksStorage } from '@nestjs/locks';
import { lockStoreContract } from '@nestjs/locks/testing';
import type { Environment } from '../config/environment.js';
import { RedisLockStore } from './redis-lock-store.js';

/**
 * `@nestjs/locks`' LockStore contract, the races included, against a real Redis: CI's Redis
 * service, or locally `LOCK_STORE_REDIS_URL=redis://localhost:6379 pnpm test` with Compose's. The
 * expiry cases wait in real time (about 25 seconds): the store expires locks on Redis's clock.
 */
const url = process.env.LOCK_STORE_REDIS_URL;

describe.runIf(url)('RedisLockStore, the LockStore contract', () => {
  const config = { get: () => url } as unknown as ConfigService<Environment, true>;
  // Several connections, so the calls really overlap.
  const pool = Array.from({ length: 8 }, () => new RedisLockStore(config, new LocksStorage()));
  let next = 0;

  beforeAll(async () => {
    for (const store of pool) {
      store.onModuleInit();
      await store.connected();
    }
  });
  afterAll(() => Promise.all(pool.map((store) => store.onApplicationShutdown())));

  for (const contractCase of lockStoreContract(() => pool[next++ % pool.length]!, { concurrent: true })) {
    it(contractCase.name, contractCase.run, 60_000);
  }
});
