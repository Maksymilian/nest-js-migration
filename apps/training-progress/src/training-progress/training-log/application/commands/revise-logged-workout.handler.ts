import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { Transactions } from '../../../../platform/database/transactions.js';
import { DomainEventPublisher } from '../../../../platform/outbox/domain-event-publisher.js';
import { LoggedWorkout } from '../../domain/logged-workout.js';
import { LoggedWorkoutRepository } from '../../domain/logged-workout.repository.js';
import { ACL_CONSUMER } from './acl-consumer.js';
import { ReviseLoggedWorkoutCommand } from './revise-logged-workout.command.js';

/**
 * Revises the logged workout. If the correction overtook the recording, the workout isn't logged
 * yet: the correction carries the whole workout, so it's logged with the corrected metrics.
 */
@CommandHandler(ReviseLoggedWorkoutCommand)
export class ReviseLoggedWorkoutHandler implements ICommandHandler<ReviseLoggedWorkoutCommand> {
  constructor(
    private readonly loggedWorkouts: LoggedWorkoutRepository,
    private readonly transactions: Transactions,
    private readonly events: DomainEventPublisher,
  ) {}

  async execute({ workout, messageId }: ReviseLoggedWorkoutCommand) {
    await this.transactions.runOnce(ACL_CONSUMER, messageId, async (tx) => {
      const now = new Date();
      const existing = await this.loggedWorkouts.find(tx, workout.loggedWorkoutId);
      const loggedWorkout = existing ?? LoggedWorkout.log({ id: workout.loggedWorkoutId, ...workout, now });
      if (existing) {
        existing.revise(workout.metrics, workout.sourceRevision, now);
        if (!existing.isChangedSinceLoaded()) {
          return;
        }
      }
      await this.loggedWorkouts.save(tx, loggedWorkout);
      await this.events.publish(tx, loggedWorkout.pullDomainEvents());
    });
  }
}
