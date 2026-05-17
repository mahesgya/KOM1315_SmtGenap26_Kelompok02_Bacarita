import { Controller, Get, HttpCode, Param, UseGuards } from '@nestjs/common';
import { DataResponse } from 'src/core/http/http-response';
import { Auth } from 'src/feature/auth/decorators/auth.decorator';
import { CurrentUser } from 'src/feature/auth/decorators/current-user.decorator';
import { AuthRole } from 'src/feature/auth/enums/auth.enum';
import { AuthGuard } from 'src/feature/auth/guards/auth.guard';
import { ICurrentUser } from 'src/feature/auth/interfaces/current-user.interfaces';
import {
  TeacherDashboardOverviewDTO,
  TeacherDashboardStudentDTO,
  TeacherDashboardTestSessionDTO,
} from './dtos/teacher-dashboard.dto';
import { TeacherDashboardService } from './teacher-dashboard.service';

@Controller('teachers/dashboard')
export class TeacherDashboardController {
  constructor(private readonly dashboardService: TeacherDashboardService) {}

  @Get('overview')
  @HttpCode(200)
  @UseGuards(AuthGuard)
  @Auth(AuthRole.TEACHER)
  public async getDashboardOverview(
    @CurrentUser() currentUser: ICurrentUser,
  ): Promise<DataResponse<TeacherDashboardOverviewDTO>> {
    const overview = await this.dashboardService.getTeacherDashboardOverview(
      currentUser.id,
    );

    return new DataResponse<TeacherDashboardOverviewDTO>(
      200,
      'Berhasil mendapatkan ringkasan dashboard guru',
      overview,
    );
  }

  @Get('students')
  @HttpCode(200)
  @UseGuards(AuthGuard)
  @Auth(AuthRole.TEACHER)
  public async getStudents(
    @CurrentUser() currentUser: ICurrentUser,
  ): Promise<DataResponse<TeacherDashboardStudentDTO[]>> {
    const students = await this.dashboardService.getTeacherStudents(
      currentUser.id,
    );

    return new DataResponse<TeacherDashboardStudentDTO[]>(
      200,
      'Berhasil mendapatkan daftar siswa',
      students,
    );
  }

  @Get('students/:studentId/test-sessions')
  @HttpCode(200)
  @UseGuards(AuthGuard)
  @Auth(AuthRole.TEACHER)
  public async getStudentTestSessions(
    @CurrentUser() currentUser: ICurrentUser,
    @Param('studentId') studentId: string,
  ): Promise<DataResponse<TeacherDashboardTestSessionDTO[]>> {
    const testSessions = await this.dashboardService.getStudentTestSessions(
      currentUser.id,
      studentId,
    );

    return new DataResponse<TeacherDashboardTestSessionDTO[]>(
      200,
      'Berhasil mendapatkan daftar sesi tes untuk siswa',
      testSessions,
    );
  }

  @Get('students/:studentId/test-sessions/:testSessionId')
  @HttpCode(200)
  @UseGuards(AuthGuard)
  @Auth(AuthRole.TEACHER)
  public async getStudentTestSession(
    @CurrentUser() currentUser: ICurrentUser,
    @Param('studentId') studentId: string,
    @Param('testSessionId') testSessionId: string,
  ): Promise<DataResponse<TeacherDashboardTestSessionDTO>> {
    const testSession: TeacherDashboardTestSessionDTO =
      await this.dashboardService.getStudentTestSession(
        currentUser.id,
        studentId,
        testSessionId,
      );

    return new DataResponse<TeacherDashboardTestSessionDTO>(
      200,
      'Berhasil mendapatkan daftar sesi tes untuk siswa',
      testSession,
    );
  }
}
