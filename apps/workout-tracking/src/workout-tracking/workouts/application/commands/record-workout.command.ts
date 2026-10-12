import { Command } from '@nestjs/cqrs';
import type { EquipmentId } from '../../../equipment/domain/values/equipment-id.js';
import type { Recording } from '../../domain/values/recording.js';
import type { WorkoutRepresentation } from '../workout.representation.interface.js';

/** `duplicate` when the equipment had already submitted this recording: the existing workout comes back. */
export class RecordWorkoutCommand extends Command<{ workout: WorkoutRepresentation; duplicate: boolean }> {
  constructor(
    readonly equipmentId: EquipmentId,
    readonly recording: Recording,
  ) {
    super();
  }
}
