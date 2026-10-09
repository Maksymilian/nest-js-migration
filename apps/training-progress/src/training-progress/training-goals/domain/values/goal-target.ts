import { InvalidGoalTarget } from '../errors/invalid-goal-target.js';

/** The amount of the goal metric to reach. Always a whole number greater than zero. */
export class GoalTarget {
  private constructor(readonly value: number) {}

  static of(value: number): GoalTarget {
    if (!Number.isSafeInteger(value) || value <= 0) {
      throw new InvalidGoalTarget(value);
    }
    return new GoalTarget(value);
  }
}
