import { DomainError } from '@app/ddd';

export class UnknownPeriodKind extends DomainError {
  readonly kind = 'invariant-violation';

  constructor(value: string) {
    super(`"${value}" is not a period kind: WEEK, MONTH or YEAR`);
  }
}
