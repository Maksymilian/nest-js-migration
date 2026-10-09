import type { MemberId } from '../../members/domain/values/member-id.js';
import type { GoalProgress } from '../domain/values/goal-progress.js';
import type { GoalProgressCriteria } from '../domain/values/goal-progress-criteria.js';

/** Read port: sums the member's training log for a goal's progress criteria, with SQL. */
export abstract class TrainingLogTotals {
  abstract progress(memberId: MemberId, criteria: GoalProgressCriteria): Promise<GoalProgress>;
}
