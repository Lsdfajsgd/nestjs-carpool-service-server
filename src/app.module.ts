import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from "@nestjs/typeorm";
import { typeORMConfig } from "./configs/typeorm.config";
import { MailModule } from './mail/mail.module';
import { JwtConfigModule } from './jwt-config/jwt-config.module';
import { ChatGateway } from './chat/chat.gateway';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeORMConfig),
    AuthModule,
    MailModule,
    JwtConfigModule,
  ],
  providers: [ChatGateway],
})
export class AppModule {}
