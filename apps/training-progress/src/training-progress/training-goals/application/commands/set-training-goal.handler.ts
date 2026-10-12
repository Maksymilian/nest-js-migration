import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { Transactions } from '../../../../platform/database/transactions.js';
import { DomainEventPublisher } from '../../../../platform/outbox/domain-event-publisher.js';
import { TrainingGoal } from '../../domain/training-goal.js';
import { TrainingGoalRepository } from '../../domain/training-goal.repository.js';
import { GoalPeriod } from '../../domain/values/goal-period.js';
import { representTrainingGoal } from '../training-goal.representation.interface.js';
import { SetTrainingGoalCommand } from './set-training-goal.command.js';

@CommandHandler(SetTrainingGoalCommand)
export class SetTrainingGoalHandler implements ICommandHandler<SetTrainingGoalCommand> {
  constructor(
    private readonly goals: TrainingGoalRepository,
    private readonly transactions: Transactions,
    private readonly events: DomainEventPublisher,
  ) {}

  async execute({ memberId, metric, target, discipline, startsOn, endsOn }: SetTrainingGoalCommand) {
    const now = new Date();
    const goal = TrainingGoal.set({ memberId, metric, target, discipline, period: GoalPeriod.of(startsOn, endsOn, now), now });
    await this.transactions.run(async (tx) => {
      await this.goals.save(tx, goal);
      await this.events.publish(tx, goal.pullDomainEvents());
    });
    return representTrainingGoal(goal);
  }
}
