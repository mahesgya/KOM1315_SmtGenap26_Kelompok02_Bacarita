export type AuditEvent = "LOGIN_OK" | "LOGIN_FAIL" | "LOGOUT" | "LOCKED";
export type AuditRole = "admin" | "teacher" | "student" | "parent" | "curator";
export type AuditWindow = "24h" | "7d" | "30d" | "90d";

export interface LogEntry {
  id: string | number;
  timestamp: string;
  event: AuditEvent;
  userId: string | null;
  role: AuditRole | null;
  ip: string | null;
  userAgent: string | null;
}

export interface Metrics {
  total: number;
  loginOk: number;
  loginFail: number;
  locked: number;
  logout: number;
  uniqueIps: number;
  failRate: number;
  lockedAccounts: string[];
}

export interface HourlyBucket {
  hour: string;
  LOGIN_OK: number;
  LOGIN_FAIL: number;
  LOGOUT: number;
  LOCKED: number;
}

export interface RoleBucket {
  role: AuditRole;
  LOGIN_OK: number;
  LOGIN_FAIL: number;
  LOGOUT: number;
  LOCKED: number;
  total: number;
}

export interface EventSlice {
  name: string;
  value: number;
  color: string;
}

export interface AuditTrendPoint {
  label: string;
  total: number;
  loginSuccessCount: number;
  loginFailCount: number;
  lockoutCount: number;
  logoutCount: number;
}

export interface AuditPagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface AuditDashboard {
  filters: {
    event: AuditEvent | null;
    role: AuditRole | null;
    window: AuditWindow;
  };
  summary: {
    totalEvents: number;
    loginSuccessCount: number;
    loginFailCount: number;
    logoutCount: number;
    lockoutCount: number;
    uniqueUsers: number;
    recentAlertCount: number;
    trend: AuditTrendPoint[];
  };
  pagination: AuditPagination;
  items: LogEntry[];
}

export interface AuditDashboardResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: AuditDashboard;
}

export interface AuditDashboardQuery {
  event?: AuditEvent;
  role?: AuditRole;
  window?: AuditWindow;
  page?: number;
  limit?: number;
}

export const EVENT_META: Record<AuditEvent, { label: string; color: string; dim: string; bg: string }> = {
  LOGIN_OK:   { label: "Login Berhasil", color: "#10b981", dim: "#064e3b", bg: "rgba(16,185,129,0.12)" },
  LOGIN_FAIL: { label: "Login Gagal",    color: "#ef4444", dim: "#7f1d1d", bg: "rgba(239,68,68,0.12)" },
  LOGOUT:     { label: "Logout",          color: "#6366f1", dim: "#312e81", bg: "rgba(99,102,241,0.12)" },
  LOCKED:     { label: "Akun Terkunci",   color: "#f59e0b", dim: "#78350f", bg: "rgba(245,158,11,0.12)" },
};

export const ROLE_META: Record<AuditRole, { label: string; color: string }> = {
  admin:   { label: "Admin",     color: "#8b5cf6" },
  teacher: { label: "Guru",      color: "#3b82f6" },
  student: { label: "Siswa",     color: "#10b981" },
  parent:  { label: "Orang Tua", color: "#f97316" },
  curator: { label: "Kurator",   color: "#ec4899" },
};
