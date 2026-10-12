import { WorkoutTrackingTopics } from '@app/workout-tracking-contracts';
import { Controller, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Ctx, EventPattern, Payload, type RmqContext } from '@nestjs/microservices';
import type { CloudEventV1 } from 'cloudevents';
import { LogWorkoutCommand, type LoggedWorkoutFacts } from '../training-log/application/commands/log-workout.command.js';
import { ReviseLoggedWorkoutCommand } from '../training-log/application/commands/revise-logged-workout.command.js';
import { StopCountingLoggedWorkoutCommand } from '../training-log/application/commands/stop-counting-logged-workout.command.js';
import { InvalidIntegrationEvent } from './invalid-integration-event.js';
import { WorkoutSnapshotTranslator } from './workout-snapshot.translator.js';

type ToCommand = (workout: LoggedWorkoutFacts, messageId: string) => LogWorkoutCommand | ReviseLoggedWorkoutCommand | StopCountingLoggedWorkoutCommand;

/**
 * The anticorruption layer's message handlers. Each integration event arrives as a CloudEvent whose
 * type picks the handler (`CloudEventDeserializer`), and is translated into this context's command:
 * a recording becomes Log Workout, a correction Revise Logged Workout, a void Stop Counting Logged
 * Workout. A message is acked only after its transaction committed; an invalid one is dead-lettered
 * at once; any other failure is requeued, and RabbitMQ dead-letters it after its delivery limit.
 */
@Controller()
export class WorkoutTrackingEventsController {
  private readonly logger = new Logger(WorkoutTrackingEventsController.name);
  /** The last message handled for each partition key: a member's events run one at a time, in arrival order. */
  private readonly queues = new Map<string, Promise<void>>();

  constructor(
    private readonly commandBus: CommandBus,
    private readonly translator: WorkoutSnapshotTranslator,
  ) {}

  @EventPattern(WorkoutTrackingTopics.workoutRecordedV1)
  workoutRecorded(@Payload() event: CloudEventV1<unknown>, @Ctx() context: unknown) {
    return this.apply(event, context, (workout, messageId) => new LogWorkoutCommand(workout, messageId));
  }

  @EventPattern(WorkoutTrackingTopics.workoutCorrectedV1)
  workoutCorrected(@Payload() event: CloudEventV1<unknown>, @Ctx() context: unknown) {
    return this.apply(event, context, (workout, messageId) => new ReviseLoggedWorkoutCommand(workout, messageId));
  }

  @EventPattern(WorkoutTrackingTopics.workoutVoidedV1)
  workoutVoided(@Payload() event: CloudEventV1<unknown>, @Ctx() context: unknown) {
    return this.apply(event, context, (workout, messageId) => new StopCountingLoggedWorkoutCommand(workout, messageId));
  }

  private apply(event: CloudEventV1<unknown>, rmq: unknown, toCommand: ToCommand): Promise<void> {
    const context = rmq as RmqContext;
    const channel = context.getChannelRef() as { ack(message: unknown): void; nack(message: unknown, allUpTo: boolean, requeue: boolean): void };
    const message = context.getMessage();
    const partitionKey = typeof event?.partitionkey === 'string' ? event.partitionkey : (event?.id ?? 'unkeyed');
    return this.inOrder(partitionKey, async () => {
      try {
        const workout = await this.translator.translate(event);
        await this.commandBus.execute(toCommand(workout, event.id));
        channel.ack(message);
      } catch (error) {
        const invalid = error instanceof InvalidIntegrationEvent;
        this.logger.warn(`${invalid ? 'Dead-lettering' : 'Requeueing'} ${event?.type} ${event?.id}: ${(error as Error).message}`);
        channel.nack(message, false, !invalid);
      }
    });
  }

  private inOrder(key: string, work: () => Promise<void>): Promise<void> {
    const next = (this.queues.get(key) ?? Promise.resolve()).then(work, work);
    this.queues.set(key, next);
    const forget = () => {
      if (this.queues.get(key) === next) {
        this.queues.delete(key);
      }
    };
    next.then(forget, forget);
    return next;
  }
}
