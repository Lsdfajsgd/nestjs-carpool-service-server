import { IsString, IsNotEmpty, IsDateString, IsOptional, IsNumber } from "class-validator";

export class MatchingRequestDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  username: string;

  @IsNumber()
  @IsNotEmpty()
  startPoint: number;

  @IsNumber()
  @IsNotEmpty()
  endPoint: number;

  @IsDateString()
  @IsNotEmpty()
  requestTime: string; // ISO 8601 형식으로 시간 전달

  @IsOptional()
  seatingCapacity: number;
}