import { Query } from '@nestjs/cqrs';
import type { TrainingGoalRepresentation } from '../training-goal.representation.interface.js';

/** A goal's progress: always calculated from the training log for the goal's criteria, never stored. */
export class TrainingGoalProgressQuery extends Query<number> {
  constructor(readonly goal: Pick<TrainingGoalRepresentation, 'memberId' | 'metric' | 'discipline' | 'startsOn' | 'endsOn'>) {
    super();
  }
}
