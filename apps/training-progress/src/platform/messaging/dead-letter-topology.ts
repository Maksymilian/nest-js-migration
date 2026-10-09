import { Injectable, Logger, type OnApplicationShutdown, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type AmqpConnectionManager, connect } from 'amqp-connection-manager';
import type { ConfirmChannel } from 'amqplib';
import { WorkoutTrackingSubscription } from '../../training-progress/workout-tracking-acl/subscription.js';
import type { Environment } from '../config/environment.js';

/**
 * Declares where the subscription's dead letters go: the `training-progress.dlx` exchange and the
 * DLQ bound to it, inspected and replayed by hand. Declared again on every reconnect, in the
 * background: a broker that is down doesn't stop the service from starting.
 */
@Injectable()
export class DeadLetterTopology implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(DeadLetterTopology.name);
  private connection?: AmqpConnectionManager;

  constructor(private readonly config: ConfigService<Environment, true>) {}

  onModuleInit(): void {
    const { deadLetterExchange, deadLetterQueue } = WorkoutTrackingSubscription;
    this.connection = connect([this.config.get('RABBITMQ_URL', { infer: true })]);
    this.connection.on('connectFailed', ({ err }) => this.logger.warn(`RabbitMQ unreachable: ${err.message}`));
    this.connection.createChannel({
      setup: async (channel: ConfirmChannel) => {
        await channel.assertExchange(deadLetterExchange, 'fanout', { durable: true });
        await channel.assertQueue(deadLetterQueue, { durable: true, arguments: { 'x-queue-type': 'quorum' } });
        await channel.bindQueue(deadLetterQueue, deadLetterExchange, '');
      },
    });
  }

  async onApplicationShutdown(): Promise<void> {
    await this.connection?.close();
  }
}
