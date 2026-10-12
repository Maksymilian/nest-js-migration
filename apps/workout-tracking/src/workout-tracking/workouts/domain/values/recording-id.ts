import { InvalidRecordingId } from '../errors/invalid-recording-id.js';

/** The id equipment gives a recording. Unique per equipment, so a resubmission is a duplicate recording. */
export class RecordingId {
  private constructor(readonly value: string) {}

  static from(value: string): RecordingId {
    if (value.length === 0 || value.length > 128 || value.trim() !== value) {
      throw new InvalidRecordingId(value);
    }
    return new RecordingId(value);
  }

  equals(other: RecordingId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
