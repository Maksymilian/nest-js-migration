import type { TrainingPeriod } from '../../../calendar/domain/values/training-period.js';
import type { ProgressSummaryRepresentation } from '../progress-summary.representation.interface.js';

/** Read port: totals and active days of a member's training log, read straight from SQL. */
export abstract class ProgressSummaries {
  abstract summary(memberId: string, period: TrainingPeriod, discipline: string | null): Promise<ProgressSummaryRepresentation>;

  /** The UTC days with at least one counting workout, newest first. */
  abstract activeDays(memberId: string): Promise<Date[]>;
}
