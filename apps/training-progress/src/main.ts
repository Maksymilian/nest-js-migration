import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { type MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module.js';
import type { Environment } from './platform/config/environment.js';
import { configureHttp } from './platform/http/configure-http.js';
import { CloudEventDeserializer } from './platform/messaging/cloud-event.deserializer.js';
import { ScheduleTriggers } from './platform/messaging/schedule-triggers.js';
import { WorkoutTrackingSubscription } from './training-progress/workout-tracking-acl/subscription.js';

/**
 * A hybrid application: GraphQL over HTTP, plus two RabbitMQ listeners: the anticorruption layer's,
 * and the schedule triggers'.
 * `listen()` comes before `startAllMicroservices()`, so no message is handled before every module
 * has initialized; and queries are served even while RabbitMQ is down.
 */
async function bootstrap() {
  // rawBody: Telegram's webhook is verified on the bytes it sent, not on a re-serialized body.
  const app = configureHttp(await NestFactory.create(AppModule, { rawBody: true }));
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
        // Integration events arrive as CloudEvents, in structured content mode.
        deserializer: new CloudEventDeserializer(),
      },
    },
    { inheritAppConfig: true },
  );
  // Schedule triggers from Kubernetes CronJobs: each one goes to one instance, which handles one at a time.
  app.connectMicroservice<MicroserviceOptions>(
    {
      transport: Transport.RMQ,
      options: {
        urls: [config.get('RABBITMQ_URL', { infer: true })],
        queue: ScheduleTriggers.queue,
        queueOptions: { durable: true, arguments: ScheduleTriggers.queueArguments },
        noAck: false,
        prefetchCount: 1,
        deserializer: new CloudEventDeserializer(),
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
