import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Transactions } from '../../../platform/database/transactions.js';
import { DomainEventPublisher } from '../../../platform/outbox/domain-event-publisher.js';
import { TrainingGoalRepository } from '../domain/training-goal.repository.js';

/** Miss Ended Goals: every day, miss the active goals whose grace period has ended, each in its own transaction. */
@Injectable()
export class MissEndedGoalsJob {
  private readonly logger = new Logger(MissEndedGoalsJob.name);

  constructor(
    private readonly goals: TrainingGoalRepository,
    private readonly transactions: Transactions,
    private readonly events: DomainEventPublisher,
  ) {}

  @Cron('5 0 * * *', { name: 'miss-ended-goals', timeZone: 'UTC' })
  async run(now = new Date()): Promise<number> {
    let missed = 0;
    for (const goal of await this.goals.activeGoalsPastGracePeriod(now)) {
      goal.miss(now);
      if (!goal.hasChanges()) {
        continue;
      }
      try {
        await this.transactions.run(async (tx) => {
          await this.goals.save(tx, goal);
          await this.events.publish(tx, goal.pullDomainEvents());
        });
        missed++;
      } catch (error) {
        // One goal's conflict doesn't stop the others; tomorrow's run picks it up again.
        this.logger.warn(`Could not miss training goal ${goal.id.value}: ${(error as Error).message}`);
      }
    }
    return missed;
  }
}
