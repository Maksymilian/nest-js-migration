import { Discipline } from './discipline.js';
import { RecordingId } from './recording-id.js';
import { WorkoutMetrics } from './workout-metrics.js';

/** The data equipment submits about a finished workout. Recording it creates the workout. */
export class Recording {
  constructor(
    readonly recordingId: RecordingId,
    readonly discipline: Discipline,
    readonly startedAt: Date,
    readonly metrics: WorkoutMetrics,
  ) {}
}
