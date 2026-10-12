import { DomainEvent } from '@app/ddd';
import type { MemberId } from '../../../members/domain/values/member-id.js';
import type { TrainingGoalId } from '../values/training-goal-id.js';

/** The goal's member gave up the active goal. */
export class GoalAbandoned extends DomainEvent {
  constructor(
    readonly trainingGoalId: TrainingGoalId,
    readonly memberId: MemberId,
    occurredAt: Date,
  ) {
    super(occurredAt);
  }
}
