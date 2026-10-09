import { DomainEvent } from '@app/ddd';
import type { MemberId } from '../../../members/domain/values/member-id.js';
import type { Discipline } from '../../../training-log/domain/values/discipline.js';
import type { PersonalRecord } from '../values/personal-record.js';

/** A logged workout beat the member's personal record, or set the first one. */
export class PersonalRecordSet extends DomainEvent {
  constructor(
    readonly memberId: MemberId,
    readonly discipline: Discipline,
    readonly record: PersonalRecord,
    /** The record it beat, if there was one. */
    readonly previous: PersonalRecord | null,
    occurredAt: Date,
  ) {
    super(occurredAt);
  }
}
