import { WorkoutSnapshotV1 } from '@app/workout-tracking-contracts';
import { Injectable } from '@nestjs/common';
import type { OutboxEnvelope } from '@nestjs/outbox';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { MemberId } from '../members/domain/values/member-id.js';
import type { LoggedWorkoutFacts } from '../training-log/application/commands/log-workout.command.js';
import { Discipline } from '../training-log/domain/values/discipline.js';
import { LoggedWorkoutId } from '../training-log/domain/values/logged-workout-id.js';
import { SourceRevision } from '../training-log/domain/values/source-revision.js';
import { WorkoutMetrics } from '../training-log/domain/values/workout-metrics.js';
import { InvalidIntegrationEvent } from './invalid-integration-event.js';

/**
 * The anticorruption layer's translation: validates Workout Tracking's snapshot against its
 * contract, then translates it into this context's language and types. Contract classes never go
 * further than this.
 */
@Injectable()
export class WorkoutSnapshotTranslator {
  async translate(envelope: OutboxEnvelope<unknown>): Promise<LoggedWorkoutFacts> {
    const topic = envelope?.topic ?? 'message';
    if (typeof envelope?.id !== 'string' || envelope.id.length === 0) {
      throw new InvalidIntegrationEvent(topic, 'the envelope has no id');
    }
    const snapshot = plainToInstance(WorkoutSnapshotV1, envelope.payload ?? {});
    const errors = await validate(snapshot, { whitelist: true });
    if (errors.length > 0) {
      throw new InvalidIntegrationEvent(topic, errors.flatMap((error) => Object.values(error.constraints ?? {})).join('; '));
    }
    try {
      return {
        loggedWorkoutId: LoggedWorkoutId.from(snapshot.workoutId),
        memberId: MemberId.from(snapshot.memberId),
        discipline: Discipline.from(snapshot.discipline),
        startedAt: new Date(snapshot.startedAt),
        metrics: WorkoutMetrics.of(snapshot),
        sourceRevision: SourceRevision.of(snapshot.revision),
      };
    } catch (error) {
      throw new InvalidIntegrationEvent(topic, (error as Error).message);
    }
  }
}
