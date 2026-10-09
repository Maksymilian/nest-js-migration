import { DomainError } from '@app/ddd';

export class ReasonRequired extends DomainError {
  readonly kind = 'invariant-violation';

  constructor(what: 'correction' | 'void') {
    super(`A ${what} needs a reason of 1 to 500 characters`);
  }
}
