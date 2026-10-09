import { DomainEvent } from '@app/ddd';
import type { MemberId } from '../../../members/domain/values/member-id.js';
import type { TrainingGoalId } from '../values/training-goal-id.js';

/** The grace period ended while the goal was still active. */
export class GoalMissed extends DomainEvent {
  constructor(
    readonly trainingGoalId: TrainingGoalId,
    readonly memberId: MemberId,
    occurredAt: Date,
  ) {
    super(occurredAt);
  }
}
