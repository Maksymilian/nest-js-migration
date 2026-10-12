import type { WorkoutSnapshotV1 } from '@app/workout-tracking-contracts';
import type { WorkoutFacts } from '../workouts/domain/events/workout-facts.interface.js';

/** Translates a workout event's facts into the published language: the full workout snapshot. */
export function toWorkoutSnapshotV1(workout: WorkoutFacts): WorkoutSnapshotV1 {
  return {
    workoutId: workout.workoutId.value,
    memberId: workout.memberId.value,
    equipmentType: workout.equipmentType.value,
    discipline: workout.discipline.value,
    startedAt: workout.startedAt.toISOString(),
    durationSeconds: workout.metrics.duration.seconds,
    distanceMeters: workout.metrics.distance.meters,
    calories: workout.metrics.calories.kilocalories,
    status: workout.status.value,
    revision: workout.revision,
  };
}
