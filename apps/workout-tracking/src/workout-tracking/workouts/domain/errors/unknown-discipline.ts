import { DomainError } from '@app/ddd';

export class UnknownDiscipline extends DomainError {
  readonly kind = 'invariant-violation';

  constructor(value: string) {
    super(`"${value}" is not a discipline: CYCLING, RUNNING, WALKING or ROWING`);
  }
}
