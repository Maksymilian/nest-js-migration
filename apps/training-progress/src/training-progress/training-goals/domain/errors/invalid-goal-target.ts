import { DomainError } from '@app/ddd';

export class InvalidGoalTarget extends DomainError {
  readonly kind = 'invariant-violation';

  constructor(value: number) {
    super(`A goal target must be a whole number greater than zero (got ${value})`);
  }
}
