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
process.env.RATE_LIMIT = 'on';
process.env.RATE_LIMIT_PER_MINUTE = '3';
process.env.QUERY_TIMEOUT_MS = '200';

const { AppModule } = await import('../src/app.module.js');
const { WORKOUT_TRACKING_BROKER } = await import('../src/platform/platform.module.js');
const { configureHttp } = await import('../src/platform/http/configure-http.js');
const { WorkoutQueries } = await import('../src/workout-tracking/workouts/application/queries/workout-queries.js');

/** Section 16: the rate limit (3 requests per minute here) and the timeout of GET routes (200 ms here). */
describe('Workout Tracking: rate limit and timeouts (e2e)', () => {
  let client: PGlite;
  let app: INestApplication<App>;
  const api = () => request(app.getHttpServer());

  /** A workout read that never answers, as when PostgreSQL stops answering. */
  const hangingWorkoutQueries = { byId: () => new Promise(() => {}), ofMember: () => new Promise(() => {}) };

  // A new application for each test: its rate limit counts from zero.
  beforeEach(async () => {
    client = await migratedDatabase();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(getDrizzleToken())
      .useValue(drizzle({ client }))
      .overrideProvider(WORKOUT_TRACKING_BROKER)
      .useValue({ emit: () => of(undefined) })
      .overrideProvider(WorkoutQueries)
      .useValue(hangingWorkoutQueries)
      .compile();
    app = configureHttp(moduleRef.createNestApplication());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    await client.close();
  });

  it('answers 429 with Retry-After past the rate limit, and never limits the health checks', async () => {
    const unknownEquipment = `/internal/v1/equipment/${uuidv7()}`;
    for (let i = 0; i < 3; i++) {
      await api().get(unknownEquipment).expect(404);
    }

    const rejected = await api().get(unknownEquipment).expect(429);
    expect(Number(rejected.headers['retry-after'])).toBeGreaterThan(0);
    await api().get('/health/live').expect(200);
  });

  it('answers 504 with code TIMEOUT when a GET route takes longer than the timeout', async () => {
    const started = Date.now();
    const { body } = await api().get(`/internal/v1/workouts/${uuidv7()}`).expect(504);

    expect(body).toMatchObject({ statusCode: 504, code: 'TIMEOUT' });
    expect(Date.now() - started).toBeLessThan(2000);
  });
});
