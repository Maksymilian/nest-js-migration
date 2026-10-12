import { DomainError } from '@app/ddd';

export class DisciplineNotSupported extends DomainError {
  readonly kind = 'invariant-violation';

  constructor(equipmentType: string, discipline: string) {
    super(`${equipmentType} equipment can't record ${discipline}`);
  }
}
