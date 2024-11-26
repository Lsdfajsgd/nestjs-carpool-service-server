import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserRepository } from './repositories/user.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { MailModule } from '../mail/mail.module';
import { JwtConfigModule } from '../jwt-config/jwt-config.module';
import { User } from './entities/user.entity';
import { VehicleRepository } from './repositories/vehicle.repository';

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
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtConfigModule,
    TypeOrmModule.forFeature([UserRepository]),
    MailModule,
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [AuthController],
  providers: [AuthService, UserRepository, VehicleRepository, JwtStrategy], // JwtStrategy룰 이 Auth 모듈에서 사용할수 있게 등록
  exports: [PassportModule, JwtStrategy], // JwtStrategy, PassportModule룰 다른 모듈에서 사용할수 있게 등록
})
export class AuthModule {}