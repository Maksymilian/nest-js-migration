import { DomainError } from '@app/ddd';

export class InvalidWorkoutMetrics extends DomainError {
  readonly kind = 'invariant-violation';

  constructor(reason: string) {
    super(`Invalid workout metrics: ${reason}`);
  }
}
