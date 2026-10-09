import type { GoalTarget } from './goal-target.js';

/** The sum of the goal metric over the logged workouts that meet a goal's criteria. Never stored. */
export class GoalProgress {
  private constructor(readonly value: number) {}

  static of(value: number): GoalProgress {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new TypeError(`${value} is not goal progress`);
    }
    return new GoalProgress(value);
  }

  reaches(target: GoalTarget): boolean {
    return this.value >= target.value;
  }
}
