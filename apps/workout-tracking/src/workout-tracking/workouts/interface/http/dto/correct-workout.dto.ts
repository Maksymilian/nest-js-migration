import { IsInt, IsString, Length } from 'class-validator';

export class CorrectWorkoutDto {
  @IsInt()
  durationSeconds: number;

  @IsInt()
  distanceMeters: number;

  @IsInt()
  calories: number;

  @IsString()
  @Length(1, 500)
  reason: string;
}
