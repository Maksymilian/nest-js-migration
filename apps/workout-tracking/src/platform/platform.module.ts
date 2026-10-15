import { TelemetryModule, TracedTransport } from '@app/telemetry';
import { Global, Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_PIPE } from '@nestjs/core';
import { DrizzleModule, getDrizzleToken } from '@nestjs/drizzle';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ClientProxyTransport, OutboxModule, OutboxStorage } from '@nestjs/outbox';
import { fromDrizzle, PostgresOutboxStore } from '@nestjs/outbox/postgres';
import { ResilienceModule } from '@nestjs/resilience';
import { minutes, ThrottlerModule } from '@nestjs/throttler';
import { drizzle } from 'drizzle-orm/node-postgres';
import { isPublishedLanguage, PUBLISHED_LANGUAGE_EXCHANGE } from '../workout-tracking/published-language/broker.js';
import { toCloudEvent } from '../workout-tracking/published-language/cloud-event.mapper.js';
import { workoutTrackingRoutes } from '../workout-tracking/published-language/routes.js';
import { type Environment, validateEnvironment } from './config/environment.js';
import type { Database } from './database/database.js';
import { Transactions } from './database/transactions.js';
import { HealthModule } from './health/health.module.js';
import { DomainErrorFilter } from './http/domain-error.filter.js';
import { RateLimitGuard } from './http/rate-limit.guard.js';
import { CloudEventSerializer } from './messaging/cloud-event.serializer.js';
import { DomainEventPublisher } from './outbox/domain-event-publisher.js';
import { OutboxDomainEventPublisher } from './outbox/outbox-domain-event-publisher.js';
import { RouteTable } from './outbox/route-table.js';
import { OutboxAdminModule } from './outbox-admin/outbox-admin.module.js';

/** The RabbitMQ client the outbox relay publishes integration events through. */
export const WORKOUT_TRACKING_BROKER = 'WORKOUT_TRACKING_BROKER';

/**
 * Technical plumbing of the service: configuration, the database, the outbox and its relay to
 * RabbitMQ, the rate limit and timeouts, validation, error mapping, health checks. No domain concepts.
 */
@Global()
@Module({
  imports: [
    TelemetryModule,
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: 'apps/workout-tracking/.env',
      validate: validateEnvironment,
    }),
    DrizzleModule.forRootAsync({
      inject: [ConfigService],
      // A pg pool on PostgreSQL instance 1, closed after the relay drained on shutdown.
      useFactory: (config: ConfigService<Environment, true>) => ({
        drizzle,
        connection: {
          connectionString: config.get('DATABASE_URL', { infer: true }),
          min: 2,
          max: 25,
          connectionTimeoutMillis: 5_000,
          application_name: 'workout-tracking',
        },
      }),
    }),
    OutboxModule.forRootAsync({
      imports: [
        ClientsModule.registerAsync([
          {
            name: WORKOUT_TRACKING_BROKER,
            inject: [ConfigService],
            useFactory: (config: ConfigService<Environment, true>) => ({
              transport: Transport.RMQ,
              options: {
                urls: [config.get('RABBITMQ_URL', { infer: true })],
                // The published language's topic exchange: each topic is its routing key.
                exchange: PUBLISHED_LANGUAGE_EXCHANGE,
                exchangeType: 'topic',
                wildcards: true,
                // Survive a broker restart. The channel waits for publisher confirms, so
                // "published" means stored by the broker.
                persistent: true,
                // Each message is a CloudEvent in structured content mode.
                serializer: new CloudEventSerializer(),
              },
            }),
          },
        ]),
      ],
      transports: {
        // In the trace of the change that staged the event, which Training Progress continues.
        rabbitmq: TracedTransport(
          ClientProxyTransport(WORKOUT_TRACKING_BROKER, {
            // The topic is the routing key, and the integration event goes as a CloudEvent.
            toPacket: (message) => ({ pattern: message.topic, data: toCloudEvent(message) }),
          }),
        ),
      },
      inject: [ConfigService],
      useFactory: (config: ConfigService<Environment, true>) => ({
        route: (message) => (isPublishedLanguage(message.topic) ? 'rabbitmq' : 'local'),
        relay: { enabled: config.get('OUTBOX_RELAY', { infer: true }) !== 'off' },
        // The package default, 20 attempts over 30 to 60 minutes: a broker outage doesn't dead-letter events.
        retry: { attempts: 20 },
      }),
    }),
    // The rate limit per caller (section 16), counted in this instance's memory: it applies per instance.
    // Only with RATE_LIMIT=on; off (the default), every request passes, uncounted: in AWS, WAF limits callers.
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Environment, true>) => {
        const off = config.get('RATE_LIMIT', { infer: true }) === 'off';
        return {
          throttlers: [{ ttl: minutes(1), limit: config.get('RATE_LIMIT_PER_MINUTE', { infer: true }) }],
          skipIf: () => off,
        };
      },
    }),
    // Timeouts (section 16): a route with @Timeout() is answered 504 after QUERY_TIMEOUT_MS.
    ResilienceModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Environment, true>) => ({ defaults: { timeout: config.get('QUERY_TIMEOUT_MS', { infer: true }) } }),
    }),
    HealthModule,
    OutboxAdminModule,
  ],
  providers: [
    {
      // Messages in this service's database, in a schema of their own (nest_outbox). Liquibase
      // creates and migrates that schema (changeset 0002), so the store never does.
      provide: PostgresOutboxStore,
      inject: [getDrizzleToken(), OutboxStorage],
      useFactory: (db: Database, outboxStorage: OutboxStorage) =>
        new PostgresOutboxStore({ executor: fromDrizzle(db), migrate: false }, outboxStorage),
    },
    { provide: RouteTable, useValue: workoutTrackingRoutes },
    { provide: DomainEventPublisher, useClass: OutboxDomainEventPublisher },
    Transactions,
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    },
    { provide: APP_FILTER, useClass: DomainErrorFilter },
    { provide: APP_GUARD, useClass: RateLimitGuard },
  ],
  exports: [Transactions, DomainEventPublisher],
})
export class PlatformModule {}
