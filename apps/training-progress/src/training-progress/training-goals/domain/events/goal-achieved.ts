import { DomainEvent } from '@app/ddd';
import type { MemberId } from '../../../members/domain/values/member-id.js';
import type { Discipline } from '../../../training-log/domain/values/discipline.js';
import type { GoalMetric } from '../values/goal-metric.js';
import type { GoalPeriod } from '../values/goal-period.js';
import type { GoalTarget } from '../values/goal-target.js';
import type { TrainingGoalId } from '../values/training-goal-id.js';

/** Goal progress reached the goal target while the goal was active. Final. */
export class GoalAchieved extends DomainEvent {
  constructor(
    readonly trainingGoalId: TrainingGoalId,
    readonly memberId: MemberId,
    readonly metric: GoalMetric,
    readonly target: GoalTarget,
    readonly discipline: Discipline | null,
    readonly period: GoalPeriod,
    occurredAt: Date,
  ) {
    super(occurredAt);
  }
}
