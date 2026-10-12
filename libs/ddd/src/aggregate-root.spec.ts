import { AggregateRoot } from './aggregate-root.js';
import { DomainEvent } from './domain-event.js';

class CounterIncremented extends DomainEvent {
  constructor(readonly by: number) {
    super(new Date('2026-10-08T10:00:00Z'));
  }
}

class Counter extends AggregateRoot<CounterIncremented> {
  constructor() {
    super(0);
  }

  increment(by: number) {
    this.record(new CounterIncremented(by));
  }
}

describe('AggregateRoot', () => {
  it('hands over the recorded events once, oldest first', () => {
    const counter = new Counter();
    counter.increment(1);
    counter.increment(2);

    expect(counter.pullDomainEvents().map((event) => event.by)).toEqual([1, 2]);
    expect(counter.pullDomainEvents()).toEqual([]);
  });
});
