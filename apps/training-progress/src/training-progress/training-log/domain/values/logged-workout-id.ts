import { isUuid } from '@app/ddd';

/** Identifies a logged workout. The same value as the upstream workout's id, so the ACL finds it again. */
export class LoggedWorkoutId {
  private constructor(readonly value: string) {}

  static from(value: string): LoggedWorkoutId {
    if (!isUuid(value)) {
      throw new TypeError(`"${value}" is not a logged workout id`);
    }
    return new LoggedWorkoutId(value.toLowerCase());
  }

  equals(other: LoggedWorkoutId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
