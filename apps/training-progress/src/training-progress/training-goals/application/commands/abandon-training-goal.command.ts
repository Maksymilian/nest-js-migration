import { Command } from '@nestjs/cqrs';
import type { MemberId } from '../../../members/domain/values/member-id.js';
import type { TrainingGoalId } from '../../domain/values/training-goal-id.js';
import type { TrainingGoalRepresentation } from '../training-goal.representation.interface.js';

export class AbandonTrainingGoalCommand extends Command<TrainingGoalRepresentation> {
  constructor(
    readonly memberId: MemberId,
    readonly trainingGoalId: TrainingGoalId,
  ) {
    super();
  }
}
