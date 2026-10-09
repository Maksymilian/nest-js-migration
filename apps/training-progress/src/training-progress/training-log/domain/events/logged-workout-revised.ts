import { DomainEvent } from '@app/ddd';
import type { MemberId } from '../../../members/domain/values/member-id.js';
import type { Discipline } from '../values/discipline.js';
import type { LoggedWorkoutId } from '../values/logged-workout-id.js';
import type { WorkoutMetrics } from '../values/workout-metrics.js';

/** A logged workout's metrics were replaced (a correction upstream). It still counts. */
export class LoggedWorkoutRevised extends DomainEvent {
  constructor(
    readonly loggedWorkoutId: LoggedWorkoutId,
    readonly memberId: MemberId,
    readonly discipline: Discipline,
    readonly startedAt: Date,
    readonly previousMetrics: WorkoutMetrics,
    readonly metrics: WorkoutMetrics,
    occurredAt: Date,
  ) {
    super(occurredAt);
  }
}
