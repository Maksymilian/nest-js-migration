import { type PeriodKind, TrainingPeriod } from '../../training-progress/calendar/domain/values/training-period.js';

/** Cache keys of the read models (architecture section 8), in one place for the readers and the invalidation. */
export const CacheKeys = {
  progressSummary: (memberId: string, kind: PeriodKind, periodStart: Date, discipline: string | null) =>
    `progress-summary:${memberId}:${kind}:${periodStart.toISOString()}:${discipline ?? 'all'}`,
  personalRecords: (memberId: string) => `personal-records:${memberId}`,
  streak: (memberId: string) => `streak:${memberId}`,

  /** The week, month and year that contain the workout's start, for `all` and its discipline: 6 keys. */
  progressSummariesAffectedBy: (memberId: string, startedAt: Date, discipline: string) =>
    TrainingPeriod.allContaining(startedAt).flatMap((period) => [
      CacheKeys.progressSummary(memberId, period.kind, period.start, null),
      CacheKeys.progressSummary(memberId, period.kind, period.start, discipline),
    ]),
};
