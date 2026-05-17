import { registerAs } from '@nestjs/config';

export default registerAs('mail', () => ({
  host: process.env.MAIL_HOST,
  port: parseInt(process.env.MAIL_PORT ?? '587', 10),
  secure: process.env.MAIL_SECURE === 'true',
  user: process.env.MAIL_USER,
  pass: process.env.MAIL_PASS,
  fromName: process.env.MAIL_FROM_NAME,
  fromEmail: process.env.MAIL_FROM_EMAIL,
}));
