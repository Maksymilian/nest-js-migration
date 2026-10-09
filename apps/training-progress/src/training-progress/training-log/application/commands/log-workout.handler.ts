import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { Transactions } from '../../../../platform/database/transactions.js';
import { DomainEventPublisher } from '../../../../platform/outbox/domain-event-publisher.js';
import { LoggedWorkout } from '../../domain/logged-workout.js';
import { LoggedWorkoutRepository } from '../../domain/logged-workout.repository.js';
import { ACL_CONSUMER } from './acl-consumer.js';
import { LogWorkoutCommand } from './log-workout.command.js';

/**
 * Logs the workout once. A workout already logged (a later correction or void arrived first and
 * logged it) is left alone: the source revision it has is at least as new.
 */
@CommandHandler(LogWorkoutCommand)
export class LogWorkoutHandler implements ICommandHandler<LogWorkoutCommand> {
  constructor(
    private readonly loggedWorkouts: LoggedWorkoutRepository,
    private readonly transactions: Transactions,
    private readonly events: DomainEventPublisher,
  ) {}

  async execute({ workout, messageId }: LogWorkoutCommand) {
    await this.transactions.runOnce(ACL_CONSUMER, messageId, async (tx) => {
      if (await this.loggedWorkouts.find(tx, workout.loggedWorkoutId)) {
        return;
      }
      const loggedWorkout = LoggedWorkout.log({ id: workout.loggedWorkoutId, ...workout, now: new Date() });
      await this.loggedWorkouts.save(tx, loggedWorkout);
      await this.events.publish(tx, loggedWorkout.pullDomainEvents());
    });
  }
}
