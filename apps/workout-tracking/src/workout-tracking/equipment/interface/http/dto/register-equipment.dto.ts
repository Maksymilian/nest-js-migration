import { IsIn, IsString, Length } from 'class-validator';

export class RegisterEquipmentDto {
  @IsString()
  @Length(1, 64)
  serialNumber: string;

  @IsIn(['BIKE', 'TREADMILL', 'ROWER'])
  type: string;
}
