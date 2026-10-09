import { Module } from '@nestjs/common';
import { LogWorkoutHandler } from './application/commands/log-workout.handler.js';
import { ReviseLoggedWorkoutHandler } from './application/commands/revise-logged-workout.handler.js';
import { StopCountingLoggedWorkoutHandler } from './application/commands/stop-counting-logged-workout.handler.js';
import { TrainingLog } from './application/queries/training-log.js';
import { TrainingLogHandler } from './application/queries/training-log.handler.js';
import { LoggedWorkoutRepository } from './domain/logged-workout.repository.js';
import { DrizzleLoggedWorkoutRepository } from './infrastructure/drizzle-logged-workout.repository.js';
import { DrizzleTrainingLog } from './infrastructure/drizzle-training-log.js';

@Module({
  providers: [
    LogWorkoutHandler,
    ReviseLoggedWorkoutHandler,
    StopCountingLoggedWorkoutHandler,
    TrainingLogHandler,
    { provide: LoggedWorkoutRepository, useClass: DrizzleLoggedWorkoutRepository },
    { provide: TrainingLog, useClass: DrizzleTrainingLog },
  ],
})
export class TrainingLogModule {}
