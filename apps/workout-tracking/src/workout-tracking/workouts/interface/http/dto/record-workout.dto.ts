import { IsDateString, IsIn, IsInt, IsString, Length } from 'class-validator';

export class RecordWorkoutDto {
  /** The equipment's own id for this recording. Submitting it again returns the existing workout. */
  @IsString()
  @Length(1, 128)
  recordingId: string;

  @IsIn(['CYCLING', 'RUNNING', 'WALKING', 'ROWING'])
  discipline: string;

  /** ISO 8601, e.g. 2026-10-08T08:30:00.000Z */
  @IsDateString({ strict: true })
  startedAt: string;

  @IsInt()
  durationSeconds: number;

  @IsInt()
  distanceMeters: number;

  @IsInt()
  calories: number;
}
