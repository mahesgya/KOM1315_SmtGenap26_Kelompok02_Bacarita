import type {
  AuditDashboardResponse,
  AuditDashboardQuery,
} from "@/lib/types";

const API_URL_STORAGE_KEY = "bacarita.loggingDashboard.apiUrl";
const TOKEN_STORAGE_KEY = "bacarita.loggingDashboard.token";
const DEFAULT_LIMIT = 20;

function normalizeApiUrl(value: string): string {
  return value.replace(/\/+$/, "");
}

export function getStoredApiUrl(): string {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_API_URL ?? "";
  }

  const stored = window.localStorage.getItem(API_URL_STORAGE_KEY);
  return stored ?? process.env.NEXT_PUBLIC_API_URL ?? "";
}

export function setStoredApiUrl(value: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(API_URL_STORAGE_KEY, normalizeApiUrl(value));
}

export function getStoredToken(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(TOKEN_STORAGE_KEY) ?? "";
}

export function setStoredToken(value: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_STORAGE_KEY, value.trim());
}

export async function fetchAuditDashboard(
  apiUrl: string,
  token: string,
  query: AuditDashboardQuery,
): Promise<AuditDashboardResponse> {
  const baseUrl = normalizeApiUrl(apiUrl);
  const params = new URLSearchParams();

  if (query.event) params.set("event", query.event);
  if (query.role) params.set("role", query.role);
  if (query.window) params.set("window", query.window);
  params.set("page", String(query.page ?? 1));
  params.set("limit", String(query.limit ?? DEFAULT_LIMIT));

  const response = await fetch(`${baseUrl}/auth/admin/audit-logs?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token.trim()}`,
    },
    cache: "no-store",
  });

  const payload = (await response.json()) as AuditDashboardResponse | {
    success?: boolean;
    statusCode?: number;
    error?: string;
    message?: string;
  };

  if (!response.ok || !("data" in payload)) {
    const failedPayload = payload as {
      error?: string;
      message?: string;
    };
    throw new Error(failedPayload.error ?? failedPayload.message ?? "Gagal memuat data audit.");
  }

  return payload;
}
