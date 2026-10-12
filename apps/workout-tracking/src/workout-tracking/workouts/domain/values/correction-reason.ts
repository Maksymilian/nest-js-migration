import { ReasonRequired } from '../errors/reason-required.js';

/** Why a correction was made: required, 1 to 500 characters. */
export class CorrectionReason {
  private constructor(readonly value: string) {}

  static from(value: string): CorrectionReason {
    const reason = value.trim();
    if (reason.length === 0 || reason.length > 500) {
      throw new ReasonRequired('correction');
    }
    return new CorrectionReason(reason);
  }

  toString(): string {
    return this.value;
  }
}
