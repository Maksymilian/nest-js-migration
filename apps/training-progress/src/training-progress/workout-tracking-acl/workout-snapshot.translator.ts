import { WORKOUT_TRACKING_SOURCE, WorkoutSnapshotV1 } from '@app/workout-tracking-contracts';
import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CloudEvent, type CloudEventV1, V1, ValidationError } from 'cloudevents';
import { MemberId } from '../members/domain/values/member-id.js';
import type { LoggedWorkoutFacts } from '../training-log/application/commands/log-workout.command.js';
import { Discipline } from '../training-log/domain/values/discipline.js';
import { LoggedWorkoutId } from '../training-log/domain/values/logged-workout-id.js';
import { SourceRevision } from '../training-log/domain/values/source-revision.js';
import { WorkoutMetrics } from '../training-log/domain/values/workout-metrics.js';
import { InvalidIntegrationEvent } from './invalid-integration-event.js';

/**
 * The anticorruption layer's translation: validates Workout Tracking's CloudEvent and the snapshot
 * it carries against the contract, then translates the snapshot into this context's language and
 * types. Contract classes never go further than this.
 */
@Injectable()
export class WorkoutSnapshotTranslator {
  async translate(event: CloudEventV1<unknown>): Promise<LoggedWorkoutFacts> {
    const type = typeof event?.type === 'string' && event.type.length > 0 ? event.type : 'message';
    const snapshot = plainToInstance(WorkoutSnapshotV1, cloudEventData(event, type) ?? {});
    const errors = await validate(snapshot, { whitelist: true });
    if (errors.length > 0) {
      throw new InvalidIntegrationEvent(type, errors.flatMap((error) => Object.values(error.constraints ?? {})).join('; '));
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
      throw new InvalidIntegrationEvent(type, (error as Error).message);
    }
  }
}

/**
 * Checks the event against the CloudEvents specification and Workout Tracking's source, and returns
 * its data. The SDK makes up an id and a specversion when they're missing, so those come first:
 * the inbox deduplicates on the producer's id.
 */
function cloudEventData(event: CloudEventV1<unknown>, type: string): unknown {
  if (event?.specversion !== V1) {
    throw new InvalidIntegrationEvent(type, `not a CloudEvent ${V1}: specversion is ${String(event?.specversion)}`);
  }
  if (typeof event.id !== 'string' || event.id.length === 0) {
    throw new InvalidIntegrationEvent(type, 'the CloudEvent has no id');
  }
  let valid: CloudEvent<unknown>;
  try {
    valid = new CloudEvent<unknown>(event);
  } catch (error) {
    throw new InvalidIntegrationEvent(type, describe(error));
  }
  if (valid.source !== WORKOUT_TRACKING_SOURCE) {
    throw new InvalidIntegrationEvent(type, `the source is ${valid.source}, not ${WORKOUT_TRACKING_SOURCE}`);
  }
  return valid.data;
}

/** "source must match format "uri-reference"", from the SDK's JSON Schema errors. */
function describe(error: unknown): string {
  if (!(error instanceof ValidationError)) {
    return (error as Error).message;
  }
  const reasons = (error.errors ?? []).flatMap((reason) =>
    typeof reason === 'string' ? [reason] : [`${reason.instancePath.slice(1) || 'the CloudEvent'} ${reason.message ?? 'is invalid'}`],
  );
  return reasons.length > 0 ? reasons.join('; ') : error.message.split('\n')[0];
}
