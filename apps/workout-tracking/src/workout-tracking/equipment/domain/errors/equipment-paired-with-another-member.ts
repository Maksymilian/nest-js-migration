import { DomainError } from '@app/ddd';

export class EquipmentPairedWithAnotherMember extends DomainError {
  readonly kind = 'conflict';

  constructor(equipmentId: string) {
    super(`Equipment ${equipmentId} is paired with another member; unpair it first`);
  }
}
