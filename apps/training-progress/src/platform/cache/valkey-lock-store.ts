import { Injectable, type OnApplicationShutdown, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type LockAcquireResult, type LockStore, LocksStorage } from '@nestjs/locks';
import { type GlideClient, Script } from '@valkey/valkey-glide';
import type { Environment } from '../config/environment.js';
import { createValkeyClient } from './valkey-client.js';

// The store on Valkey, after the one on Redis in docs/nestjs/reliability/locks.md: each method is
// one Lua script, which Valkey runs atomically.

// Takes the lock if nobody holds it, expiring on Valkey's clock, and draws a fencing token from a
// counter that never goes back. Returns the token, or 0.
const ACQUIRE = `
if server.call('SET', KEYS[1], ARGV[1], 'NX', 'PX', ARGV[2]) then
  return server.call('INCR', KEYS[2])
end
return 0
`;

// Renews the lock, if it is still ours.
const RENEW = `
if server.call('GET', KEYS[1]) == ARGV[1] then
  return server.call('PEXPIRE', KEYS[1], ARGV[2])
end
return 0
`;

// Deletes the lock, if it is still ours.
const RELEASE = `
if server.call('GET', KEYS[1]) == ARGV[1] then
  return server.call('DEL', KEYS[1])
end
return 0
`;

/** Where the fencing counter lives; no lock key can be named like it. */
const FENCING_COUNTER = 'locks:fencing-token';

/**
 * `@nestjs/locks`' store, on the cache's Valkey (VALKEY_URL), with a client of its own: the locks
 * every instance shares, such as the read cache's load lock (section 8.1). A dropped connection
 * never takes the service down: the calls fail within the client's request timeout while Valkey is
 * unreachable, and the client reconnects in the background.
 */
@Injectable()
export class ValkeyLockStore implements LockStore, OnModuleInit, OnApplicationShutdown {
  private readonly url: string;
  private readonly traceSamplePercentage: number;
  private readonly scripts = { acquire: new Script(ACQUIRE), renew: new Script(RENEW), release: new Script(RELEASE) };
  private client?: Promise<GlideClient>;

  constructor(config: ConfigService<Environment, true>, storage: LocksStorage) {
    this.url = config.get('VALKEY_URL', { infer: true });
    this.traceSamplePercentage = config.get('VALKEY_TRACE_SAMPLE_PERCENTAGE', { infer: true });
    storage.registerSource(this);
  }

  onModuleInit(): void {
    // Connects on the first command: a Valkey that is down doesn't stop the service from starting.
    this.client = createValkeyClient(this.url, this.traceSamplePercentage);
  }

  // After beforeApplicationShutdown(), where @nestjs/locks releases the locks still held.
  async onApplicationShutdown(): Promise<void> {
    (await this.client)?.close();
    for (const script of Object.values(this.scripts)) {
      script.release();
    }
  }

  async acquire(key: string, owner: string, ttl: number): Promise<LockAcquireResult> {
    const token = Number(await this.run(this.scripts.acquire, [this.key(key), FENCING_COUNTER], [owner, String(ttl)]));
    return token > 0 ? { acquired: true, fencingToken: token } : { acquired: false };
  }

  async renew(key: string, owner: string, ttl: number): Promise<boolean> {
    return Number(await this.run(this.scripts.renew, [this.key(key)], [owner, String(ttl)])) === 1;
  }

  async release(key: string, owner: string): Promise<boolean> {
    return Number(await this.run(this.scripts.release, [this.key(key)], [owner])) === 1;
  }

  /** Only when connected; the store's contract test waits for it. */
  async connected(): Promise<void> {
    await (await this.started()).ping();
  }

  private async run(script: Script, keys: string[], args: string[]) {
    return (await this.started()).invokeScript(script, { keys, args });
  }

  private started(): Promise<GlideClient> {
    if (!this.client) {
      throw new Error('ValkeyLockStore used before onModuleInit()');
    }
    return this.client;
  }

  private key(key: string) {
    return `locks:key:${key}`;
  }
}
