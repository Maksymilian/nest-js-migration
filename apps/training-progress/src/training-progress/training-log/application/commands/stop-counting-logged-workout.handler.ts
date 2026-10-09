import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { Transactions } from '../../../../platform/database/transactions.js';
import { DomainEventPublisher } from '../../../../platform/outbox/domain-event-publisher.js';
import { LoggedWorkout } from '../../domain/logged-workout.js';
import { LoggedWorkoutRepository } from '../../domain/logged-workout.repository.js';
import { ACL_CONSUMER } from './acl-consumer.js';
import { StopCountingLoggedWorkoutCommand } from './stop-counting-logged-workout.command.js';

/**
 * Stops counting the logged workout. If the void overtook the recording, the workout is logged
 * from the void's snapshot as not counting, so the recording that arrives later is ignored.
 */
@CommandHandler(StopCountingLoggedWorkoutCommand)
export class StopCountingLoggedWorkoutHandler implements ICommandHandler<StopCountingLoggedWorkoutCommand> {
  constructor(
    private readonly loggedWorkouts: LoggedWorkoutRepository,
    private readonly transactions: Transactions,
    private readonly events: DomainEventPublisher,
  ) {}

  async execute({ workout, messageId }: StopCountingLoggedWorkoutCommand) {
    await this.transactions.runOnce(ACL_CONSUMER, messageId, async (tx) => {
      const now = new Date();
      const existing = await this.loggedWorkouts.find(tx, workout.loggedWorkoutId);
      const loggedWorkout = existing ?? LoggedWorkout.logStoppedCounting({ id: workout.loggedWorkoutId, ...workout, now });
      if (existing) {
        existing.stopCounting(workout.sourceRevision, now);
        if (!existing.isChangedSinceLoaded()) {
          return;
        }
      }
      await this.loggedWorkouts.save(tx, loggedWorkout);
      await this.events.publish(tx, loggedWorkout.pullDomainEvents());
    });
  }
}
