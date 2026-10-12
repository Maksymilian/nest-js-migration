import type { LoggedWorkoutId } from '../../../training-log/domain/values/logged-workout-id.js';
import type { RecordMetric } from './record-metric.js';

/**
 * A member's best value of a record metric in a single counting workout of one discipline, with
 * the logged workout it came from and when that workout started. Replaced as a whole.
 */
export class PersonalRecord {
  constructor(
    readonly metric: RecordMetric,
    readonly value: number,
    readonly loggedWorkoutId: LoggedWorkoutId,
    readonly setAt: Date,
  ) {}

  isBeatenBy(value: number): boolean {
    return value > this.value;
  }

  equals(other: PersonalRecord): boolean {
    return (
      this.metric.equals(other.metric) &&
      this.value === other.value &&
      this.loggedWorkoutId.equals(other.loggedWorkoutId) &&
      this.setAt.getTime() === other.setAt.getTime()
    );
  }
}
