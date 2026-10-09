import type { LoggedWorkoutId } from '../../../training-log/domain/values/logged-workout-id.js';
import { PersonalRecord } from './personal-record.js';
import type { RecordMetric } from './record-metric.js';

/** For one record metric, the counting logged workout with the best value in the member's training log. */
export class RecordCandidate {
  constructor(
    readonly metric: RecordMetric,
    readonly value: number,
    readonly loggedWorkoutId: LoggedWorkoutId,
    readonly startedAt: Date,
  ) {}

  toPersonalRecord(): PersonalRecord {
    return new PersonalRecord(this.metric, this.value, this.loggedWorkoutId, this.startedAt);
  }
}
