import { InvalidWorkoutMetrics } from '../errors/invalid-workout-metrics.js';

/** Active time, in whole seconds. */
export class Duration {
  private constructor(readonly seconds: number) {}

  static of(seconds: number): Duration {
    if (!Number.isSafeInteger(seconds) || seconds < 0) {
      throw new InvalidWorkoutMetrics(`duration must be a whole number of seconds, zero or more (got ${seconds})`);
    }
    return new Duration(seconds);
  }

  equals(other: Duration): boolean {
    return this.seconds === other.seconds;
  }
}
