import { Module} from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import {UserRepository} from "./user.repository";
import {TypeOrmModule} from "@nestjs/typeorm";
import {JwtModule} from "@nestjs/jwt";
import {PassportModule} from "@nestjs/passport";
import {JwtStrategy} from "./jwt.strategy";
import { MailModule } from "../mail/mail.module";
import { JwtConfigModule } from "../jwt-config/jwt-config.module";

@Module({
  imports: [
    // Passport 모듈 등록
    // PassportModule.register({defaultStrategy: 'jwt'}),
    //
    // // JWT 모듈 등록
    // JwtModule.register({
    //   secret:'Secret1234',
    //   signOptions:{
    //     expiresIn:3600
    //   }
    // }),
    JwtConfigModule,
    TypeOrmModule.forFeature([UserRepository]),
    MailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, UserRepository, JwtStrategy], // JwtStrategy룰 이 Auth 모듈에서 사용할수 있게 등록
  exports: [JwtStrategy], // JwtStrategy, PassportModule룰 다른 모듈에서 사용할수 있게 등록
})
export class AuthModule {}