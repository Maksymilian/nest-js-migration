import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { TrainingLog } from './training-log.js';
import { TrainingLogQuery } from './training-log.query.js';

/** The training log isn't cached: it's paginated, and its index serves it. */
@QueryHandler(TrainingLogQuery)
export class TrainingLogHandler implements IQueryHandler<TrainingLogQuery> {
  constructor(private readonly trainingLog: TrainingLog) {}

  execute({ memberId, first, after, discipline }: TrainingLogQuery) {
    return this.trainingLog.page(memberId.value, first, after, discipline?.value ?? null);
  }
}
