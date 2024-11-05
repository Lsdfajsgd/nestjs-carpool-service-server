import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    // Passport 모듈 등록
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // JWT 모듈 등록
    JwtModule.register({
      secret: 'Secret1234',
      signOptions: {
        expiresIn: 3600,
      },
    }),
  ],
  exports: [JwtModule, PassportModule],
})
export class JwtConfigModule {}
