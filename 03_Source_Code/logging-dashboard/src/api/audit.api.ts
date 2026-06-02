import apiClient from "./client";
import type { AuditDashboardQuery, AuditDashboardResponse, ApiLogQuery, ApiLogDashboardResponse } from "@/lib/types";

export class AuditApi {
  static async getDashboard(query: AuditDashboardQuery): Promise<AuditDashboardResponse> {
    return apiClient.get<AuditDashboardResponse>("/api/audit-logs", {
      event: query.event,
      role: query.role,
      window: query.window,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    });
  }

  static async getApiDashboard(query: ApiLogQuery): Promise<ApiLogDashboardResponse> {
    return apiClient.get<ApiLogDashboardResponse>("/api/api-logs", {
      role: query.role,
      method: query.method,
      endpoint: query.endpoint,
      statusCode: query.statusCode,
      window: query.window,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    });
  }
}
