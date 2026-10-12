import { Command } from '@nestjs/cqrs';
import type { MemberId } from '../../../members/domain/values/member-id.js';
import type { Discipline } from '../../domain/values/discipline.js';
import type { LoggedWorkoutId } from '../../domain/values/logged-workout-id.js';
import type { SourceRevision } from '../../domain/values/source-revision.js';
import type { WorkoutMetrics } from '../../domain/values/workout-metrics.js';

/** What the upstream workout looked like, in this context's types: every ACL command carries it. */
export interface LoggedWorkoutFacts {
  loggedWorkoutId: LoggedWorkoutId;
  memberId: MemberId;
  discipline: Discipline;
  startedAt: Date;
  metrics: WorkoutMetrics;
  sourceRevision: SourceRevision;
}

/** Log a workout: what a recording upstream becomes here. `messageId` makes it exactly-once. */
export class LogWorkoutCommand extends Command<void> {
  constructor(
    readonly workout: LoggedWorkoutFacts,
    readonly messageId: string,
  ) {
    super();
  }
}
