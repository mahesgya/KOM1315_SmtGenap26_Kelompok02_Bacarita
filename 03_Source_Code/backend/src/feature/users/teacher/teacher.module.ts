import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Teacher } from '../entities/teacher.entity';
import { TeacherController } from './teacher.controller';
import { TeacherService } from './teacher.service';
import { TokenGeneratorModule } from 'src/common/token-generator/token-generator.module';
import { AuthModule } from 'src/feature/auth/auth.module';
import { AccountManagementModule } from 'src/feature/account-management/account-management.module';
import { BaseTransactionModule } from 'src/common/base-transaction/base-transaction.module';

@Module({
  imports: [
    AccountManagementModule,

    BaseTransactionModule,

    TypeOrmModule.forFeature([Teacher]),

    TokenGeneratorModule,

    forwardRef(() => AuthModule),
  ],
  controllers: [TeacherController],
  providers: [TeacherService],
  exports: [TeacherService],
})
export class TeacherModule {}
