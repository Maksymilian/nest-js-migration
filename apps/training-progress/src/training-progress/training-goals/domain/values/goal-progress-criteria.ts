import type { Discipline } from '../../../training-log/domain/values/discipline.js';
import type { GoalMetric } from './goal-metric.js';
import type { GoalPeriod } from './goal-period.js';

/**
 * Which logged workouts count towards a goal: counting ones, started inside the goal period, of
 * the goal's discipline if it has one. The grace period doesn't widen them. The goal defines them;
 * the application layer sums the training log for them.
 */
export class GoalProgressCriteria {
  constructor(
    readonly metric: GoalMetric,
    readonly period: GoalPeriod,
    readonly discipline: Discipline | null,
  ) {}

  /** Whether a counting (logged or revised) workout meets the criteria. */
  isMetBy(discipline: Discipline, startedAt: Date): boolean {
    return this.period.contains(startedAt) && (this.discipline === null || this.discipline.equals(discipline));
  }
}
