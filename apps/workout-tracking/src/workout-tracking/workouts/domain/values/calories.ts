import { InvalidWorkoutMetrics } from '../errors/invalid-workout-metrics.js';

/** Kilocalories burned, in whole kilocalories. */
export class Calories {
  private constructor(readonly kilocalories: number) {}

  static of(kilocalories: number): Calories {
    if (!Number.isSafeInteger(kilocalories) || kilocalories < 0) {
      throw new InvalidWorkoutMetrics(`calories must be a whole number of kilocalories, zero or more (got ${kilocalories})`);
    }
    return new Calories(kilocalories);
  }

  equals(other: Calories): boolean {
    return this.kilocalories === other.kilocalories;
  }
}
