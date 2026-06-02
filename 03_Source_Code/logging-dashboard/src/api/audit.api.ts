import apiClient from "./client";
import type { AuditDashboardQuery, AuditDashboardResponse } from "@/lib/types";

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
}
