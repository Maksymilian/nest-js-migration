import type { TrainingLogPage } from '../logged-workout.representation.interface.js';

/** Read port: a member's counting workouts, newest first, read straight from SQL. */
export abstract class TrainingLog {
  abstract page(memberId: string, first: number, after: string | null, discipline: string | null): Promise<TrainingLogPage>;
}
