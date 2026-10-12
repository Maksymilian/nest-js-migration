import { ApolloDriver, type ApolloDriverConfig } from '@nestjs/apollo';
import { CacheModule } from '@nestjs/cache-manager';
import { Global, Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { CqrsModule } from '@nestjs/cqrs';
import { DrizzleModule, getDrizzleToken } from '@nestjs/drizzle';
import { GraphQLModule } from '@nestjs/graphql';
import { OutboxModule, OutboxStorage } from '@nestjs/outbox';
import { fromDrizzle, PostgresOutboxStore } from '@nestjs/outbox/postgres';
import { drizzle } from 'drizzle-orm/node-postgres';
import { CacheInvalidationHandler } from './cache/cache-invalidation.handler.js';
import { ReadCache } from './cache/read-cache.js';
import { redisStore } from './cache/redis-store.js';
import { type Environment, validateEnvironment } from './config/environment.js';
import type { Database } from './database/database.js';
import { Transactions } from './database/transactions.js';
import { DomainErrorFilter } from './errors/domain-error.filter.js';
import { HealthModule } from './health/health.module.js';
import { DeadLetterTopology } from './messaging/dead-letter-topology.js';
import { DomainEventPublisher } from './outbox/domain-event-publisher.js';
import { OutboxDomainEventPublisher } from './outbox/outbox-domain-event-publisher.js';
import { RouteTable } from './outbox/route-table.js';
import { trainingProgressRoutes } from './outbox/routes.js';
import { OutboxAdminModule } from './outbox-admin/outbox-admin.module.js';
import { TelegramModule } from './telegram/telegram.module.js';

/**
 * Technical plumbing of the service: configuration, the database, the outbox (domain events to
 * the policies, the published language to Notifications, all in-process), Redis, GraphQL,
 * scheduling, RabbitMQ topology, validation, error mapping, health checks, the Telegram bot. No
 * domain concepts.
 */
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: 'apps/training-progress/.env',
      validate: validateEnvironment,
    }),
    CqrsModule.forRoot(),
    DrizzleModule.forRootAsync({
      inject: [ConfigService],
      // A pg pool on PostgreSQL instance 2, closed after the relay drained on shutdown.
      useFactory: (config: ConfigService<Environment, true>) => ({
        drizzle,
        connection: {
          connectionString: config.get('DATABASE_URL', { infer: true }),
          min: 2,
          max: 25,
          connectionTimeoutMillis: 5_000,
          statement_timeout: 15_000,
          application_name: 'training-progress',
        },
      }),
    }),
    OutboxModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Environment, true>) => ({
        // Every message is handled in this process: policies, cache invalidation, Notifications.
        relay: { enabled: config.get('OUTBOX_RELAY', { infer: true }) !== 'off' },
      }),
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      // Redis only: an in-memory tier couldn't be invalidated from another instance.
      useFactory: (config: ConfigService<Environment, true>) => ({ stores: [redisStore(config.get('REDIS_URL', { infer: true }))] }),
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      // Code first: the schema is generated from the resolvers and types, in memory.
      autoSchemaFile: true,
      sortSchema: true,
      path: '/graphql',
    }),
    HealthModule,
    OutboxAdminModule,
    TelegramModule,
  ],
  providers: [
    {
      // Messages and inboxes in this service's database, in a schema of their own (nest_outbox).
      // Liquibase creates and migrates that schema, so the store never does.
      provide: PostgresOutboxStore,
      inject: [getDrizzleToken(), OutboxStorage],
      useFactory: (db: Database, outboxStorage: OutboxStorage) =>
        new PostgresOutboxStore({ executor: fromDrizzle(db), migrate: false }, outboxStorage),
    },
    { provide: RouteTable, useValue: trainingProgressRoutes },
    { provide: DomainEventPublisher, useClass: OutboxDomainEventPublisher },
    Transactions,
    ReadCache,
    CacheInvalidationHandler,
    DeadLetterTopology,
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    },
    { provide: APP_FILTER, useClass: DomainErrorFilter },
  ],
  exports: [Transactions, DomainEventPublisher, ReadCache, TelegramModule],
})
export class PlatformModule {}
