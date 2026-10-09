import { WORKOUT_TRACKING_EXCHANGE, WORKOUT_TRACKING_ROUTING_PATTERN } from '@app/workout-tracking-contracts';

/**
 * Training Progress' subscription to Workout Tracking's published language (architecture 7.2):
 * a quorum queue bound to the upstream's exchange, with a single active consumer to keep the
 * order across instances, and dead-lettering after 5 deliveries. The same arguments are declared
 * in infrastructure/rabbitmq/definitions.json; RabbitMQ refuses a queue redeclared differently.
 */
export const WorkoutTrackingSubscription = {
  exchange: WORKOUT_TRACKING_EXCHANGE,
  routingKey: WORKOUT_TRACKING_ROUTING_PATTERN,
  queue: 'training-progress.workout-tracking',
  deadLetterExchange: 'training-progress.dlx',
  deadLetterQueue: 'training-progress.workout-tracking.dlq',
  queueArguments: {
    'x-queue-type': 'quorum',
    'x-single-active-consumer': true,
    'x-delivery-limit': 5,
    'x-dead-letter-exchange': 'training-progress.dlx',
  },
} as const;
