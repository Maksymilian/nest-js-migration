import { InvalidWorkoutMetrics } from '../errors/invalid-workout-metrics.js';

/** Distance covered, in whole meters. */
export class Distance {
  private constructor(readonly meters: number) {}

  static of(meters: number): Distance {
    if (!Number.isSafeInteger(meters) || meters < 0) {
      throw new InvalidWorkoutMetrics(`distance must be a whole number of meters, zero or more (got ${meters})`);
    }
    return new Distance(meters);
  }

  equals(other: Distance): boolean {
    return this.meters === other.meters;
  }
}
