import { DomainError } from '@app/ddd';

export class TrainingGoalNotFound extends DomainError {
  readonly kind = 'not-found';

  constructor(trainingGoalId: string) {
    super(`Training goal ${trainingGoalId} not found`);
  }
}
