import { DomainEvent } from '@app/ddd';
import type { MemberId } from '../../../members/domain/values/member-id.js';
import type { Discipline } from '../values/discipline.js';
import type { LoggedWorkoutId } from '../values/logged-workout-id.js';

/** A logged workout no longer counts towards anything (a void upstream). It's kept. */
export class LoggedWorkoutStoppedCounting extends DomainEvent {
  constructor(
    readonly loggedWorkoutId: LoggedWorkoutId,
    readonly memberId: MemberId,
    readonly discipline: Discipline,
    readonly startedAt: Date,
    occurredAt: Date,
  ) {
    super(occurredAt);
  }
}
