import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          host: 'smtp.gmail.com',
          port: 587,
          auth: {
            user: config.get<string>('EMAILADDRESS'),
            pass: config.get<string>('EMAILPASSWORD'),
          },
        },
        defaults: {
          from: `'Energetic Company' <${config.get<string>('EMAILADDRESS')}>`,
        },
      }),
    }),
  ],
})
export class MailModule {}
