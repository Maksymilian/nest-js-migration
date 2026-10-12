import { Command } from '@nestjs/cqrs';
import type { EquipmentId } from '../../domain/values/equipment-id.js';

export class UnpairEquipmentCommand extends Command<void> {
  constructor(readonly equipmentId: EquipmentId) {
    super();
  }
}
