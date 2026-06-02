import { AuditRole } from '../entities/auth-audit-log.entity';

export class ApiAuditLogItemDTO {
  id!: number;
  userId!: string | null;
  role!: AuditRole | null;
  method!: string;
  endpoint!: string;
  statusCode!: number | null;
  durationMs!: number | null;
  ipAddress!: string | null;
  userAgent!: string | null;
  createdAt!: Date;
}

export class ApiAuditLogTrendPointDTO {
  label!: string;
  total!: number;
  successCount!: number;
  errorCount!: number;
  avgDurationMs!: number;
}

export class ApiAuditLogByRoleDTO {
  role!: string;
  count!: number;
}

export class ApiAuditLogByMethodDTO {
  method!: string;
  count!: number;
}

export class ApiAuditLogByEndpointDTO {
  endpoint!: string;
  count!: number;
}

export class ApiAuditLogSummaryDTO {
  totalRequests!: number;
  successCount!: number;
  clientErrorCount!: number;
  serverErrorCount!: number;
  avgDurationMs!: number;
  byRole!: ApiAuditLogByRoleDTO[];
  byMethod!: ApiAuditLogByMethodDTO[];
  byEndpoint!: ApiAuditLogByEndpointDTO[];
  trend!: ApiAuditLogTrendPointDTO[];
}

export class ApiAuditLogPaginationDTO {
  page!: number;
  limit!: number;
  totalItems!: number;
  totalPages!: number;
}

export class ApiAuditLogDashboardDTO {
  filters!: {
    role: AuditRole | null;
    method: string | null;
    endpoint: string | null;
    window: string;
  };
  summary!: ApiAuditLogSummaryDTO;
  pagination!: ApiAuditLogPaginationDTO;
  items!: ApiAuditLogItemDTO[];
}
