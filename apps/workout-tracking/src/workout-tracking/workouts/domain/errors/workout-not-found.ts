import { DomainError } from '@app/ddd';

export class WorkoutNotFound extends DomainError {
  readonly kind = 'not-found';

  constructor(workoutId: string) {
    super(`Workout ${workoutId} not found`);
  }
}
