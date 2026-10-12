import { InvalidSerialNumber } from '../errors/invalid-serial-number.js';

const SERIAL_NUMBER = /^[A-Z0-9][A-Z0-9-]{0,63}$/;

/** Identifies equipment across the platform. Upper case, so `bk-001` and `BK-001` are one serial number. */
export class SerialNumber {
  private constructor(readonly value: string) {}

  static from(value: string): SerialNumber {
    const normalized = value.trim().toUpperCase();
    if (!SERIAL_NUMBER.test(normalized)) {
      throw new InvalidSerialNumber(value);
    }
    return new SerialNumber(normalized);
  }

  equals(other: SerialNumber): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
