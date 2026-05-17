import { Controller, Get, HttpCode, Param, UseGuards } from '@nestjs/common';
import { DataResponse } from 'src/core/http/http-response';
import { Auth } from '../../auth/decorators/auth.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthRole } from '../../auth/enums/auth.enum';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { ICurrentUser } from '../../auth/interfaces/current-user.interfaces';
import {
  ParentDashboardOverviewDTO,
  ParentDashboardStudentDTO,
  ParentDashboardTestSessionDTO,
} from './dtos/parent-dashboard.dto';
import { ParentDashboardService } from './parent-dashboard.service';

@Controller('parents/dashboard')
export class ParentDashboardController {
  constructor(private readonly dashboardService: ParentDashboardService) {}

  @Get('overview')
  @HttpCode(200)
  @UseGuards(AuthGuard)
  @Auth(AuthRole.PARENT)
  public async getDashboardOverview(
    @CurrentUser() currentUser: ICurrentUser,
  ): Promise<DataResponse<ParentDashboardOverviewDTO>> {
    const overview: ParentDashboardOverviewDTO =
      await this.dashboardService.getParentDashboardOverview(currentUser.id);

    return new DataResponse<ParentDashboardOverviewDTO>(
      200,
      'Berhasil mendapatkan ringkasan dashboard orang tua',
      overview,
    );
  }

  @Get('children')
  @HttpCode(200)
  @UseGuards(AuthGuard)
  @Auth(AuthRole.PARENT)
  public async getChildren(
    @CurrentUser() currentUser: ICurrentUser,
  ): Promise<DataResponse<ParentDashboardStudentDTO[]>> {
    const children: ParentDashboardStudentDTO[] =
      await this.dashboardService.getParentChildren(currentUser.id);

    return new DataResponse<ParentDashboardStudentDTO[]>(
      200,
      'Berhasil mendapatkan daftar anak',
      children,
    );
  }

  @Get('children/:studentId/test-sessions')
  @HttpCode(200)
  @UseGuards(AuthGuard)
  @Auth(AuthRole.PARENT)
  public async getChildTestSessions(
    @CurrentUser() currentUser: ICurrentUser,
    @Param('studentId') studentId: string,
  ): Promise<DataResponse<ParentDashboardTestSessionDTO[]>> {
    const testSessions: ParentDashboardTestSessionDTO[] =
      await this.dashboardService.getChildTestSessions(
        currentUser.id,
        studentId,
      );

    return new DataResponse<ParentDashboardTestSessionDTO[]>(
      200,
      'Berhasil mendapatkan daftar sesi tes untuk anak',
      testSessions,
    );
  }

  @Get('children/:studentId/test-sessions/:testSessionId')
  @HttpCode(200)
  @UseGuards(AuthGuard)
  @Auth(AuthRole.PARENT)
  public async getChildTestSession(
    @CurrentUser() currentUser: ICurrentUser,
    @Param('studentId') studentId: string,
    @Param('testSessionId') testSessionId: string,
  ): Promise<DataResponse<ParentDashboardTestSessionDTO>> {
    const testSession: ParentDashboardTestSessionDTO =
      await this.dashboardService.getChildTestSession(
        currentUser.id,
        studentId,
        testSessionId,
      );

    return new DataResponse<ParentDashboardTestSessionDTO>(
      200,
      'Berhasil mendapatkan detail sesi tes',
      testSession,
    );
  }
}
