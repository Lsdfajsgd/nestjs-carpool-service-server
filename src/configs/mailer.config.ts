import { MailerOptions } from '@nestjs-modules/mailer';

export const mailerConfig: MailerOptions = {
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
};
