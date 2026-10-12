import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { TrainingGoalQueries } from './training-goal-queries.js';
import { TrainingGoalsQuery } from './training-goals.query.js';

/** Not cached: a member has few goals, and changes them themselves. */
@QueryHandler(TrainingGoalsQuery)
export class TrainingGoalsHandler implements IQueryHandler<TrainingGoalsQuery> {
  constructor(private readonly queries: TrainingGoalQueries) {}

  execute({ memberId, status }: TrainingGoalsQuery) {
    return this.queries.ofMember(memberId.value, status?.value ?? null);
  }
}
