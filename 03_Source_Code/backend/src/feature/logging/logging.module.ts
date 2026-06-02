import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthAuditLog } from './entities/auth-audit-log.entity';
import { ApiAuditLog } from './entities/api-audit-log.entity';
import { LoggingController } from './logging.controller';
import { LoggingService } from './logging.service';
import { ApiAuditInterceptor } from './interceptors/api-audit.interceptor';

@Module({
  imports: [TypeOrmModule.forFeature([AuthAuditLog, ApiAuditLog])],
  controllers: [LoggingController],
  providers: [
    LoggingService,
    ApiAuditInterceptor,
    {
      provide: APP_INTERCEPTOR,
      useClass: ApiAuditInterceptor,
    },
  ],
  exports: [LoggingService],
})
export class LoggingModule {}
