import { IsString, IsNotEmpty } from 'class-validator';

export class VehicleInfoDto {
  @IsString()
  @IsNotEmpty()
  model: string;

  @IsString()
  @IsNotEmpty()
  licensePlate: string;

  @IsNotEmpty()
  seatingCapacity: number;
}