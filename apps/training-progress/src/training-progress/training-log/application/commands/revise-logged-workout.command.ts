import { Command } from '@nestjs/cqrs';
import type { LoggedWorkoutFacts } from './log-workout.command.js';

/** Revise a logged workout: what a correction upstream becomes here. */
export class ReviseLoggedWorkoutCommand extends Command<void> {
  constructor(
    readonly workout: LoggedWorkoutFacts,
    readonly messageId: string,
  ) {
    super();
  }
}
