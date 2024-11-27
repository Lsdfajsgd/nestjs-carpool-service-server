import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
<<<<<<< HEAD
import {UsersRepository} from "./repositories/users.repository";
import {TypeOrmModule} from "@nestjs/typeorm";
import {JwtModule} from "@nestjs/jwt";
import {PassportModule} from "@nestjs/passport";
import {JwtStrategy} from "./jwt.strategy";
import { MailModule } from "../mail/mail.module";
import { JwtConfigModule } from "../jwt-config/jwt-config.module";
import { VehicleInfoRepository } from "./repositories/vehicle-info.repository";
import { Users } from "./entities/users.entity";

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtConfigModule,
    TypeOrmModule.forFeature([UsersRepository]),
    TypeOrmModule.forFeature([VehicleInfoRepository]),
    TypeOrmModule.forFeature([Users]),
    MailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, UsersRepository, JwtStrategy, VehicleInfoRepository], // JwtStrategy룰 이 Auth 모듈에서 사용할수 있게 등록
  exports: [JwtStrategy, PassportModule], // JwtStrategy, PassportModule룰 다른 모듈에서 사용할수 있게 등록
})
export class AuthModule {}