import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Admin } from '../users/entities/admin.entity';
import { Curator } from '../users/entities/curator.entity';
import { Parent } from '../users/entities/parent.entity';
import { Student } from '../users/entities/student.entity';
import { Teacher } from '../users/entities/teacher.entity';
import { AdminService } from '../users/admin/admin.service';
import { CuratorService } from '../users/curator/curator.service';
import { ParentService } from '../users/parent/parent.service';
import { StudentService } from '../users/student/student.service';
import { TeacherService } from '../users/teacher/teacher.service';
import { AdminSignInDTO } from './dtos/admin-sign-in.dto';
import { CuratorSignInDTO } from './dtos/curator-sign-in.dto';
import { ParentSignInDTO } from './dtos/parent-sign-in.dto';
import { StudentSignInDTO } from './dtos/student-sign-in.dto';
import { TeacherSignInDTO } from './dtos/teacher-sign-in.dto';
import { AuthRole } from './enums/auth.enum';
import { ICurrentUser } from './interfaces/current-user.interfaces';
import { ITokenResponse } from './interfaces/token-response.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly teacherService: TeacherService,
    private readonly parentService: ParentService,
    private readonly studentService: StudentService,
    private readonly adminService: AdminService,
    private readonly curatorService: CuratorService,
  ) {}

  public async getProfile(
    userId: string,
    role: AuthRole,
  ): Promise<Student | Teacher | Parent | Admin | Curator | null> {
    if (role === AuthRole.TEACHER) {
      return this.teacherService.findById(userId);
    }
    if (role === AuthRole.STUDENT) {
      return this.studentService.findById(userId);
    }
    if (role === AuthRole.PARENT) {
      return this.parentService.findById(userId);
    }
    if (role === AuthRole.ADMIN) {
      return this.adminService.findById(userId);
    }
    if (role === AuthRole.CURATOR) {
      return this.curatorService.findById(userId);
    }

    // if null will throw
    throw new NotFoundException('User tidak ditemukan');
  }

  public async loginTeacher(
    teacherSignInDto: TeacherSignInDTO,
  ): Promise<ITokenResponse> {
    let teacher: Teacher | null = null;
    if (teacherSignInDto.email && teacherSignInDto.username) {
      throw new ForbiddenException();
    }
    if (teacherSignInDto.email && !teacherSignInDto.username) {
      teacher = await this.teacherService.findByEmail(teacherSignInDto.email);
    }
    if (teacherSignInDto.username && !teacherSignInDto.email) {
      teacher = await this.teacherService.findByUsername(
        teacherSignInDto.username,
      );
    }
    if (!teacher) {
      throw new UnauthorizedException();
    }

    const isMatch: boolean = await bcrypt.compare(
      teacherSignInDto.password,
      teacher.password,
    );
    if (!isMatch) throw new UnauthorizedException('Kredensial salah');

    const currentUser: ICurrentUser = {
      id: teacher.id,
      email: teacher.email,
      username: teacher.username,
      role: AuthRole.TEACHER,
    };

    const token: string = this.generateJwtToken(currentUser);
    teacher.token = token;
    await this.teacherService.save(teacher);

    const tokenResponse: ITokenResponse = { token: token };

    return tokenResponse;
  }

  public async logoutTeacher(teacherId: string): Promise<void> {
    const teacher: Teacher | null =
      await this.teacherService.findById(teacherId);
    if (!teacher) throw new UnauthorizedException();
    if (!teacher.token)
      throw new ForbiddenException('Forbidden, already logged out');

    teacher.token = null;
    await this.teacherService.save(teacher);
  }

  public async loginStudent(
    studentSignInDto: StudentSignInDTO,
  ): Promise<ITokenResponse> {
    const student: Student | null = await this.studentService.findByUsername(
      studentSignInDto.username,
    );
    if (!student) {
      throw new UnauthorizedException('Kredensial salah');
    }

    const isMatch: boolean = await bcrypt.compare(
      studentSignInDto.password,
      student.password,
    );
    if (!isMatch) throw new UnauthorizedException('Kredensial salah');

    const currentUser: ICurrentUser = {
      id: student.id,
      email: '',
      username: student.username,
      role: AuthRole.STUDENT,
    };

    const token: string = this.generateJwtToken(currentUser);
    student.token = token;
    await this.studentService.save(student);

    const tokenResponse: ITokenResponse = { token: token };
    return tokenResponse;
  }

  public async loginParent(
    parentSignInDto: ParentSignInDTO,
  ): Promise<ITokenResponse> {
    const parent: Parent | null = await this.parentService.findByEmail(
      parentSignInDto.email,
    );
    if (!parent) {
      throw new UnauthorizedException('Kredensial salah');
    }

    const isMatch: boolean = await bcrypt.compare(
      parentSignInDto.password,
      parent.password,
    );
    if (!isMatch) throw new UnauthorizedException('Kredensial salah');

    const currentUser: ICurrentUser = {
      id: parent.id,
      email: parent.email,
      username: parent.username,
      role: AuthRole.PARENT,
    };

    const token: string = this.generateJwtToken(currentUser);
    parent.token = token;
    await this.parentService.save(parent);

    const tokenResponse: ITokenResponse = { token: token };
    return tokenResponse;
  }

  public async logoutStudent(studentId: string): Promise<void> {
    const student: Student | null =
      await this.studentService.findById(studentId);
    if (!student) throw new UnauthorizedException();
    if (!student.token)
      throw new ForbiddenException('Forbidden, already logged out');

    student.token = null;
    await this.studentService.save(student);
  }

  public async logoutParent(parentId: string): Promise<void> {
    const parent: Parent | null = await this.parentService.findById(parentId);
    if (!parent) throw new UnauthorizedException();
    if (!parent.token)
      throw new ForbiddenException('Forbidden, already logged out');

    parent.token = null;
    await this.parentService.save(parent);
  }

  public generateJwtToken(user: ICurrentUser): string {
    return this.jwtService.sign(user);
  }

  public async loginAdmin(
    adminSignInDto: AdminSignInDTO,
  ): Promise<ITokenResponse> {
    let admin: Admin | null = null;
    if (adminSignInDto.email && adminSignInDto.username) {
      throw new ForbiddenException();
    }
    if (adminSignInDto.email && !adminSignInDto.username) {
      admin = await this.adminService.findByEmail(adminSignInDto.email);
    }
    if (adminSignInDto.username && !adminSignInDto.email) {
      admin = await this.adminService.findByUsername(adminSignInDto.username);
    }
    if (!admin) {
      throw new UnauthorizedException('Kredensial salah');
    }

    const isMatch: boolean = await bcrypt.compare(
      adminSignInDto.password,
      admin.password,
    );
    if (!isMatch) throw new UnauthorizedException('Kredensial salah');

    const currentUser: ICurrentUser = {
      id: admin.id,
      email: admin.email,
      username: admin.username,
      role: AuthRole.ADMIN,
    };

    const token: string = this.generateJwtToken(currentUser);
    admin.token = token;
    await this.adminService.save(admin);

    const tokenResponse: ITokenResponse = { token: token };

    return tokenResponse;
  }

  public async logoutAdmin(adminId: string): Promise<void> {
    const admin: Admin | null = await this.adminService.findById(adminId);
    if (!admin) throw new UnauthorizedException();
    if (!admin.token)
      throw new ForbiddenException('Forbidden, already logged out');

    admin.token = null;
    await this.adminService.save(admin);
  }

  public async loginCurator(
    curatorSignInDto: CuratorSignInDTO,
  ): Promise<ITokenResponse> {
    let curator: Curator | null = null;
    if (curatorSignInDto.email && curatorSignInDto.username) {
      throw new ForbiddenException();
    }
    if (curatorSignInDto.email && !curatorSignInDto.username) {
      curator = await this.curatorService.findByEmail(curatorSignInDto.email);
    }
    if (curatorSignInDto.username && !curatorSignInDto.email) {
      curator = await this.curatorService.findByUsername(
        curatorSignInDto.username,
      );
    }
    if (!curator) {
      throw new UnauthorizedException('Kredensial salah');
    }

    const isMatch: boolean = await bcrypt.compare(
      curatorSignInDto.password,
      curator.password,
    );
    if (!isMatch) throw new UnauthorizedException('Kredensial salah');

    const currentUser: ICurrentUser = {
      id: curator.id,
      email: curator.email,
      username: curator.username,
      role: AuthRole.CURATOR,
    };

    const token: string = this.generateJwtToken(currentUser);
    curator.token = token;
    await this.curatorService.save(curator);

    const tokenResponse: ITokenResponse = { token: token };

    return tokenResponse;
  }

  public async logoutCurator(curatorId: string): Promise<void> {
    const curator: Curator | null =
      await this.curatorService.findById(curatorId);
    if (!curator) throw new UnauthorizedException();
    if (!curator.token)
      throw new ForbiddenException('Forbidden, already logged out');

    curator.token = null;
    await this.curatorService.save(curator);
  }

  public verifyJwtToken(token: string): ICurrentUser | null {
    try {
      return this.jwtService.verify<ICurrentUser>(token);
    } catch {
      return null;
    }
  }
}
