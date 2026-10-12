import { DomainEvent } from '@app/ddd';
import type { MemberId } from '../../../members/domain/values/member-id.js';
import type { Discipline } from '../../../training-log/domain/values/discipline.js';
import type { PersonalRecord } from '../values/personal-record.js';
import type { RecordMetric } from '../values/record-metric.js';

/** The logged workout holding a personal record no longer supports it: it falls back to the next best, or disappears. */
export class PersonalRecordWithdrawn extends DomainEvent {
  constructor(
    readonly memberId: MemberId,
    readonly discipline: Discipline,
    readonly metric: RecordMetric,
    readonly withdrawn: PersonalRecord,
    /** The record now, from the next best counting workout; null when none is left. */
    readonly fallback: PersonalRecord | null,
    occurredAt: Date,
  ) {
    super(occurredAt);
  }
}
