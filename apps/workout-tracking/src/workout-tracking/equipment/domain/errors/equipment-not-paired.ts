import { DomainError } from '@app/ddd';

export class EquipmentNotPaired extends DomainError {
  readonly kind = 'conflict';

  constructor(equipmentId: string) {
    super(`Equipment ${equipmentId} is not paired with a member`);
  }
}
