import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  public async sendFirstTimeWelcomeParentWithStudentEmail(
    to: string,
    parentUsername: string,
    parentPassword: string,
    studentUsername: string,
    studentPassword: string,
  ): Promise<void> {
    await this.mailerService.sendMail({
      to,
      subject: 'Selamat datang di Bacarita parents!',
      template: './welcome-first-time-parent-with-student',
      context: {
        parentUsername: parentUsername,
        parentPassword: parentPassword,
        studentUsername: studentUsername,
        studentPassword: studentPassword,
        parentEmail: to,
      },
    });
  }

  public async sendStudentAccountInfoToParentEmail(
    to: string,
    studentUsername: string,
    studentPassword: string,
  ): Promise<void> {
    await this.mailerService.sendMail({
      to,
      subject: 'Informasi akun Bacarita untuk anak Anda',
      template: './student-account-info-to-parent',
      context: {
        studentUsername: studentUsername,
        studentPassword: studentPassword,
        parentEmail: to,
      },
    });
  }
}
