import { InvalidGoalPeriod } from '../errors/invalid-goal-period.js';

const GRACE_PERIOD_MS = 24 * 60 * 60 * 1000;

/**
 * The time a goal runs, `[startsOn, endsOn)`. Followed by a one-day grace period, during which the
 * goal stays active so workouts from inside the goal period that are logged late still count.
 */
export class GoalPeriod {
  private constructor(
    readonly startsOn: Date,
    readonly endsOn: Date,
  ) {}

  /** A goal period for a new goal: it ends after it starts, and in the future. */
  static of(startsOn: Date, endsOn: Date, now: Date): GoalPeriod {
    if (endsOn <= startsOn) {
      throw new InvalidGoalPeriod('it must end after it starts');
    }
    if (endsOn <= now) {
      throw new InvalidGoalPeriod('it must end in the future');
    }
    return new GoalPeriod(startsOn, endsOn);
  }

  static reconstitute(startsOn: Date, endsOn: Date): GoalPeriod {
    return new GoalPeriod(startsOn, endsOn);
  }

  /** The end of the grace period: one day after the goal period ends. */
  get graceEnd(): Date {
    return new Date(this.endsOn.getTime() + GRACE_PERIOD_MS);
  }

  contains(date: Date): boolean {
    return date >= this.startsOn && date < this.endsOn;
  }
}
