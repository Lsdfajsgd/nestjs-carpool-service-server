import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    // Passport 모듈 등록
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // JWT 모듈 등록
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET is not defined in environment variables');
        }

        const accessExpiration = parseInt(
          configService.get<string>('JWT_ACCESS_EXPIRATION'),
          10,
        );

        if (isNaN(accessExpiration)) {
          throw new Error('JWT_EXPIRATION must be a valid number');
        }

        console.log('JWT Configuration:', {
          secretDefined: !!secret,
          accessExpiration: accessExpiration,
        });

        return {
          secret,
          signOptions: {
            expiresIn: accessExpiration,
          },
        };
      },
    }),

    //refreshToken
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET is not defined in environment variables');
        }

        const refreshExpiration = parseInt(
          configService.get<string>('JWT_REFRESH_EXPIRATION'),
          10,
        );

        if (isNaN(refreshExpiration)) {
          throw new Error('JWT_REFRESH_EXPIRATION must be a valid number');
        }

        console.log('JWT Configuration:', {
          secretDefined: !!secret,
          accessExpiration: refreshExpiration,
        });

        return {
          secret,
          signOptions: {
            expiresIn: refreshExpiration,
          },
        };
      },
    }),
  ],
  exports: [JwtModule, PassportModule],
})
export class JwtConfigModule {}
