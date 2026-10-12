import { ClientRMQ } from '@nestjs/microservices';
import type { OutboxMessage } from '@nestjs/outbox';
import { CloudEvent } from 'cloudevents';
import { lastValueFrom } from 'rxjs';
import { toCloudEvent } from '../../workout-tracking/published-language/cloud-event.mapper.js';
import { CloudEventSerializer } from './cloud-event.serializer.js';

const recorded: OutboxMessage = {
  id: '01a0f335-aae8-7027-b795-ca9dab21e44d',
  topic: 'workout-tracking.integration.workout-recorded.v1',
  key: 'ada@example.com',
  headers: {},
  createdAt: Date.parse('2026-10-08T09:30:12.000Z'),
  availableAt: Date.parse('2026-10-08T09:30:12.000Z'),
  attempts: 0,
  lastError: null,
  payload: {
    workoutId: '0199c3a2-0000-7000-8000-000000000101',
    memberId: 'ada@example.com',
    equipmentType: 'BIKE',
    discipline: 'CYCLING',
    startedAt: '2026-10-08T08:30:00.000Z',
    durationSeconds: 2700,
    distanceMeters: 18200,
    calories: 530,
    status: 'RECORDED',
    revision: 1,
  },
};

/** Emits through Nest's RabbitMQ client, configured as in PlatformModule, and returns what it published. */
async function publish(data: unknown) {
  const client = new ClientRMQ({
    urls: ['amqp://localhost:1'],
    exchange: 'workout-tracking.integration',
    exchangeType: 'topic',
    wildcards: true,
    persistent: true,
    serializer: new CloudEventSerializer(),
  });
  const channel = { publish: vi.fn((...args: unknown[]) => (args[4] as () => void)()) };
  vi.spyOn(client, 'connect').mockResolvedValue(undefined as never);
  Object.assign(client, { channel });
  await lastValueFrom(client.emit(recorded.topic, data), { defaultValue: undefined });
  const [exchange, routingKey, content, options] = channel.publish.mock.calls[0] as [string, string, Buffer, Record<string, unknown>];
  return { exchange, routingKey, body: JSON.parse(content.toString()) as Record<string, unknown>, options };
}

describe('CloudEventSerializer', () => {
  it('publishes the integration event as a structured-mode CloudEvent, routed by its type', async () => {
    const { exchange, routingKey, body, options } = await publish(toCloudEvent(recorded));

    expect(exchange).toBe('workout-tracking.integration');
    expect(routingKey).toBe('workout-tracking.integration.workout-recorded.v1');
    expect(options).toMatchObject({
      contentType: 'application/cloudevents+json; charset=utf-8',
      messageId: recorded.id,
      type: recorded.topic,
      persistent: true,
    });
    expect(body).toEqual({
      specversion: '1.0',
      id: recorded.id,
      source: '/workout-tracking',
      type: 'workout-tracking.integration.workout-recorded.v1',
      subject: '0199c3a2-0000-7000-8000-000000000101',
      time: '2026-10-08T09:30:12.000Z',
      datacontenttype: 'application/json',
      partitionkey: 'ada@example.com',
      data: recorded.payload,
    });
    expect(new CloudEvent(body).validate()).toBe(true);
  });

  it('refuses anything but a CloudEvent', async () => {
    await expect(publish({ id: recorded.id, payload: recorded.payload })).rejects.toThrow('Only CloudEvents go to RabbitMQ');
  });
});
