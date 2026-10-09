import { Command } from '@nestjs/cqrs';
import type { EquipmentType } from '../../domain/values/equipment-type.js';
import type { SerialNumber } from '../../domain/values/serial-number.js';
import type { EquipmentRepresentation } from '../equipment.representation.interface.js';

export class RegisterEquipmentCommand extends Command<EquipmentRepresentation> {
  constructor(
    readonly serialNumber: SerialNumber,
    readonly type: EquipmentType,
  ) {
    super();
  }
}
