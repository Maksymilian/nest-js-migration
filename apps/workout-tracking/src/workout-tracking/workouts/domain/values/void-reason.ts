import { ReasonRequired } from '../errors/reason-required.js';

/** Why a void was made: required, 1 to 500 characters. */
export class VoidReason {
  private constructor(readonly value: string) {}

  static from(value: string): VoidReason {
    const reason = value.trim();
    if (reason.length === 0 || reason.length > 500) {
      throw new ReasonRequired('void');
    }
    return new VoidReason(reason);
  }

  toString(): string {
    return this.value;
  }
}
