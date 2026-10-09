import { Transform } from 'class-transformer';
import { IsEmail } from 'class-validator';

export class PairEquipmentDto {
  /** Until Identity exists, a member is identified by their email address (not verified). */
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  memberId: string;
}
