import type { WorkoutPage, WorkoutRepresentation } from '../workout.representation.interface.js';

/** Read port: workouts read straight from SQL, bypassing the domain model. */
export abstract class WorkoutQueries {
  abstract byId(workoutId: string): Promise<WorkoutRepresentation | undefined>;

  /** A member's workouts, newest first, with keyset pagination on (started at, id). */
  abstract ofMember(memberId: string, limit: number, cursor: string | null): Promise<WorkoutPage>;
}
