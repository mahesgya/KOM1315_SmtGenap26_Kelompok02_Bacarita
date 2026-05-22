import { AuditEvent, AuditRole } from '../entities/auth-audit-log.entity';

export class AuthAuditLogItemDTO {
  id: number;
  userId: string | null;
  role: AuditRole | null;
  event: AuditEvent;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export class AuthAuditLogTrendPointDTO {
  label: string;
  total: number;
  loginSuccessCount: number;
  loginFailCount: number;
  lockoutCount: number;
  logoutCount: number;
}

export class AuthAuditLogSummaryDTO {
  totalEvents: number;
  loginSuccessCount: number;
  loginFailCount: number;
  logoutCount: number;
  lockoutCount: number;
  uniqueUsers: number;
  recentAlertCount: number;
  trend: AuthAuditLogTrendPointDTO[];
}

export class AuthAuditLogPaginationDTO {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export class AuthAuditLogDashboardDTO {
  filters: {
    event: AuditEvent | null;
    role: AuditRole | null;
    window: string;
  };
  summary: AuthAuditLogSummaryDTO;
  pagination: AuthAuditLogPaginationDTO;
  items: AuthAuditLogItemDTO[];
}
