import { DomainEvent } from '@app/ddd';
import type { MemberId } from '../../../members/domain/values/member-id.js';
import type { TrainingGoalId } from '../values/training-goal-id.js';

/** A member set a training goal. Workouts already logged in its period count towards it. */
export class TrainingGoalSet extends DomainEvent {
  constructor(
    readonly trainingGoalId: TrainingGoalId,
    readonly memberId: MemberId,
    occurredAt: Date,
  ) {
    super(occurredAt);
  }
}
