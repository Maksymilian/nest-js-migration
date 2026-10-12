import { IsString, Length } from 'class-validator';

export class VoidWorkoutDto {
  @IsString()
  @Length(1, 500)
  reason: string;
}
