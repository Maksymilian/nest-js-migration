import { v7 as uuidv7 } from 'uuid';

/**
 * A business fact that happened inside a context, raised by an aggregate and named in the past
 * tense. Internal to its context: what leaves it is an integration event, mapped from this one.
 */
export abstract class DomainEvent {
  /** Unique per event. The outbox message carries it, so every consumer deduplicates on it. */
  readonly eventId: string = uuidv7();

  protected constructor(readonly occurredAt: Date) {}
}
