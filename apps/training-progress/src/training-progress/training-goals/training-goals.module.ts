import { Module } from '@nestjs/common';
import { CheckGoalAchievementPolicy } from './application/check-goal-achievement.policy.js';
import { AbandonTrainingGoalHandler } from './application/commands/abandon-training-goal.handler.js';
import { SetTrainingGoalHandler } from './application/commands/set-training-goal.handler.js';
import { MissEndedGoalsJob } from './application/miss-ended-goals.job.js';
import { TrainingGoalProgressHandler } from './application/queries/training-goal-progress.handler.js';
import { TrainingGoalQueries } from './application/queries/training-goal-queries.js';
import { TrainingGoalsHandler } from './application/queries/training-goals.handler.js';
import { TrainingLogTotals } from './application/training-log-totals.js';
import { TrainingGoalRepository } from './domain/training-goal.repository.js';
import { DrizzleTrainingGoalQueries } from './infrastructure/drizzle-training-goal-queries.js';
import { DrizzleTrainingGoalRepository } from './infrastructure/drizzle-training-goal.repository.js';
import { DrizzleTrainingLogTotals } from './infrastructure/drizzle-training-log-totals.js';
import { TrainingGoalsResolver } from './interface/graphql/training-goals.resolver.js';

@Module({
  providers: [
    TrainingGoalsResolver,
    SetTrainingGoalHandler,
    AbandonTrainingGoalHandler,
    CheckGoalAchievementPolicy,
    MissEndedGoalsJob,
    TrainingGoalsHandler,
    TrainingGoalProgressHandler,
    { provide: TrainingGoalRepository, useClass: DrizzleTrainingGoalRepository },
    { provide: TrainingLogTotals, useClass: DrizzleTrainingLogTotals },
    { provide: TrainingGoalQueries, useClass: DrizzleTrainingGoalQueries },
  ],
})
export class TrainingGoalsModule {}
