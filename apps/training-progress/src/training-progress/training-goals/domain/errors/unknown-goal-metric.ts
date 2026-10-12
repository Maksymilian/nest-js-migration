import { DomainError } from '@app/ddd';

export class UnknownGoalMetric extends DomainError {
  readonly kind = 'invariant-violation';

  constructor(value: string) {
    super(`"${value}" is not a goal metric: DISTANCE, DURATION, CALORIES or WORKOUT_COUNT`);
  }
}
