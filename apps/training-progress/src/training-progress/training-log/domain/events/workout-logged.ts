import { DomainEvent } from '@app/ddd';
import type { MemberId } from '../../../members/domain/values/member-id.js';
import type { Discipline } from '../values/discipline.js';
import type { LoggedWorkoutId } from '../values/logged-workout-id.js';
import type { WorkoutMetrics } from '../values/workout-metrics.js';

/** A workout was added to the member's training log. */
export class WorkoutLogged extends DomainEvent {
  constructor(
    readonly loggedWorkoutId: LoggedWorkoutId,
    readonly memberId: MemberId,
    readonly discipline: Discipline,
    readonly startedAt: Date,
    readonly metrics: WorkoutMetrics,
    occurredAt: Date,
  ) {
    super(occurredAt);
  }
}
