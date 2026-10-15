import type { PGlite } from '@electric-sql/pglite';
import type { INestApplication } from '@nestjs/common';
import { getDrizzleToken } from '@nestjs/drizzle';
import { Test } from '@nestjs/testing';
import { drizzle } from 'drizzle-orm/pglite';
import { of } from 'rxjs';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { v7 as uuidv7 } from 'uuid';
import { migratedDatabase } from './support/migrated-database.js';

process.env.DATABASE_URL = 'postgres://unused:unused@localhost:1/unused';
process.env.RABBITMQ_URL = 'amqp://localhost:1';
process.env.OUTBOX_RELAY = 'off';
process.env.RATE_LIMIT = 'off'; // whatever .env says: the default is checked below
process.env.RATE_LIMIT_PER_MINUTE = '3';

const { AppModule } = await import('../src/app.module.js');
const { WORKOUT_TRACKING_BROKER } = await import('../src/platform/platform.module.js');
const { configureHttp } = await import('../src/platform/http/configure-http.js');
const { validateEnvironment } = await import('../src/platform/config/environment.js');

/** Section 16.1: without RATE_LIMIT=on (in AWS, WAF limits callers in front of the service), nothing is limited here. */
describe('Workout Tracking: rate limit off (e2e)', () => {
  let client: PGlite;
  let app: INestApplication<App>;

  beforeAll(async () => {
    client = await migratedDatabase();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(getDrizzleToken())
      .useValue(drizzle({ client }))
      .overrideProvider(WORKOUT_TRACKING_BROKER)
      .useValue({ emit: () => of(undefined) })
      .compile();
    app = configureHttp(moduleRef.createNestApplication());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await client.close();
  });

  it('is off unless RATE_LIMIT=on', () => {
    expect(validateEnvironment({ DATABASE_URL: 'postgres://localhost/db', RABBITMQ_URL: 'amqp://localhost' }).RATE_LIMIT).toBe('off');
  });

  it('lets every request through past RATE_LIMIT_PER_MINUTE, without the rate limit headers', async () => {
    const unknownEquipment = `/internal/v1/equipment/${uuidv7()}`;
    for (let i = 0; i < 5; i++) {
      const { headers } = await request(app.getHttpServer()).get(unknownEquipment).expect(404);
      expect(headers['x-ratelimit-limit']).toBeUndefined();
    }
  });
});
