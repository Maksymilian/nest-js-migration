import type { LoggedWorkoutRepresentation } from '../../training-log/application/logged-workout.representation.interface.js';

/** A personal record as the GraphQL API shows it, with the logged workout it came from. */
export interface PersonalRecordRepresentation {
  discipline: string;
  metric: string;
  value: number;
  setAt: Date;
  loggedWorkout: LoggedWorkoutRepresentation;
}
