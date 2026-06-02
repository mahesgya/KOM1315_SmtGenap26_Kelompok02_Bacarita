import {
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as fs from 'fs';
import { Repository } from 'typeorm';
import {
  AuthAuditLog,
  AuditEvent,
  AuditRole,
} from './entities/auth-audit-log.entity';
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
const DEFAULT_AUDIT_WINDOW: AuditWindow = '7d';

@Injectable()
export class LoggingService {
  constructor(
    @InjectRepository(AuthAuditLog)
    private readonly auditLogRepository: Repository<AuthAuditLog>,
    private readonly configService: ConfigService,
  ) {}

  public writeAuditFile(entry: {
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

  public async saveAuditLog(
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

  private validateAuditDashboardAccessKey(accessKey?: string): void {
    const configuredAccessKey = this.configService.get<string>(
      'app.auditDashboard.accessKey',
    );

    if (!configuredAccessKey) {
      throw new ServiceUnavailableException(
        'Dashboard audit standalone belum dikonfigurasi. Set AUDIT_DASHBOARD_ACCESS_KEY di backend.',
      );
    }

    if (!accessKey || accessKey !== configuredAccessKey) {
      throw new ForbiddenException(
        'Dashboard audit standalone membutuhkan access key yang valid.',
      );
    }
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

  public async getAuditLogDashboardForStandalone(
    query: AuthAuditLogQueryDTO,
    accessKey?: string,
  ): Promise<AuthAuditLogDashboardDTO> {
    this.validateAuditDashboardAccessKey(accessKey);
    return this.getAuditLogDashboard(query);
  }
}
