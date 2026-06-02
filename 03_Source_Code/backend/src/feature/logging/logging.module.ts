import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthAuditLog } from './entities/auth-audit-log.entity';
import { LoggingController } from './logging.controller';
import { LoggingService } from './logging.service';

@Module({
  imports: [TypeOrmModule.forFeature([AuthAuditLog])],
  controllers: [LoggingController],
  providers: [LoggingService],
  exports: [LoggingService],
})
export class LoggingModule {}
