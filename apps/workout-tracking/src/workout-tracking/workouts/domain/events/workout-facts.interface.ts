import type { EquipmentId } from '../../../equipment/domain/values/equipment-id.js';
import type { EquipmentType } from '../../../equipment/domain/values/equipment-type.js';
import type { MemberId } from '../../../equipment/domain/values/member-id.js';
import type { Discipline } from '../values/discipline.js';
import type { RecordingId } from '../values/recording-id.js';
import type { WorkoutId } from '../values/workout-id.js';
import type { WorkoutMetrics } from '../values/workout-metrics.js';
import type { WorkoutStatus } from '../values/workout-status.js';

/** The facts of a workout right after a change, as every workout event carries them. */
export interface WorkoutFacts {
  readonly workoutId: WorkoutId;
  readonly equipmentId: EquipmentId;
  readonly equipmentType: EquipmentType;
  readonly recordingId: RecordingId;
  readonly memberId: MemberId;
  readonly discipline: Discipline;
  readonly startedAt: Date;
  readonly metrics: WorkoutMetrics;
  readonly status: WorkoutStatus;
  readonly revision: number;
}
