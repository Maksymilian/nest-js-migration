import { DomainError } from '@app/ddd';

/** The equipment already recorded a workout with this recording id. Answered with the existing workout. */
export class DuplicateRecording extends DomainError {
  readonly kind = 'conflict';

  constructor(
    readonly equipmentId: string,
    readonly recordingId: string,
  ) {
    super(`Equipment ${equipmentId} already recorded ${recordingId}`);
  }
}
