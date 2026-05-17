import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';
import { BaseTransactionModule } from './common/base-transaction/base-transaction.module';
import { MailModule } from './common/mail/mail.module';
import { TokenGeneratorModule } from './common/token-generator/token-generator.module';
import app from './config/app/app.config';
import mail from './config/app/mail.config';
import { dataSourceOptions } from './config/database/typeorm.config';
import environmentValidation from './config/environment.validation';
import { createPinoLoggerOptions } from './core/logger/pino-logger.factory';
import { DatabaseSeederModule } from './database/database-seeder.module';
import { AccountManagementModule } from './feature/account-management/account-management.module';
import { AuthModule } from './feature/auth/auth.module';
import { LevelsModule } from './feature/levels/levels.module';
import { UsersModule } from './feature/users/users.module';
import { TestSessionModule } from './feature/test-session/test-session.module';
import { AiModule } from './feature/ai/ai.module';
import { DashboardModule } from './feature/dashboard/dashboard.module';
import { StoryManagementModule } from './feature/story-management/story-management.module';

const env: string = process.env.NODE_ENV || 'development';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${env}`,
      load: [app, mail],
      validationSchema: environmentValidation,
    }),

    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => createPinoLoggerOptions(config),
    }),

    TypeOrmModule.forRoot({
      ...dataSourceOptions,
      autoLoadEntities: true,
    }),

    UsersModule,

    TokenGeneratorModule,

    AuthModule,

    AccountManagementModule,

    BaseTransactionModule,

    MailModule,

    LevelsModule,

    TestSessionModule,

    AiModule,

    DashboardModule,

    DatabaseSeederModule,

    StoryManagementModule,
  ],
})
export class AppModule {}
