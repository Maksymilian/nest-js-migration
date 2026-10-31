import { EventEmitter } from 'node:events';
import { TimeUnit, type GlideClient } from '@valkey/valkey-glide';
import { Keyv } from 'keyv';

/**
 * The cache's Valkey store, on GLIDE. No Keyv adapter exists for GLIDE (`@keyv/valkey` is on
 * iovalkey, which no OpenTelemetry instrumentation covers), so this is Keyv's promise-based store
 * contract, which Keyv wraps in its bridge adapter: Keyv serializes the values and prefixes the
 * keys. A failed command throws; Keyv turns it into an `error` event and a miss, and the reads fall
 * back to PostgreSQL. A dropped connection never takes the service down.
 */
export class ValkeyStore extends EventEmitter {
  constructor(private readonly client: GlideClient) {
    super();
  }

  async get(key: string): Promise<string | undefined> {
    const value = await this.client.get(key);
    return value === null ? undefined : String(value);
  }

  async getMany(keys: string[]): Promise<(string | undefined)[]> {
    if (keys.length === 0) {
      return [];
    }
    return (await this.client.mget(keys)).map((value) => (value === null ? undefined : String(value)));
  }

  async set(key: string, value: unknown, ttl?: number): Promise<boolean> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    const expiry = ttl !== undefined && ttl > 0 ? { type: TimeUnit.Milliseconds, count: Math.ceil(ttl) } : undefined;
    return (await this.client.set(key, serialized, { expiry })) === 'OK';
  }

  async has(key: string): Promise<boolean> {
    return (await this.client.exists([key])) === 1;
  }

  async delete(key: string): Promise<boolean> {
    return (await this.client.unlink([key])) === 1;
  }

  async deleteMany(keys: string[]): Promise<boolean> {
    return keys.length === 0 || (await this.client.unlink(keys)) > 0;
  }

  /** Every key but the locks' (ValkeyLockStore), which share the database. */
  async clear(): Promise<void> {
    let cursor = '0';
    do {
      const [next, keys] = await this.client.scan(cursor, { count: 1000 });
      cursor = String(next);
      const cached = keys.map(String).filter((key) => !key.startsWith('locks:'));
      if (cached.length > 0) {
        await this.client.unlink(cached);
      }
    } while (cursor !== '0');
  }

  async disconnect(): Promise<void> {
    this.client.close();
  }
}

export function valkeyKeyv(client: GlideClient): Keyv {
  return new Keyv({ store: new ValkeyStore(client) });
}
