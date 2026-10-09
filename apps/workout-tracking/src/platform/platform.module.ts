import { Global, Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { DrizzleModule, getDrizzleToken } from '@nestjs/drizzle';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ClientProxyTransport, OutboxModule, OutboxStorage } from '@nestjs/outbox';
import { fromDrizzle, PostgresOutboxStore } from '@nestjs/outbox/postgres';
import { drizzle } from 'drizzle-orm/node-postgres';
import { isPublishedLanguage, PUBLISHED_LANGUAGE_EXCHANGE } from '../workout-tracking/published-language/broker.js';
import { workoutTrackingRoutes } from '../workout-tracking/published-language/routes.js';
import { type Environment, validateEnvironment } from './config/environment.js';
import type { Database } from './database/database.js';
import { Transactions } from './database/transactions.js';
import { HealthModule } from './health/health.module.js';
import { DomainErrorFilter } from './http/domain-error.filter.js';
import { DomainEventPublisher } from './outbox/domain-event-publisher.js';
import { OutboxDomainEventPublisher } from './outbox/outbox-domain-event-publisher.js';
import { RouteTable } from './outbox/route-table.js';
import { OutboxAdminModule } from './outbox-admin/outbox-admin.module.js';

/** The RabbitMQ client the outbox relay publishes integration events through. */
export const WORKOUT_TRACKING_BROKER = 'WORKOUT_TRACKING_BROKER';

/**
 * Technical plumbing of the service: configuration, the database, the outbox and its relay to
 * RabbitMQ, validation, error mapping, health checks. No domain concepts.
 */
@Global()
@Module({
  imports: [
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
        connection: config.get('DATABASE_URL', { infer: true }),
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
              },
            }),
          },
        ]),
      ],
      transports: { rabbitmq: ClientProxyTransport(WORKOUT_TRACKING_BROKER) },
      inject: [ConfigService],
      useFactory: (config: ConfigService<Environment, true>) => ({
        route: (message) => (isPublishedLanguage(message.topic) ? 'rabbitmq' : 'local'),
        relay: { enabled: config.get('OUTBOX_RELAY', { infer: true }) !== 'off' },
        // The package default, 20 attempts over 30 to 60 minutes: a broker outage doesn't dead-letter events.
        retry: { attempts: 20 },
      }),
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
  ],
  exports: [Transactions, DomainEventPublisher],
})
export class PlatformModule {}
