import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from "@nestjs/typeorm";
import { typeORMConfig } from "./configs/typeorm.config";
import { MailModule } from './mail/mail.module';
import { JwtConfigModule } from './jwt-config/jwt-config.module';
<<<<<<< HEAD
import { MatchingModule } from './matching/matching.module';
import { ConfigModule, ConfigService } from "@nestjs/config";
=======
import { ChatModule } from './chat/chat.module';
import { MatchingModule } from './matching/matching.module';
>>>>>>> devlop

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env'
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => typeORMConfig(configService)
    }),
    AuthModule,
    MailModule,
    JwtConfigModule,
<<<<<<< HEAD
    MatchingModule
=======
    ChatModule,
    MatchingModule,
>>>>>>> devlop
  ],
})
export class AppModule {}