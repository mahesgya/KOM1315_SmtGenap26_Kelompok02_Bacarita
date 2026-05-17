import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { DataResponse } from 'src/core/http/http-response';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthRole } from '../auth/enums/auth.enum';
import { AuthGuard } from '../auth/guards/auth.guard';
import { ICurrentUser } from '../auth/interfaces/current-user.interfaces';
import { StudentLevelResponseDTO } from './dtos/student-level-response.dto';
import { LevelsService } from './levels.service';

@Controller('students/levels')
export class LevelsStudentController {
  constructor(private readonly levelsService: LevelsService) {}

  @Get()
  @UseGuards(AuthGuard)
  @Auth(AuthRole.STUDENT)
  @HttpCode(HttpStatus.OK)
  public async getStudentLevels(
    @CurrentUser() currentUser: ICurrentUser,
  ): Promise<DataResponse<StudentLevelResponseDTO[]>> {
    const levels: StudentLevelResponseDTO[] =
      await this.levelsService.getLevelsForStudentWithProgresses(
        currentUser.id,
      );

    return new DataResponse<StudentLevelResponseDTO[]>(
      HttpStatus.OK,
      `Berhasil mendapatkan daftar level dan progressnya untuk murid ${currentUser.username}`,
      levels,
    );
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  @Auth(AuthRole.STUDENT)
  @HttpCode(HttpStatus.OK)
  public async getStudentLevelById(
    @Param('id', ParseIntPipe) levelId: number,
    @CurrentUser() currentUser: ICurrentUser,
  ): Promise<DataResponse<StudentLevelResponseDTO>> {
    const level: StudentLevelResponseDTO =
      await this.levelsService.getLevelByIdForStudentWithProgresses(
        currentUser.id,
        levelId,
      );

    return new DataResponse<StudentLevelResponseDTO>(
      HttpStatus.OK,
      `Berhasil mendapatkan data level ${level.fullName} dan progressnya untuk murid ${currentUser.username}`,
      level,
    );
  }
}
