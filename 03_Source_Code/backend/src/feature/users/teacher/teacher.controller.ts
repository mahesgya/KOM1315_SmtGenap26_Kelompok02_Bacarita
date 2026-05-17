import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import { instanceToPlain } from 'class-transformer';
import { DataResponse } from 'src/core/http/http-response';
import { AccountManagementService } from 'src/feature/account-management/account-management.service';
import { Auth } from 'src/feature/auth/decorators/auth.decorator';
import { CurrentUser } from 'src/feature/auth/decorators/current-user.decorator';
import { AuthRole } from 'src/feature/auth/enums/auth.enum';
import { AuthGuard } from 'src/feature/auth/guards/auth.guard';
import { ICurrentUser } from 'src/feature/auth/interfaces/current-user.interfaces';
import { Student } from '../entities/student.entity';
import { Teacher } from '../entities/teacher.entity';
import { CreateStudentAndParentDTO } from './dto/create-student-parent.dto';
import { CreateTeacherDTO } from './dto/create-teacher.dto';
import { IParentProfile } from './interfaces/parent-profile.interace';
import { TeacherService } from './teacher.service';

@Controller('teachers')
export class TeacherController {
  constructor(
    private readonly teacherService: TeacherService,
    private readonly accountManagementService: AccountManagementService,
  ) {}

  @Post()
  @HttpCode(201)
  public async createTeacher(
    @Body() createTeacherDto: CreateTeacherDTO,
  ): Promise<DataResponse<Teacher>> {
    const newTeacher: Teacher =
      await this.teacherService.create(createTeacherDto);

    return new DataResponse(201, 'Berhasil registrasi guru', newTeacher);
  }

  @Get('students/parents-email')
  @HttpCode(200)
  @UseGuards(AuthGuard)
  @Auth(AuthRole.TEACHER)
  public async getAllStudentsParentsEmail(
    @CurrentUser() _: ICurrentUser,
  ): Promise<DataResponse<IParentProfile[]>> {
    const parentsProfile: IParentProfile[] =
      await this.accountManagementService.getAllStudentsParentsEmailAndFullname();

    return new DataResponse(
      200,
      'Berhasil mendapatkan daftar email orang tua',
      instanceToPlain(parentsProfile) as IParentProfile[],
    );
  }

  @Post('students')
  @HttpCode(201)
  @UseGuards(AuthGuard)
  @Auth(AuthRole.TEACHER)
  public async registerStudentAndParent(
    @Body() createStudentAndParentDto: CreateStudentAndParentDTO,
    @CurrentUser() currentTeacher: ICurrentUser,
  ): Promise<DataResponse<Student>> {
    const newlyStudent: Student =
      await this.accountManagementService.createStudentWithParentAccount(
        createStudentAndParentDto.studentUsername,
        createStudentAndParentDto.studentFullName,
        createStudentAndParentDto.parentEmail,
        currentTeacher.id,
        createStudentAndParentDto.parentFullName,
        createStudentAndParentDto.jumpLevelTo,
      );

    return new DataResponse(201, 'Berhasil mendaftarkan siswa', newlyStudent);
  }
}
