import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DataResponse } from 'src/core/http/http-response';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuthRole } from '../auth/enums/auth.enum';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthAuditLogDashboardDTO } from './dtos/auth-audit-log-response.dto';
import { AuthAuditLogQueryDTO } from './dtos/auth-audit-log-query.dto';
import { ApiAuditLogQueryDTO } from './dtos/api-audit-log-query.dto';
import { ApiAuditLogDashboardDTO } from './dtos/api-audit-log-response.dto';
import { LoggingService } from './logging.service';

@Controller('auth/admin')
export class LoggingController {
  constructor(private readonly loggingService: LoggingService) {}

  @Get('audit-logs/standalone')
  @UseGuards(AuthGuard)
  @Auth(AuthRole.ADMIN)
  public async getStandaloneAuditLogs(
    @Query() query: AuthAuditLogQueryDTO,
  ): Promise<DataResponse<AuthAuditLogDashboardDTO>> {
    const dashboard = await this.loggingService.getAuditLogDashboard(query);

    return new DataResponse<AuthAuditLogDashboardDTO>(
      200,
      'Berhasil mendapatkan data audit autentikasi untuk dashboard standalone.',
      dashboard,
    );
  }

  @Get('api-logs')
  @UseGuards(AuthGuard)
  @Auth(AuthRole.ADMIN)
  public async getApiLogs(
    @Query() query: ApiAuditLogQueryDTO,
  ): Promise<DataResponse<ApiAuditLogDashboardDTO>> {
    const dashboard = await this.loggingService.getApiLogDashboard(query);

    return new DataResponse<ApiAuditLogDashboardDTO>(
      200,
      'Berhasil mendapatkan data API log untuk dashboard.',
      dashboard,
    );
  }
}
