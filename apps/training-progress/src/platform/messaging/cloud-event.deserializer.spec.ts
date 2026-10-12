import { Logger } from '@nestjs/common';
import { CloudEventDeserializer, NOT_A_CLOUD_EVENT } from './cloud-event.deserializer.js';

const event = {
  specversion: '1.0',
  id: '01a0f335-aae8-7027-b795-ca9dab21e44d',
  source: '/workout-tracking',
  type: 'workout-tracking.integration.workout-recorded.v1',
  datacontenttype: 'application/json',
  data: { workoutId: '0199c3a2-0000-7000-8000-000000000101' },
};

describe('CloudEventDeserializer', () => {
  const deserializer = new CloudEventDeserializer();

  it('routes a structured-mode CloudEvent by its type, as an event (the packet has no id)', () => {
    expect(deserializer.deserialize(event, { contentType: 'application/cloudevents+json; charset=utf-8' })).toEqual({ pattern: event.type, data: event });
    expect(deserializer.deserialize(event, { contentType: 'Application/CloudEvents+JSON' })).toEqual({ pattern: event.type, data: event });
  });

  it('gives any other message a pattern no handler has, so it is dead-lettered, and says why', () => {
    const warn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    // Nest's own packet, as Workout Tracking published before CloudEvents
    const nestPacket = { pattern: event.type, data: { id: event.id, payload: event.data } };
    expect(deserializer.deserialize(nestPacket, {}).pattern).toBe(NOT_A_CLOUD_EVENT);
    // the binary content mode: the data in the body, the attributes in application properties
    expect(deserializer.deserialize(event.data, { contentType: 'application/json' }).pattern).toBe(NOT_A_CLOUD_EVENT);
    // a structured-mode message whose body isn't an event with a type
    expect(deserializer.deserialize({ ...event, type: '' }, { contentType: 'application/cloudevents+json' }).pattern).toBe(NOT_A_CLOUD_EVENT);
    expect(deserializer.deserialize('not json', { contentType: 'application/cloudevents+json' }).pattern).toBe(NOT_A_CLOUD_EVENT);
    expect(deserializer.deserialize([event], { contentType: 'application/cloudevents-batch+json' }).pattern).toBe(NOT_A_CLOUD_EVENT);
    expect(warn).toHaveBeenCalledTimes(5);
    expect(warn).toHaveBeenCalledWith("Dead-lettering a message that isn't a structured-mode CloudEvent (content type: application/json)");
    warn.mockRestore();
  });
});
