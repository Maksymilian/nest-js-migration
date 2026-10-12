import { WORKOUT_TRACKING_SOURCE, type WorkoutSnapshotV1 } from '@app/workout-tracking-contracts';
import type { OutboxMessage } from '@nestjs/outbox';
import { CloudEvent, CONSTANTS } from 'cloudevents';

/**
 * Wraps an integration event from the outbox in the CloudEvent it travels as to other services.
 * The id is the outbox message's, so a republished event keeps it; `time` is when the message was
 * added, in the transaction that recorded the change. Throws if the event breaks the specification.
 */
export function toCloudEvent(message: OutboxMessage): CloudEvent<WorkoutSnapshotV1> {
  // Every route of the published language carries a workout snapshot (routes.ts).
  const snapshot = message.payload as WorkoutSnapshotV1;
  return new CloudEvent<WorkoutSnapshotV1>({
    id: message.id,
    source: WORKOUT_TRACKING_SOURCE,
    type: message.topic,
    subject: snapshot.workoutId,
    time: new Date(message.createdAt).toISOString(),
    datacontenttype: CONSTANTS.MIME_JSON,
    ...(message.key === null ? {} : { partitionkey: message.key }),
    data: snapshot,
  });
}
