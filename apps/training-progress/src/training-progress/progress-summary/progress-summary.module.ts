import { Module } from '@nestjs/common';
import { ProgressSummaries } from './application/queries/progress-summaries.js';
import { ProgressSummaryHandler } from './application/queries/progress-summary.handler.js';
import { StreakHandler } from './application/queries/streak.handler.js';
import { DrizzleProgressSummaries } from './infrastructure/drizzle-progress-summaries.js';

@Module({
  providers: [ProgressSummaryHandler, StreakHandler, { provide: ProgressSummaries, useClass: DrizzleProgressSummaries }],
})
export class ProgressSummaryModule {}
