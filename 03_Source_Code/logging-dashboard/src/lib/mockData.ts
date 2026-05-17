import type { AuditEvent, AuditRole, LogEntry, HourlyBucket, RoleBucket, EventSlice, TestCase, Metrics } from "./types";
import { EVENT_META } from "./types";

// ─── Deterministic pseudo-random ─────────────────────────────────────────────
let seed = 42;
function rand(): number {
  seed = (seed * 1664525 + 1013904223) & 0xffffffff;
  return (seed >>> 0) / 0xffffffff;
}
function pick<T>(arr: T[]): T { return arr[Math.floor(rand() * arr.length)]; }
function randInt(min: number, max: number) { return Math.floor(rand() * (max - min + 1)) + min; }

// ─── Seed data ────────────────────────────────────────────────────────────────
const ROLES: AuditRole[] = ["admin", "teacher", "student", "parent", "curator"];
const USER_IDS: Record<AuditRole, string[]> = {
  admin:   ["admin-001", "admin-002"],
  teacher: ["guru-001", "guru-002", "guru-003", "guru-004", "guru-005"],
  student: ["siswa-001", "siswa-002", "siswa-003", "siswa-004", "siswa-005", "siswa-006", "siswa-007", "siswa-008"],
  parent:  ["ortu-001", "ortu-002", "ortu-003", "ortu-004"],
  curator: ["kurator-001", "kurator-002"],
};
const IPS = [
  "192.168.1.12", "192.168.1.47", "192.168.2.103", "10.0.0.5",
  "10.0.0.18", "172.16.0.2", "172.16.0.44", "203.0.113.55",
  "198.51.100.7", "192.0.2.88", "103.28.55.14", "182.1.0.200",
];
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14) Safari/537.36",
  "Mozilla/5.0 (Linux; Android 14) Chrome Mobile/124",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17) Safari Mobile",
  "Mozilla/5.0 (X11; Ubuntu; Linux x86_64) Firefox/125",
];

// ─── Generate logs ─────────────────────────────────────────────────────────────
export function generateLogs(count = 250): LogEntry[] {
  seed = 42; // reset for determinism
  const now = Date.now();
  const logs: LogEntry[] = [];

  // Inject initial audit log init
  logs.push({
    id: "init-001",
    timestamp: new Date(now - 7 * 24 * 3600_000).toISOString(),
    event: "LOGIN_OK" as AuditEvent,
    userId: null,
    role: null,
    ip: null,
    userAgent: null,
  });

  const failCounts: Record<string, number> = {};

  for (let i = 0; i < count; i++) {
    const role = pick(ROLES);
    const userId = pick(USER_IDS[role]);
    const ip = pick(IPS);

    // Weight: 60% ok, 25% fail, 10% logout, 5% locked
    const r = rand();
    let event: AuditEvent;
    if (r < 0.60) event = "LOGIN_OK";
    else if (r < 0.85) event = "LOGIN_FAIL";
    else if (r < 0.95) event = "LOGOUT";
    else event = "LOCKED";

    // Simulate consecutive fails → LOCKED
    const key = `${role}:${userId}`;
    if (event === "LOGIN_FAIL") {
      failCounts[key] = (failCounts[key] || 0) + 1;
      if (failCounts[key] >= 5) {
        event = "LOCKED";
        failCounts[key] = 0;
      }
    }
    if (event === "LOGIN_OK") failCounts[key] = 0;

    // Spread across last 7 days with heavier recent traffic
    const hoursAgo = rand() < 0.4
      ? randInt(0, 24)          // last 24h heavier
      : randInt(24, 7 * 24);
    const ts = new Date(now - hoursAgo * 3600_000 - randInt(0, 3599_000));

    logs.push({
      id: `log-${i.toString().padStart(4, "0")}`,
      timestamp: ts.toISOString(),
      event,
      userId,
      role,
      ip: event === "LOCKED" ? ip : ip,
      userAgent: rand() > 0.2 ? pick(USER_AGENTS) : null,
    });
  }

  return logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

// ─── Metrics ──────────────────────────────────────────────────────────────────
export function computeMetrics(logs: LogEntry[]): Metrics {
  const loginOk   = logs.filter(l => l.event === "LOGIN_OK").length;
  const loginFail = logs.filter(l => l.event === "LOGIN_FAIL").length;
  const locked    = logs.filter(l => l.event === "LOCKED").length;
  const logout    = logs.filter(l => l.event === "LOGOUT").length;
  const uniqueIps = new Set(logs.map(l => l.ip).filter(Boolean)).size;
  const lockedAccounts = [...new Set(
    logs.filter(l => l.event === "LOCKED" && l.userId).map(l => l.userId!)
  )];
  return {
    total: logs.length,
    loginOk,
    loginFail,
    locked,
    logout,
    uniqueIps,
    failRate: logs.length ? Math.round((loginFail / (loginOk + loginFail || 1)) * 100) : 0,
    lockedAccounts,
  };
}

// ─── Hourly buckets (last 24 h) ───────────────────────────────────────────────
export function buildHourlyBuckets(logs: LogEntry[]): HourlyBucket[] {
  const now = Date.now();
  const buckets: HourlyBucket[] = [];
  for (let h = 23; h >= 0; h--) {
    const start = now - (h + 1) * 3600_000;
    const end   = now - h * 3600_000;
    const slice = logs.filter(l => {
      const t = new Date(l.timestamp).getTime();
      return t >= start && t < end;
    });
    const label = new Date(end).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    buckets.push({
      hour: label,
      LOGIN_OK:   slice.filter(l => l.event === "LOGIN_OK").length,
      LOGIN_FAIL: slice.filter(l => l.event === "LOGIN_FAIL").length,
      LOGOUT:     slice.filter(l => l.event === "LOGOUT").length,
      LOCKED:     slice.filter(l => l.event === "LOCKED").length,
    });
  }
  return buckets;
}

// ─── Role breakdown ───────────────────────────────────────────────────────────
export function buildRoleBuckets(logs: LogEntry[]): RoleBucket[] {
  const roles: AuditRole[] = ["admin", "teacher", "student", "parent", "curator"];
  return roles.map(role => {
    const slice = logs.filter(l => l.role === role);
    return {
      role,
      LOGIN_OK:   slice.filter(l => l.event === "LOGIN_OK").length,
      LOGIN_FAIL: slice.filter(l => l.event === "LOGIN_FAIL").length,
      LOGOUT:     slice.filter(l => l.event === "LOGOUT").length,
      LOCKED:     slice.filter(l => l.event === "LOCKED").length,
      total: slice.length,
    };
  });
}

// ─── Donut slices ─────────────────────────────────────────────────────────────
export function buildEventSlices(m: Metrics): EventSlice[] {
  return [
    { name: "Login Berhasil", value: m.loginOk,   color: EVENT_META.LOGIN_OK.color   },
    { name: "Login Gagal",    value: m.loginFail,  color: EVENT_META.LOGIN_FAIL.color },
    { name: "Logout",          value: m.logout,    color: EVENT_META.LOGOUT.color     },
    { name: "Akun Terkunci",   value: m.locked,    color: EVENT_META.LOCKED.color     },
  ].filter(s => s.value > 0);
}

// ─── Unit test results ────────────────────────────────────────────────────────
export const TEST_RESULTS: TestCase[] = [
  // Auth Guard — AAA
  { suite: "AuthGuard — AAA Authorization", name: "throw 401 when no Authorization header",           status: "pass", durationMs: 5,  category: "auth" },
  { suite: "AuthGuard — AAA Authorization", name: "throw 401 when header has no token part",          status: "pass", durationMs: 1,  category: "auth" },
  { suite: "AuthGuard — AAA Authorization", name: "throw 401 when JWT is invalid or expired",         status: "pass", durationMs: 1,  category: "auth" },
  { suite: "AuthGuard — AAA Authorization", name: "throw 401 when token hash does not match DB",      status: "pass", durationMs: 0,  category: "auth" },
  { suite: "AuthGuard — AAA Authorization", name: "throw 403 when student accesses teacher route",    status: "pass", durationMs: 1,  category: "auth" },
  { suite: "AuthGuard — AAA Authorization", name: "throw 403 when parent accesses admin route",       status: "pass", durationMs: 0,  category: "auth" },
  { suite: "AuthGuard — AAA Authorization", name: "allow access when role matches required role",     status: "pass", durationMs: 1,  category: "auth" },
  { suite: "AuthGuard — AAA Authorization", name: "allow access when ANY role is accepted",           status: "pass", durationMs: 0,  category: "auth" },
  { suite: "AuthGuard — AAA Authorization", name: "allow access when no roles required",              status: "pass", durationMs: 0,  category: "auth" },
  // Asymmetric Signature
  { suite: "AsymmetricSignatureService",    name: "instantiate and expose a PEM public key",          status: "pass", durationMs: 65, category: "crypto" },
  { suite: "AsymmetricSignatureService",    name: "sign data and verify the signature (valid case)",  status: "pass", durationMs: 63, category: "crypto" },
  { suite: "AsymmetricSignatureService",    name: "reject a tampered payload (non-repudiation)",      status: "pass", durationMs: 85, category: "crypto" },
  { suite: "AsymmetricSignatureService",    name: "reject a forged signature (invalid bytes)",        status: "pass", durationMs: 56, category: "crypto" },
  { suite: "AsymmetricSignatureService",    name: "reject an empty signature string",                 status: "pass", durationMs: 50, category: "crypto" },
  { suite: "AsymmetricSignatureService",    name: "produce different signatures for different data",  status: "pass", durationMs: 28, category: "crypto" },
  { suite: "AsymmetricSignatureService",    name: "stable signature verifiable across instances",     status: "pass", durationMs: 22, category: "crypto" },
  // TestSession Entity
  { suite: "TestSession Entity",            name: "set fields correctly",                             status: "pass", durationMs: 2,  category: "entity" },
  { suite: "TestSession Entity",            name: "compute imageAtTakenUrl correctly",                status: "pass", durationMs: 0,  category: "entity" },
  { suite: "TestSession Entity",            name: "return null for imageAtTakenUrl when no image",    status: "pass", durationMs: 0,  category: "entity" },
  { suite: "TestSession Entity",            name: "compute remainingTimeInSeconds for active session",status: "pass", durationMs: 1,  category: "entity" },
  { suite: "TestSession Entity",            name: "return 0 remainingTimeInSeconds for finished",     status: "pass", durationMs: 0,  category: "entity" },
  { suite: "TestSession Entity",            name: "return 0 remainingTimeInSeconds when exceeded",    status: "pass", durationMs: 0,  category: "entity" },
  { suite: "TestSession Entity",            name: "handle score and medal calculation right",         status: "pass", durationMs: 0,  category: "entity" },
  { suite: "TestSession Entity",            name: "handle score and medal when no stt",               status: "pass", durationMs: 1,  category: "entity" },
  // STTWordResult Entity
  { suite: "STTWordResult Entity",          name: "set fields correctly",                             status: "pass", durationMs: 5,  category: "entity" },
  { suite: "STTWordResult Entity",          name: "associate with TestSession correctly",             status: "pass", durationMs: 1,  category: "entity" },
  { suite: "STTWordResult Entity",          name: "return true when both fields are null",            status: "pass", durationMs: 0,  category: "entity" },
  { suite: "STTWordResult Entity",          name: "return false when both fields have values",        status: "pass", durationMs: 1,  category: "entity" },
  // HTTP Layer
  { suite: "HTTP Exception Filter",         name: "handle string HttpException",                      status: "pass", durationMs: 6,  category: "http" },
  { suite: "HTTP Exception Filter",         name: "handle object HttpException with string message",  status: "pass", durationMs: 1,  category: "http" },
  { suite: "HTTP Exception Filter",         name: "handle other HttpException (BadRequestException)", status: "pass", durationMs: 1,  category: "http" },
  { suite: "SuccessResponseInterceptor",    name: "return data as-is when MessageResponse",          status: "pass", durationMs: 7,  category: "http" },
  { suite: "SuccessResponseInterceptor",    name: "wrap string data into MessageResponse",            status: "pass", durationMs: 1,  category: "http" },
  { suite: "SuccessResponseInterceptor",    name: "use status code from response (201)",              status: "pass", durationMs: 1,  category: "http" },
];
