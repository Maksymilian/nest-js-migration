import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { MemberId } from '../../../members/domain/values/member-id.js';
import { Discipline } from '../../../training-log/domain/values/discipline.js';
import { GoalMetric } from '../../domain/values/goal-metric.js';
import { GoalPeriod } from '../../domain/values/goal-period.js';
import { GoalProgressCriteria } from '../../domain/values/goal-progress-criteria.js';
import { TrainingLogTotals } from '../training-log-totals.js';
import { TrainingGoalProgressQuery } from './training-goal-progress.query.js';

/** Builds the goal's progress criteria from its representation (no aggregate is loaded), and sums the training log for them. */
@QueryHandler(TrainingGoalProgressQuery)
export class TrainingGoalProgressHandler implements IQueryHandler<TrainingGoalProgressQuery> {
  constructor(private readonly totals: TrainingLogTotals) {}

  async execute({ goal }: TrainingGoalProgressQuery) {
    const criteria = new GoalProgressCriteria(
      GoalMetric.from(goal.metric),
      GoalPeriod.reconstitute(new Date(goal.startsOn), new Date(goal.endsOn)),
      goal.discipline ? Discipline.from(goal.discipline) : null,
    );
    return (await this.totals.progress(MemberId.from(goal.memberId), criteria)).value;
  }
}
