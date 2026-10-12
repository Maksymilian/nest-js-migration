import { DomainError } from '@app/ddd';

export class InvalidSourceRevision extends DomainError {
  readonly kind = 'invariant-violation';

  constructor(value: number) {
    super(`${value} is not a source revision: a whole number from 1`);
  }
}
