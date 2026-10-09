import { DomainError } from '@app/ddd';

export class EquipmentNotFound extends DomainError {
  readonly kind = 'not-found';

  constructor(equipmentId: string) {
    super(`Equipment ${equipmentId} is not registered`);
  }
}
