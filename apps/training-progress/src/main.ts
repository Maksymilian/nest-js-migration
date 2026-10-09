import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { type MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module.js';
import type { Environment } from './platform/config/environment.js';
import { configureHttp } from './platform/http/configure-http.js';
import { WorkoutTrackingSubscription } from './training-progress/workout-tracking-acl/subscription.js';

/**
 * A hybrid application: GraphQL over HTTP, plus the RabbitMQ listener of the anticorruption layer.
 * `listen()` comes before `startAllMicroservices()`, so no message is handled before every module
 * has initialized; and queries are served even while RabbitMQ is down.
 */
async function bootstrap() {
  const app = configureHttp(await NestFactory.create(AppModule));
  const config = app.get(ConfigService<Environment, true>);
  const { exchange, routingKey, queue, queueArguments } = WorkoutTrackingSubscription;
  app.connectMicroservice<MicroserviceOptions>(
    {
      transport: Transport.RMQ,
      options: {
        urls: [config.get('RABBITMQ_URL', { infer: true })],
        queue,
        queueOptions: { durable: true, arguments: queueArguments },
        exchange,
        exchangeType: 'topic',
        routingKey,
        // Acked only after the transaction commits, by the anticorruption layer.
        noAck: false,
        prefetchCount: 20,
      },
    },
    { inheritAppConfig: true },
  );
  // On SIGTERM: readiness turns 503, the outbox relay drains, then the pools close.
  app.enableShutdownHooks();
  await app.listen(config.get('PORT', { infer: true }));
  await app.startAllMicroservices();
}
await bootstrap();
