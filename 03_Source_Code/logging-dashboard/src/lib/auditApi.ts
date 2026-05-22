import type {
  AuditDashboardResponse,
  AuditDashboardQuery,
} from "@/lib/types";

export async function fetchAuditDashboard(
  query: AuditDashboardQuery,
): Promise<AuditDashboardResponse> {
  const params = new URLSearchParams();

  if (query.event) params.set("event", query.event);
  if (query.role) params.set("role", query.role);
  if (query.window) params.set("window", query.window);
  params.set("page", String(query.page ?? 1));
  params.set("limit", String(query.limit ?? 20));

  const response = await fetch(`/api/audit-logs?${params.toString()}`, {
    cache: "no-store",
  });

  const payload = (await response.json()) as AuditDashboardResponse | {
    error?: string;
    message?: string;
  };

  if (!response.ok || !("data" in payload)) {
    const failedPayload = payload as {
      error?: string;
      message?: string;
    };

    throw new Error(
      failedPayload.error ??
        failedPayload.message ??
        "Gagal memuat data audit.",
    );
  }

  return payload;
}
