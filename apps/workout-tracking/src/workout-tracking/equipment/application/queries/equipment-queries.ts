import type { EquipmentRepresentation } from '../equipment.representation.interface.js';

/** Read port: equipment read straight from SQL, bypassing the domain model. */
export abstract class EquipmentQueries {
  abstract byId(equipmentId: string): Promise<EquipmentRepresentation | undefined>;
}
