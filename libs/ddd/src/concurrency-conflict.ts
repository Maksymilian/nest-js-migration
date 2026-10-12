import { DomainError } from './domain-error.js';

/** Someone else changed the aggregate since it was loaded (optimistic locking). Retry on the new state. */
export class ConcurrencyConflict extends DomainError {
  readonly kind = 'conflict';

  constructor(aggregate: string, id: string) {
    super(`${aggregate} ${id} was changed by someone else in the meantime; try again`);
  }
}
