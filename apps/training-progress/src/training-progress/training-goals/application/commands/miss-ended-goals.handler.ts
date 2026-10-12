import { Logger } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { Transactions } from '../../../../platform/database/transactions.js';
import { DomainEventPublisher } from '../../../../platform/outbox/domain-event-publisher.js';
import { TrainingGoalRepository } from '../../domain/training-goal.repository.js';
import { MissEndedGoalsCommand } from './miss-ended-goals.command.js';

/**
 * Miss Ended Goals, started by its schedule trigger: misses the active goals whose grace period has
 * ended, each in its own transaction. A second trigger changes nothing: a goal that is no longer
 * active stays as it is.
 */
@CommandHandler(MissEndedGoalsCommand)
export class MissEndedGoalsHandler implements ICommandHandler<MissEndedGoalsCommand> {
  private readonly logger = new Logger(MissEndedGoalsHandler.name);

  constructor(
    private readonly goals: TrainingGoalRepository,
    private readonly transactions: Transactions,
    private readonly events: DomainEventPublisher,
  ) {}

  async execute({ now }: MissEndedGoalsCommand): Promise<number> {
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
        // One goal's conflict doesn't stop the others; the next trigger picks it up again.
        this.logger.warn(`Could not miss training goal ${goal.id.value}: ${(error as Error).message}`);
      }
    }
    return missed;
  }
}
