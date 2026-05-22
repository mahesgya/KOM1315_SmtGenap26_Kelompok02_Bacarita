import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(MailService.name);
  }

  private shouldLogInsteadOfSend(): boolean {
    return (
      this.configService.get<string>('mail.mode') === 'log' &&
      this.configService.get<string>('NODE_ENV') !== 'production'
    );
  }

  private logDevCredentials(title: string, lines: string[]): void {
    this.logger.warn(`\n[DEV MAIL MODE]\n${title}\n${lines.join('\n')}\n`);
  }

  public async sendFirstTimeWelcomeParentWithStudentEmail(
    to: string,
    parentUsername: string,
    parentPassword: string,
    studentUsername: string,
    studentPassword: string,
  ): Promise<void> {
    if (this.shouldLogInsteadOfSend()) {
      this.logDevCredentials('Parent and student credentials generated', [
        `recipient_email: ${to}`,
        `parent_username: ${parentUsername}`,
        `parent_password: ${parentPassword}`,
        `student_username: ${studentUsername}`,
        `student_password: ${studentPassword}`,
      ]);
      return;
    }

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
    if (this.shouldLogInsteadOfSend()) {
      this.logDevCredentials('Student credentials generated', [
        `recipient_email: ${to}`,
        `student_username: ${studentUsername}`,
        `student_password: ${studentPassword}`,
      ]);
      return;
    }

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
