import { generateId, isUuid } from '@app/ddd';

export class EquipmentId {
  private constructor(readonly value: string) {}

  static generate(): EquipmentId {
    return new EquipmentId(generateId());
  }

  static from(value: string): EquipmentId {
    if (!isUuid(value)) {
      throw new TypeError(`"${value}" is not an equipment id`);
    }
    return new EquipmentId(value);
  }

  equals(other: EquipmentId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
