import { CorrectionReason } from './correction-reason.js';
import { WorkoutMetrics } from './workout-metrics.js';

/** One correction of a workout: the metrics it replaced, the new ones, and why. Kept as an audit trail. */
export class Correction {
  constructor(
    readonly revision: number,
    readonly previousMetrics: WorkoutMetrics,
    readonly newMetrics: WorkoutMetrics,
    readonly reason: CorrectionReason,
    readonly correctedAt: Date,
  ) {}
}
