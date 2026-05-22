import {
  ForbiddenException,
  HttpException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import { Repository } from 'typeorm';
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
import {
  AuthAuditLog,
  AuditEvent,
  AuditRole,
} from './entities/auth-audit-log.entity';
import { CryptoService } from 'src/common/crypto/crypto.service';
import {
  AuthAuditLogDashboardDTO,
  AuthAuditLogItemDTO,
  AuthAuditLogSummaryDTO,
  AuthAuditLogTrendPointDTO,
} from './dtos/auth-audit-log-response.dto';
import {
  AuditWindow,
  AuthAuditLogQueryDTO,
} from './dtos/auth-audit-log-query.dto';

const AUDIT_LOG_PATH =
  '/Users/anargyaisadhimaheswara/Documents/Semester6/KI/PBL/05_Testing/auth_activity.log';
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const DEFAULT_AUDIT_WINDOW: AuditWindow = '7d';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly teacherService: TeacherService,
    private readonly parentService: ParentService,
    private readonly studentService: StudentService,
    private readonly adminService: AdminService,
    private readonly curatorService: CuratorService,
    private readonly cryptoService: CryptoService,
    private readonly configService: ConfigService,
    @InjectRepository(AuthAuditLog)
    private readonly auditLogRepository: Repository<AuthAuditLog>,
  ) {}

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  private writeAuditFile(entry: {
    event: AuditEvent;
    userId: string | null;
    role: AuditRole | null;
    ip: string | null;
  }): void {
    try {
      const line =
        JSON.stringify({
          timestamp: new Date().toISOString(),
          event: entry.event,
          userId: entry.userId,
          role: entry.role,
          ip: entry.ip,
        }) + '\n';
      fs.appendFileSync(AUDIT_LOG_PATH, line, { encoding: 'utf8' });
    } catch {
      return;
    }
  }

  private async saveAuditLog(
    event: AuditEvent,
    userId: string | null,
    role: AuditRole | null,
    ipAddress: string | null,
    userAgent: string | null,
  ): Promise<void> {
    const log = this.auditLogRepository.create({
      event,
      userId,
      role,
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
    });
    await this.auditLogRepository.save(log);
  }

  private checkLockout(entity: { lockedUntil: Date | null }): void {
    if (entity.lockedUntil && entity.lockedUntil > new Date()) {
      throw new HttpException('Akun terkunci sementara', 423);
    }
  }

  private getWindowStart(window: AuditWindow): Date {
    const now = Date.now();

    switch (window) {
      case '24h':
        return new Date(now - 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now - 90 * 24 * 60 * 60 * 1000);
      case '7d':
      default:
        return new Date(now - 7 * 24 * 60 * 60 * 1000);
    }
  }

  private buildAuditTrend(
    logs: AuthAuditLog[],
    window: AuditWindow,
  ): AuthAuditLogTrendPointDTO[] {
    const formatter =
      window === '24h'
        ? new Intl.DateTimeFormat('id-ID', {
            hour: '2-digit',
            day: '2-digit',
            month: 'short',
          })
        : new Intl.DateTimeFormat('id-ID', {
            day: '2-digit',
            month: 'short',
          });

    const buckets = new Map<string, AuthAuditLogTrendPointDTO>();

    for (const log of logs) {
      const bucketDate = new Date(log.createdAt);
      if (window === '24h') {
        bucketDate.setMinutes(0, 0, 0);
      } else {
        bucketDate.setHours(0, 0, 0, 0);
      }

      const key = bucketDate.toISOString();
      const current = buckets.get(key) ?? {
        label: formatter.format(bucketDate),
        total: 0,
        loginSuccessCount: 0,
        loginFailCount: 0,
        lockoutCount: 0,
        logoutCount: 0,
      };

      current.total += 1;
      if (log.event === AuditEvent.LOGIN_OK) current.loginSuccessCount += 1;
      if (log.event === AuditEvent.LOGIN_FAIL) current.loginFailCount += 1;
      if (log.event === AuditEvent.LOCKED) current.lockoutCount += 1;
      if (log.event === AuditEvent.LOGOUT) current.logoutCount += 1;

      buckets.set(key, current);
    }

    return [...buckets.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([, value]) => value);
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

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

    throw new NotFoundException('User tidak ditemukan');
  }

  public async getAuditLogDashboard(
    query: AuthAuditLogQueryDTO,
  ): Promise<AuthAuditLogDashboardDTO> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const window = query.window ?? DEFAULT_AUDIT_WINDOW;
    const windowStart = this.getWindowStart(window);

    const listQuery = this.auditLogRepository
      .createQueryBuilder('log')
      .where('log.createdAt >= :windowStart', { windowStart });

    const summaryQuery = this.auditLogRepository
      .createQueryBuilder('log')
      .where('log.createdAt >= :windowStart', { windowStart });

    if (query.event) {
      listQuery.andWhere('log.event = :event', { event: query.event });
      summaryQuery.andWhere('log.event = :event', { event: query.event });
    }

    if (query.role) {
      listQuery.andWhere('log.role = :role', { role: query.role });
      summaryQuery.andWhere('log.role = :role', { role: query.role });
    }

    const recentAlertQuery = this.auditLogRepository
      .createQueryBuilder('log')
      .where('log.createdAt >= :recentStart', {
        recentStart: new Date(Date.now() - 24 * 60 * 60 * 1000),
      })
      .andWhere('log.event IN (:...alertEvents)', {
        alertEvents: [AuditEvent.LOGIN_FAIL, AuditEvent.LOCKED],
      });

    if (query.role) {
      recentAlertQuery.andWhere('log.role = :role', { role: query.role });
    }

    if (query.event) {
      recentAlertQuery.andWhere('log.event = :event', { event: query.event });
    }

    const [items, totalItems, summaryLogs, recentAlertCount] =
      await Promise.all([
        listQuery
          .orderBy('log.createdAt', 'DESC')
          .skip((page - 1) * limit)
          .take(limit)
          .getMany(),
        listQuery.clone().getCount(),
        summaryQuery.orderBy('log.createdAt', 'ASC').getMany(),
        recentAlertQuery.getCount(),
      ]);

    const uniqueUsers = new Set(
      summaryLogs
        .map((log) => log.userId)
        .filter((userId): userId is string => Boolean(userId)),
    ).size;

    const summary: AuthAuditLogSummaryDTO = {
      totalEvents: summaryLogs.length,
      loginSuccessCount: summaryLogs.filter(
        (log) => log.event === AuditEvent.LOGIN_OK,
      ).length,
      loginFailCount: summaryLogs.filter(
        (log) => log.event === AuditEvent.LOGIN_FAIL,
      ).length,
      logoutCount: summaryLogs.filter((log) => log.event === AuditEvent.LOGOUT)
        .length,
      lockoutCount: summaryLogs.filter((log) => log.event === AuditEvent.LOCKED)
        .length,
      uniqueUsers,
      recentAlertCount,
      trend: this.buildAuditTrend(summaryLogs, window),
    };

    return {
      filters: {
        event: query.event ?? null,
        role: query.role ?? null,
        window,
      },
      summary,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / limit)),
      },
      items: items.map(
        (item): AuthAuditLogItemDTO => ({
          id: item.id,
          userId: item.userId,
          role: item.role,
          event: item.event,
          ipAddress: item.ipAddress,
          userAgent: item.userAgent,
          createdAt: item.createdAt,
        }),
      ),
    };
  }

  public async loginTeacher(
    teacherSignInDto: TeacherSignInDTO,
    ipAddress: string,
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
      await this.saveAuditLog(
        AuditEvent.LOGIN_FAIL,
        null,
        AuditRole.TEACHER,
        ipAddress,
        null,
      );
      this.writeAuditFile({
        event: AuditEvent.LOGIN_FAIL,
        userId: null,
        role: AuditRole.TEACHER,
        ip: ipAddress,
      });
      throw new UnauthorizedException();
    }

    this.checkLockout(teacher);

    const isMatch: boolean = await bcrypt.compare(
      teacherSignInDto.password,
      teacher.password,
    );
    if (!isMatch) {
      teacher.failedLoginAttempts += 1;
      if (teacher.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
        teacher.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
        await this.teacherService.save(teacher);
        await this.saveAuditLog(
          AuditEvent.LOCKED,
          teacher.id,
          AuditRole.TEACHER,
          ipAddress,
          null,
        );
        this.writeAuditFile({
          event: AuditEvent.LOCKED,
          userId: teacher.id,
          role: AuditRole.TEACHER,
          ip: ipAddress,
        });
      } else {
        await this.teacherService.save(teacher);
      }
      await this.saveAuditLog(
        AuditEvent.LOGIN_FAIL,
        teacher.id,
        AuditRole.TEACHER,
        ipAddress,
        null,
      );
      this.writeAuditFile({
        event: AuditEvent.LOGIN_FAIL,
        userId: teacher.id,
        role: AuditRole.TEACHER,
        ip: ipAddress,
      });
      throw new UnauthorizedException('Kredensial salah');
    }

    const currentUser: ICurrentUser = {
      id: teacher.id,
      email: teacher.email,
      username: teacher.username,
      role: AuthRole.TEACHER,
    };

    const token: string = this.generateJwtToken(currentUser);
    const tokenHash: string = this.cryptoService.hashToken(token);
    teacher.token = tokenHash;
    teacher.failedLoginAttempts = 0;
    teacher.lockedUntil = null;
    await this.teacherService.save(teacher);

    await this.saveAuditLog(
      AuditEvent.LOGIN_OK,
      teacher.id,
      AuditRole.TEACHER,
      ipAddress,
      null,
    );
    this.writeAuditFile({
      event: AuditEvent.LOGIN_OK,
      userId: teacher.id,
      role: AuditRole.TEACHER,
      ip: ipAddress,
    });

    return { token };
  }

  public async logoutTeacher(teacherId: string): Promise<void> {
    const teacher: Teacher | null =
      await this.teacherService.findById(teacherId);
    if (!teacher) throw new UnauthorizedException();
    if (!teacher.token)
      throw new ForbiddenException('Forbidden, already logged out');

    teacher.token = null;
    await this.teacherService.save(teacher);

    await this.saveAuditLog(
      AuditEvent.LOGOUT,
      teacher.id,
      AuditRole.TEACHER,
      null,
      null,
    );
    this.writeAuditFile({
      event: AuditEvent.LOGOUT,
      userId: teacher.id,
      role: AuditRole.TEACHER,
      ip: null,
    });
  }

  public async loginStudent(
    studentSignInDto: StudentSignInDTO,
    ipAddress: string,
  ): Promise<ITokenResponse> {
    const student: Student | null = await this.studentService.findByUsername(
      studentSignInDto.username,
    );
    if (!student) {
      await this.saveAuditLog(
        AuditEvent.LOGIN_FAIL,
        null,
        AuditRole.STUDENT,
        ipAddress,
        null,
      );
      this.writeAuditFile({
        event: AuditEvent.LOGIN_FAIL,
        userId: null,
        role: AuditRole.STUDENT,
        ip: ipAddress,
      });
      throw new UnauthorizedException('Kredensial salah');
    }

    this.checkLockout(student);

    const isMatch: boolean = await bcrypt.compare(
      studentSignInDto.password,
      student.password,
    );
    if (!isMatch) {
      student.failedLoginAttempts += 1;
      if (student.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
        student.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
        await this.studentService.save(student);
        await this.saveAuditLog(
          AuditEvent.LOCKED,
          student.id,
          AuditRole.STUDENT,
          ipAddress,
          null,
        );
        this.writeAuditFile({
          event: AuditEvent.LOCKED,
          userId: student.id,
          role: AuditRole.STUDENT,
          ip: ipAddress,
        });
      } else {
        await this.studentService.save(student);
      }
      await this.saveAuditLog(
        AuditEvent.LOGIN_FAIL,
        student.id,
        AuditRole.STUDENT,
        ipAddress,
        null,
      );
      this.writeAuditFile({
        event: AuditEvent.LOGIN_FAIL,
        userId: student.id,
        role: AuditRole.STUDENT,
        ip: ipAddress,
      });
      throw new UnauthorizedException('Kredensial salah');
    }

    const currentUser: ICurrentUser = {
      id: student.id,
      email: '',
      username: student.username,
      role: AuthRole.STUDENT,
    };

    const token: string = this.generateJwtToken(currentUser);
    const tokenHash: string = this.cryptoService.hashToken(token);
    student.token = tokenHash;
    student.failedLoginAttempts = 0;
    student.lockedUntil = null;
    await this.studentService.save(student);

    await this.saveAuditLog(
      AuditEvent.LOGIN_OK,
      student.id,
      AuditRole.STUDENT,
      ipAddress,
      null,
    );
    this.writeAuditFile({
      event: AuditEvent.LOGIN_OK,
      userId: student.id,
      role: AuditRole.STUDENT,
      ip: ipAddress,
    });

    return { token };
  }

  public async loginParent(
    parentSignInDto: ParentSignInDTO,
    ipAddress: string,
  ): Promise<ITokenResponse> {
    const parent: Parent | null = await this.parentService.findByEmail(
      parentSignInDto.email,
    );
    if (!parent) {
      await this.saveAuditLog(
        AuditEvent.LOGIN_FAIL,
        null,
        AuditRole.PARENT,
        ipAddress,
        null,
      );
      this.writeAuditFile({
        event: AuditEvent.LOGIN_FAIL,
        userId: null,
        role: AuditRole.PARENT,
        ip: ipAddress,
      });
      throw new UnauthorizedException('Kredensial salah');
    }

    this.checkLockout(parent);

    const isMatch: boolean = await bcrypt.compare(
      parentSignInDto.password,
      parent.password,
    );
    if (!isMatch) {
      parent.failedLoginAttempts += 1;
      if (parent.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
        parent.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
        await this.parentService.save(parent);
        await this.saveAuditLog(
          AuditEvent.LOCKED,
          parent.id,
          AuditRole.PARENT,
          ipAddress,
          null,
        );
        this.writeAuditFile({
          event: AuditEvent.LOCKED,
          userId: parent.id,
          role: AuditRole.PARENT,
          ip: ipAddress,
        });
      } else {
        await this.parentService.save(parent);
      }
      await this.saveAuditLog(
        AuditEvent.LOGIN_FAIL,
        parent.id,
        AuditRole.PARENT,
        ipAddress,
        null,
      );
      this.writeAuditFile({
        event: AuditEvent.LOGIN_FAIL,
        userId: parent.id,
        role: AuditRole.PARENT,
        ip: ipAddress,
      });
      throw new UnauthorizedException('Kredensial salah');
    }

    const currentUser: ICurrentUser = {
      id: parent.id,
      email: parent.email,
      username: parent.username,
      role: AuthRole.PARENT,
    };

    const token: string = this.generateJwtToken(currentUser);
    const tokenHash: string = this.cryptoService.hashToken(token);
    parent.token = tokenHash;
    parent.failedLoginAttempts = 0;
    parent.lockedUntil = null;
    await this.parentService.save(parent);

    await this.saveAuditLog(
      AuditEvent.LOGIN_OK,
      parent.id,
      AuditRole.PARENT,
      ipAddress,
      null,
    );
    this.writeAuditFile({
      event: AuditEvent.LOGIN_OK,
      userId: parent.id,
      role: AuditRole.PARENT,
      ip: ipAddress,
    });

    return { token };
  }

  public async logoutStudent(studentId: string): Promise<void> {
    const student: Student | null =
      await this.studentService.findById(studentId);
    if (!student) throw new UnauthorizedException();
    if (!student.token)
      throw new ForbiddenException('Forbidden, already logged out');

    student.token = null;
    await this.studentService.save(student);

    await this.saveAuditLog(
      AuditEvent.LOGOUT,
      student.id,
      AuditRole.STUDENT,
      null,
      null,
    );
    this.writeAuditFile({
      event: AuditEvent.LOGOUT,
      userId: student.id,
      role: AuditRole.STUDENT,
      ip: null,
    });
  }

  public async logoutParent(parentId: string): Promise<void> {
    const parent: Parent | null = await this.parentService.findById(parentId);
    if (!parent) throw new UnauthorizedException();
    if (!parent.token)
      throw new ForbiddenException('Forbidden, already logged out');

    parent.token = null;
    await this.parentService.save(parent);

    await this.saveAuditLog(
      AuditEvent.LOGOUT,
      parent.id,
      AuditRole.PARENT,
      null,
      null,
    );
    this.writeAuditFile({
      event: AuditEvent.LOGOUT,
      userId: parent.id,
      role: AuditRole.PARENT,
      ip: null,
    });
  }

  public generateJwtToken(user: ICurrentUser): string {
    return this.jwtService.sign(user);
  }

  public async loginAdmin(
    adminSignInDto: AdminSignInDTO,
    ipAddress: string,
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
      await this.saveAuditLog(
        AuditEvent.LOGIN_FAIL,
        null,
        AuditRole.ADMIN,
        ipAddress,
        null,
      );
      this.writeAuditFile({
        event: AuditEvent.LOGIN_FAIL,
        userId: null,
        role: AuditRole.ADMIN,
        ip: ipAddress,
      });
      throw new UnauthorizedException('Kredensial salah');
    }

    this.checkLockout(admin);

    const isMatch: boolean = await bcrypt.compare(
      adminSignInDto.password,
      admin.password,
    );
    if (!isMatch) {
      admin.failedLoginAttempts += 1;
      if (admin.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
        admin.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
        await this.adminService.save(admin);
        await this.saveAuditLog(
          AuditEvent.LOCKED,
          admin.id,
          AuditRole.ADMIN,
          ipAddress,
          null,
        );
        this.writeAuditFile({
          event: AuditEvent.LOCKED,
          userId: admin.id,
          role: AuditRole.ADMIN,
          ip: ipAddress,
        });
      } else {
        await this.adminService.save(admin);
      }
      await this.saveAuditLog(
        AuditEvent.LOGIN_FAIL,
        admin.id,
        AuditRole.ADMIN,
        ipAddress,
        null,
      );
      this.writeAuditFile({
        event: AuditEvent.LOGIN_FAIL,
        userId: admin.id,
        role: AuditRole.ADMIN,
        ip: ipAddress,
      });
      throw new UnauthorizedException('Kredensial salah');
    }

    const currentUser: ICurrentUser = {
      id: admin.id,
      email: admin.email,
      username: admin.username,
      role: AuthRole.ADMIN,
    };

    const token: string = this.generateJwtToken(currentUser);
    const tokenHash: string = this.cryptoService.hashToken(token);
    admin.token = tokenHash;
    admin.failedLoginAttempts = 0;
    admin.lockedUntil = null;
    await this.adminService.save(admin);

    await this.saveAuditLog(
      AuditEvent.LOGIN_OK,
      admin.id,
      AuditRole.ADMIN,
      ipAddress,
      null,
    );
    this.writeAuditFile({
      event: AuditEvent.LOGIN_OK,
      userId: admin.id,
      role: AuditRole.ADMIN,
      ip: ipAddress,
    });

    return { token };
  }

  public async logoutAdmin(adminId: string): Promise<void> {
    const admin: Admin | null = await this.adminService.findById(adminId);
    if (!admin) throw new UnauthorizedException();
    if (!admin.token)
      throw new ForbiddenException('Forbidden, already logged out');

    admin.token = null;
    await this.adminService.save(admin);

    await this.saveAuditLog(
      AuditEvent.LOGOUT,
      admin.id,
      AuditRole.ADMIN,
      null,
      null,
    );
    this.writeAuditFile({
      event: AuditEvent.LOGOUT,
      userId: admin.id,
      role: AuditRole.ADMIN,
      ip: null,
    });
  }

  public async loginCurator(
    curatorSignInDto: CuratorSignInDTO,
    ipAddress: string,
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
      await this.saveAuditLog(
        AuditEvent.LOGIN_FAIL,
        null,
        AuditRole.CURATOR,
        ipAddress,
        null,
      );
      this.writeAuditFile({
        event: AuditEvent.LOGIN_FAIL,
        userId: null,
        role: AuditRole.CURATOR,
        ip: ipAddress,
      });
      throw new UnauthorizedException('Kredensial salah');
    }

    this.checkLockout(curator);

    const isMatch: boolean = await bcrypt.compare(
      curatorSignInDto.password,
      curator.password,
    );
    if (!isMatch) {
      curator.failedLoginAttempts += 1;
      if (curator.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
        curator.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
        await this.curatorService.save(curator);
        await this.saveAuditLog(
          AuditEvent.LOCKED,
          curator.id,
          AuditRole.CURATOR,
          ipAddress,
          null,
        );
        this.writeAuditFile({
          event: AuditEvent.LOCKED,
          userId: curator.id,
          role: AuditRole.CURATOR,
          ip: ipAddress,
        });
      } else {
        await this.curatorService.save(curator);
      }
      await this.saveAuditLog(
        AuditEvent.LOGIN_FAIL,
        curator.id,
        AuditRole.CURATOR,
        ipAddress,
        null,
      );
      this.writeAuditFile({
        event: AuditEvent.LOGIN_FAIL,
        userId: curator.id,
        role: AuditRole.CURATOR,
        ip: ipAddress,
      });
      throw new UnauthorizedException('Kredensial salah');
    }

    const currentUser: ICurrentUser = {
      id: curator.id,
      email: curator.email,
      username: curator.username,
      role: AuthRole.CURATOR,
    };

    const token: string = this.generateJwtToken(currentUser);
    const tokenHash: string = this.cryptoService.hashToken(token);
    curator.token = tokenHash;
    curator.failedLoginAttempts = 0;
    curator.lockedUntil = null;
    await this.curatorService.save(curator);

    await this.saveAuditLog(
      AuditEvent.LOGIN_OK,
      curator.id,
      AuditRole.CURATOR,
      ipAddress,
      null,
    );
    this.writeAuditFile({
      event: AuditEvent.LOGIN_OK,
      userId: curator.id,
      role: AuditRole.CURATOR,
      ip: ipAddress,
    });

    return { token };
  }

  public async logoutCurator(curatorId: string): Promise<void> {
    const curator: Curator | null =
      await this.curatorService.findById(curatorId);
    if (!curator) throw new UnauthorizedException();
    if (!curator.token)
      throw new ForbiddenException('Forbidden, already logged out');

    curator.token = null;
    await this.curatorService.save(curator);

    await this.saveAuditLog(
      AuditEvent.LOGOUT,
      curator.id,
      AuditRole.CURATOR,
      null,
      null,
    );
    this.writeAuditFile({
      event: AuditEvent.LOGOUT,
      userId: curator.id,
      role: AuditRole.CURATOR,
      ip: null,
    });
  }

  public verifyJwtToken(token: string): ICurrentUser | null {
    try {
      return this.jwtService.verify<ICurrentUser>(token);
    } catch {
      return null;
    }
  }

  /**
   * Verify that the raw token, when hashed, matches the stored hash for the user.
   */
  public async verifyTokenHash(
    token: string,
    user: ICurrentUser,
  ): Promise<boolean> {
    const hash: string = this.cryptoService.hashToken(token);

    let entity: Teacher | Student | Parent | Admin | Curator | null = null;
    if (user.role === AuthRole.TEACHER) {
      entity = await this.teacherService.findById(user.id);
    } else if (user.role === AuthRole.STUDENT) {
      entity = await this.studentService.findById(user.id);
    } else if (user.role === AuthRole.PARENT) {
      entity = await this.parentService.findById(user.id);
    } else if (user.role === AuthRole.ADMIN) {
      entity = await this.adminService.findById(user.id);
    } else if (user.role === AuthRole.CURATOR) {
      entity = await this.curatorService.findById(user.id);
    }

    if (!entity || !entity.token) return false;
    return entity.token === hash;
  }
}
