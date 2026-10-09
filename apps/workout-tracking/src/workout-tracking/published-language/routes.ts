import { WorkoutTrackingTopics } from '@app/workout-tracking-contracts';
import { RouteTable } from '../../platform/outbox/route-table.js';
import { WorkoutCorrected } from '../workouts/domain/events/workout-corrected.js';
import { WorkoutRecorded } from '../workouts/domain/events/workout-recorded.js';
import { WorkoutVoided } from '../workouts/domain/events/workout-voided.js';
import { toWorkoutSnapshotV1 } from './workout-snapshot.mapper.js';

/**
 * Which domain events leave Workout Tracking, as which integration events (architecture 4.1, 5.4).
 * Keyed by member, so a correction or void never overtakes the recording it changes. Equipment
 * events have no subscriber yet, so they aren't written.
 */
export const workoutTrackingRoutes = new RouteTable()
  .route(WorkoutRecorded, {
    topic: WorkoutTrackingTopics.workoutRecordedV1,
    key: (event) => event.workout.memberId.value,
    payload: (event) => toWorkoutSnapshotV1(event.workout),
  })
  .route(WorkoutCorrected, {
    topic: WorkoutTrackingTopics.workoutCorrectedV1,
    key: (event) => event.workout.memberId.value,
    payload: (event) => toWorkoutSnapshotV1(event.workout),
  })
  .route(WorkoutVoided, {
    topic: WorkoutTrackingTopics.workoutVoidedV1,
    key: (event) => event.workout.memberId.value,
    payload: (event) => toWorkoutSnapshotV1(event.workout),
  });
