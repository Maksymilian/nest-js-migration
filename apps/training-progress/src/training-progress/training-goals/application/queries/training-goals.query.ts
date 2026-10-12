import { Query } from '@nestjs/cqrs';
import type { MemberId } from '../../../members/domain/values/member-id.js';
import type { GoalStatus } from '../../domain/values/goal-status.js';
import type { TrainingGoalRepresentation } from '../training-goal.representation.interface.js';

export class TrainingGoalsQuery extends Query<TrainingGoalRepresentation[]> {
  constructor(
    readonly memberId: MemberId,
    readonly status: GoalStatus | null,
  ) {
    super();
  }
}
