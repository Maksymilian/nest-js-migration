import { DomainError } from '@app/ddd';

export class GoalNotActive extends DomainError {
  readonly kind = 'conflict';

  constructor(trainingGoalId: string, status: string) {
    super(`Training goal ${trainingGoalId} is ${status.toLowerCase()}, not active`);
  }
}
