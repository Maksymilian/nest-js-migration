import { DomainError } from '@app/ddd';

export class UnknownEquipmentType extends DomainError {
  readonly kind = 'invariant-violation';

  constructor(value: string) {
    super(`"${value}" is not an equipment type: BIKE, TREADMILL or ROWER`);
  }
}
