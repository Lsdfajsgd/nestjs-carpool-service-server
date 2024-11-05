import { MailerOptions } from '@nestjs-modules/mailer';

export const mailerConfig: MailerOptions = {
  transport: {
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
      user: process.env.EMAILADDRESS,
      pass: process.env.EMAILPASSWORD,
    },
  },
  defaults: {
    from: `'Energetic Company' <${process.env.EMAILADDRESS}>`,//보낸사람
  },
};
