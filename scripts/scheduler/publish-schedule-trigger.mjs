#!/usr/bin/env node
// Publishes one schedule trigger to RabbitMQ, waits for the broker to confirm it, and exits.
// A Kubernetes CronJob runs it at the trigger's time; run it by hand to start a policy now:
//   node scripts/scheduler/publish-schedule-trigger.mjs miss-ended-goals
//   docker run --rm --network host fitness-scheduler miss-ended-goals
// RABBITMQ_URL picks the broker (default: the local Docker Compose one). The trigger is a
// CloudEvent in structured content mode, which the service reads with its CloudEventDeserializer;
// the queue gives it to one of the service's instances. Publishing twice is harmless: the
// policies are idempotent.
import amqp from 'amqplib';
import { CloudEvent, CONSTANTS } from 'cloudevents';

/** The triggers by name: the schedule queue of the service that handles each, and its CloudEvent type. */
const TRIGGERS = {
  'miss-ended-goals': { queue: 'training-progress.schedule', type: 'training-progress.schedule.miss-ended-goals.v1' },
};
const SOURCE = '/scheduler';

const trigger = TRIGGERS[process.argv[2]];
if (!trigger || process.argv.length > 3) {
  console.error(`usage: publish-schedule-trigger.mjs <${Object.keys(TRIGGERS).join(' | ')}>`);
  process.exit(2);
}

const event = new CloudEvent({ source: SOURCE, type: trigger.type });
const connection = await amqp.connect(process.env.RABBITMQ_URL ?? 'amqp://fitness:fitness@localhost:5672');
try {
  const channel = await connection.createConfirmChannel();
  let unroutable = false;
  channel.on('return', () => {
    unroutable = true;
  });
  // mandatory: without the queue, RabbitMQ returns the trigger (before confirming it) instead of dropping it.
  channel.sendToQueue(trigger.queue, Buffer.from(JSON.stringify(event)), {
    contentType: CONSTANTS.DEFAULT_CE_CONTENT_TYPE,
    messageId: event.id,
    type: event.type,
    persistent: true,
    mandatory: true,
  });
  await channel.waitForConfirms();
  if (unroutable) {
    throw new Error(`The queue ${trigger.queue} doesn't exist: load infrastructure/rabbitmq/definitions.json, or start the service once`);
  }
  console.log(`Published ${event.type} ${event.id} to ${trigger.queue}`);
} finally {
  await connection.close();
}
