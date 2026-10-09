import { Command } from '@nestjs/cqrs';
import type { LoggedWorkoutFacts } from './log-workout.command.js';

/** Stop counting a logged workout: what a void upstream becomes here. */
export class StopCountingLoggedWorkoutCommand extends Command<void> {
  constructor(
    readonly workout: LoggedWorkoutFacts,
    readonly messageId: string,
  ) {
    super();
  }
}
