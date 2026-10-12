import type { Transaction } from '@app/ddd';
import type { Equipment } from './equipment.js';
import type { EquipmentId } from './values/equipment-id.js';

/** Port: loads and saves whole `Equipment` aggregates. */
export abstract class EquipmentRepository {
  /** @throws EquipmentNotFound */
  abstract get(id: EquipmentId): Promise<Equipment>;

  /**
   * Inserts new equipment or saves a change to it, through the transaction.
   * @throws SerialNumberAlreadyRegistered when another equipment has the serial number
   * @throws ConcurrencyConflict when the equipment changed since it was loaded
   */
  abstract save(tx: Transaction, equipment: Equipment): Promise<void>;
}
