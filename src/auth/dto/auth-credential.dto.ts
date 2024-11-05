// 데이터 유효성 검사를 위한 조건 넣기
import {
  IsString,
  MaxLength,
  MinLength,
  Matches,
  IsNotEmpty,
  IsEmail,
  IsEnum,
  IsOptional,
  ValidateNested
} from "class-validator";
import { UserRole } from "./user-role.enum";
import { Type } from "class-transformer";
import { VehicleInfoDto } from "./vehicle-info.dto";

export class AuthCredentialDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(4)
  @MaxLength(20)
  username: string;

  @IsString()
  @MinLength(4)
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9]*$/, {
    message: 'password only accepts english and number',
  })
  password: string;

  @IsString()
  phoneNumber: string;

  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;

  @ValidateNested()
  @Type(() => VehicleInfoDto)
  @IsOptional()
  vehicleInfo?: VehicleInfoDto;
}