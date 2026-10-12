import { DomainError } from '@app/ddd';

export class InvalidGoalPeriod extends DomainError {
  readonly kind = 'invariant-violation';

  constructor(reason: string) {
    super(`Invalid goal period: ${reason}`);
  }
}
