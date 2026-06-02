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
import { ApiAuditLog } from './entities/api-audit-log.entity';
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
import { ApiAuditLogQueryDTO } from './dtos/api-audit-log-query.dto';
import {
  ApiAuditLogDashboardDTO,
  ApiAuditLogItemDTO,
  ApiAuditLogSummaryDTO,
  ApiAuditLogTrendPointDTO,
} from './dtos/api-audit-log-response.dto';

const AUDIT_LOG_PATH =
  '/Users/anargyaisadhimaheswara/Documents/Semester6/KI/PBL/05_Testing/auth_activity.log';
const DEFAULT_AUDIT_WINDOW: AuditWindow = '7d';

@Injectable()
export class LoggingService {
  constructor(
    @InjectRepository(AuthAuditLog)
    private readonly auditLogRepository: Repository<AuthAuditLog>,
    @InjectRepository(ApiAuditLog)
    private readonly apiAuditLogRepository: Repository<ApiAuditLog>,
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

  // -----------------------------------------------------------------------
  // API Audit Log
  // -----------------------------------------------------------------------

  public saveApiLog(data: {
    userId: string | null;
    role: AuditRole | null;
    method: string;
    endpoint: string;
    statusCode: number | null;
    durationMs: number | null;
    ipAddress: string | null;
    userAgent: string | null;
  }): void {
    this.apiAuditLogRepository
      .save(this.apiAuditLogRepository.create(data))
      .catch(() => {});
  }

  private buildApiTrend(
    logs: ApiAuditLog[],
    window: AuditWindow,
  ): ApiAuditLogTrendPointDTO[] {
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

    const buckets = new Map<
      string,
      {
        label: string;
        total: number;
        successCount: number;
        errorCount: number;
        durations: number[];
      }
    >();

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
        successCount: 0,
        errorCount: 0,
        durations: [],
      };

      current.total += 1;
      if (log.statusCode !== null) {
        if (log.statusCode >= 200 && log.statusCode < 300)
          current.successCount += 1;
        else if (log.statusCode >= 400) current.errorCount += 1;
      }
      if (log.durationMs !== null) current.durations.push(log.durationMs);

      buckets.set(key, current);
    }

    return [...buckets.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([, value]) => ({
        label: value.label,
        total: value.total,
        successCount: value.successCount,
        errorCount: value.errorCount,
        avgDurationMs:
          value.durations.length > 0
            ? Math.round(
                value.durations.reduce((a, b) => a + b, 0) /
                  value.durations.length,
              )
            : 0,
      }));
  }

  public async getApiLogDashboard(
    query: ApiAuditLogQueryDTO,
  ): Promise<ApiAuditLogDashboardDTO> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const window = query.window ?? DEFAULT_AUDIT_WINDOW;
    const windowStart = this.getWindowStart(window);

    const baseQuery = this.apiAuditLogRepository
      .createQueryBuilder('log')
      .where('log.createdAt >= :windowStart', { windowStart });

    if (query.role) {
      baseQuery.andWhere('log.role = :role', { role: query.role });
    }
    if (query.method) {
      baseQuery.andWhere('log.method = :method', { method: query.method });
    }
    if (query.endpoint) {
      baseQuery.andWhere('log.endpoint LIKE :endpoint', {
        endpoint: `%${query.endpoint}%`,
      });
    }
    if (query.statusCode) {
      baseQuery.andWhere('log.statusCode = :statusCode', {
        statusCode: query.statusCode,
      });
    }

    const [items, totalItems, allLogs] = await Promise.all([
      baseQuery
        .clone()
        .orderBy('log.createdAt', 'DESC')
        .skip((page - 1) * limit)
        .take(limit)
        .getMany(),
      baseQuery.clone().getCount(),
      baseQuery.clone().orderBy('log.createdAt', 'ASC').getMany(),
    ]);

    const successCount = allLogs.filter(
      (l) => l.statusCode !== null && l.statusCode >= 200 && l.statusCode < 300,
    ).length;
    const clientErrorCount = allLogs.filter(
      (l) => l.statusCode !== null && l.statusCode >= 400 && l.statusCode < 500,
    ).length;
    const serverErrorCount = allLogs.filter(
      (l) => l.statusCode !== null && l.statusCode >= 500,
    ).length;
    const durations = allLogs
      .map((l) => l.durationMs)
      .filter((d): d is number => d !== null);
    const avgDurationMs =
      durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0;

    const roleMap = new Map<string, number>();
    for (const log of allLogs) {
      if (log.role) roleMap.set(log.role, (roleMap.get(log.role) ?? 0) + 1);
    }

    const methodMap = new Map<string, number>();
    for (const log of allLogs) {
      methodMap.set(log.method, (methodMap.get(log.method) ?? 0) + 1);
    }

    const endpointMap = new Map<string, number>();
    for (const log of allLogs) {
      endpointMap.set(log.endpoint, (endpointMap.get(log.endpoint) ?? 0) + 1);
    }

    const summary: ApiAuditLogSummaryDTO = {
      totalRequests: allLogs.length,
      successCount,
      clientErrorCount,
      serverErrorCount,
      avgDurationMs,
      byRole: [...roleMap.entries()]
        .map(([role, count]) => ({ role, count }))
        .sort((a, b) => b.count - a.count),
      byMethod: [...methodMap.entries()]
        .map(([method, count]) => ({ method, count }))
        .sort((a, b) => b.count - a.count),
      byEndpoint: [...endpointMap.entries()]
        .map(([endpoint, count]) => ({ endpoint, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      trend: this.buildApiTrend(allLogs, window),
    };

    return {
      filters: {
        role: query.role ?? null,
        method: query.method ?? null,
        endpoint: query.endpoint ?? null,
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
        (item): ApiAuditLogItemDTO => ({
          id: item.id,
          userId: item.userId,
          role: item.role,
          method: item.method,
          endpoint: item.endpoint,
          statusCode: item.statusCode,
          durationMs: item.durationMs,
          ipAddress: item.ipAddress,
          userAgent: item.userAgent,
          createdAt: item.createdAt,
        }),
      ),
    };
  }
}
