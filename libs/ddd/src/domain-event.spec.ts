import { DomainEvent } from './domain-event.js';
import { isUuid } from './generate-id.js';

class SomethingHappened extends DomainEvent {
  constructor() {
    super(new Date('2026-10-08T10:00:00Z'));
  }
}

describe('DomainEvent', () => {
  it('gets a unique UUID as its event id', () => {
    const first = new SomethingHappened();
    const second = new SomethingHappened();

    expect(isUuid(first.eventId)).toBe(true);
    expect(first.eventId).not.toBe(second.eventId);
    expect(first.occurredAt).toEqual(new Date('2026-10-08T10:00:00Z'));
  });
});
