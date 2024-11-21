import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';
import { JwtConfigModule } from "../jwt-config/jwt-config.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersRepository } from "../auth/repositories/users.repository";


@Module({
  imports: [
    //MailerModule.forRoot(mailerConfig),
    MailerModule.forRootAsync({
      useFactory: () => ({
        transport: {
          host: 'smtp.gmail.com',
          port: 587,
          auth: {
            user: 'developtest99990@gmail.com',
            pass: 'tbys ydft cxih plnt',
          },
        },
        defaults: {
          from: `'Energetic Company' <developtest99990@gmail.com>`,//보낸사람
        },
      }),
    }),
    TypeOrmModule.forFeature([UsersRepository]),
    JwtConfigModule,
  ], // MailerModule 설정을 여기서 가져옴
  providers: [MailService, UsersRepository,],
  exports: [MailService],// 다른 모듈에서 MailService를 사용할 수 있도록 내보냄
  controllers: [MailController],
})
export class MailModule {}
