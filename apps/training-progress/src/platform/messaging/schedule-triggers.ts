/**
 * Training Progress' schedule queue (architecture 7.2). Schedule triggers are CloudEvents that
 * Kubernetes CronJobs publish with scripts/scheduler, each starting a policy; every instance
 * consumes the queue, and RabbitMQ gives each trigger to one of them. A trigger that fails 5 times
 * is dead-lettered through the default exchange to its own DLQ, apart from Workout Tracking's dead
 * letters. The same arguments are declared in infrastructure/rabbitmq/definitions.json; RabbitMQ
 * refuses a queue redeclared differently.
 */
export const ScheduleTriggers = {
  queue: 'training-progress.schedule',
  deadLetterQueue: 'training-progress.schedule.dlq',
  queueArguments: {
    'x-queue-type': 'quorum',
    'x-delivery-limit': 5,
    'x-dead-letter-exchange': '',
    'x-dead-letter-routing-key': 'training-progress.schedule.dlq',
  },
  /** The CloudEvent types, `<context>.schedule.<policy>.v<n>`. scripts/scheduler publishes them by name. */
  types: {
    missEndedGoalsV1: 'training-progress.schedule.miss-ended-goals.v1',
  },
} as const;
