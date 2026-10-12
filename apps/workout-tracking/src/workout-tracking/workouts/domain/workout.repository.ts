import type { Transaction } from '@app/ddd';
import type { EquipmentId } from '../../equipment/domain/values/equipment-id.js';
import type { RecordingId } from './values/recording-id.js';
import type { WorkoutId } from './values/workout-id.js';
import type { Workout } from './workout.js';

/** Port: loads and saves whole `Workout` aggregates, and their corrections as an audit trail. */
export abstract class WorkoutRepository {
  /** @throws WorkoutNotFound */
  abstract get(id: WorkoutId): Promise<Workout>;

  /** The workout the equipment recorded with this recording id, if any. */
  abstract findByRecording(equipmentId: EquipmentId, recordingId: RecordingId): Promise<Workout | undefined>;

  /**
   * Inserts a new workout or saves a correction or void, through the transaction.
   * @throws DuplicateRecording when the equipment already recorded the recording id
   * @throws ConcurrencyConflict when the workout changed since it was loaded
   */
  abstract save(tx: Transaction, workout: Workout): Promise<void>;
}
