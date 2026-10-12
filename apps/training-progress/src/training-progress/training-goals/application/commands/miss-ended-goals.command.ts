import { Command } from '@nestjs/cqrs';

/** Miss Ended Goals: miss the active goals whose grace period ended before `now`. Answers how many were missed. */
export class MissEndedGoalsCommand extends Command<number> {
  constructor(readonly now: Date) {
    super();
  }
}
