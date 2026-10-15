import type { TrainingGoalRepresentation } from '../training-goal.representation.interface.js';

/** Read port: a member's training goals, and a goal's progress, read straight from SQL. */
export abstract class TrainingGoalQueries {
  abstract ofMember(memberId: string, status: string | null, setSince: Date | null): Promise<TrainingGoalRepresentation[]>;
}
