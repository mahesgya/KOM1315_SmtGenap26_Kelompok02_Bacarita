import { Module } from '@nestjs/common';
import { AccountManagementService } from './account-management.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Parent } from '../users/entities/parent.entity';
import { Student } from '../users/entities/student.entity';
import { Teacher } from '../users/entities/teacher.entity';
import { TokenGeneratorModule } from 'src/common/token-generator/token-generator.module';
import { BaseTransactionModule } from 'src/common/base-transaction/base-transaction.module';
import { MailModule } from 'src/common/mail/mail.module';

@Module({
  imports: [
    BaseTransactionModule,

    MailModule,

    TypeOrmModule.forFeature([Parent, Student, Teacher]),

    TokenGeneratorModule,
  ],
  providers: [AccountManagementService],
  exports: [AccountManagementService],
})
export class AccountManagementModule {}
