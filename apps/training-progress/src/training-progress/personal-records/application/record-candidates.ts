import type { Transaction } from '@app/ddd';
import type { MemberId } from '../../members/domain/values/member-id.js';
import type { Discipline } from '../../training-log/domain/values/discipline.js';
import type { LoggedWorkoutId } from '../../training-log/domain/values/logged-workout-id.js';
import type { RecordCandidate } from '../domain/values/record-candidate.js';

/** Read port: for each record metric, the counting logged workout with the best value in the training log. */
export abstract class RecordCandidates {
  /**
   * Read through the transaction that changes the records. Ties go to the current holders, then
   * to the earliest workout, so an unchanged record keeps its logged workout.
   */
  abstract best(tx: Transaction, memberId: MemberId, discipline: Discipline, currentHolders: readonly LoggedWorkoutId[]): Promise<RecordCandidate[]>;
}
