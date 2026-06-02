"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Shield, Activity, LogIn, LogOut, Lock, Wifi, RefreshCw, Clock } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { MetricCard } from "@/components/metric.card";
import { ActivityChart } from "@/components/activity.chart";
import { DonutChart } from "@/components/donut.chart";
import { SecurityAlerts } from "@/components/security.alerts";
import { LogStream } from "@/components/log.stream";
import { LogTable } from "@/components/log.table";
import { AuditApi } from "@/api/audit.api";
import { UnauthorizedError } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type {
  AuditDashboard,
  AuditDashboardQuery,
  AuditEvent,
  AuditPagination,
  AuditRole,
  AuditWindow,
  EventSlice,
  HourlyBucket,
  LogEntry,
  Metrics,
} from "@/lib/types";
import { EVENT_META } from "@/lib/types";

const WINDOW_OPTIONS: { label: string; value: AuditWindow }[] = [
  { label: "24 jam",  value: "24h" },
  { label: "7 hari",  value: "7d" },
  { label: "30 hari", value: "30d" },
  { label: "90 hari", value: "90d" },
];

const EVENT_OPTIONS: { label: string; value: AuditEvent | "all" }[] = [
  { label: "Semua event",   value: "all" },
  { label: "Login berhasil", value: "LOGIN_OK" },
  { label: "Login gagal",   value: "LOGIN_FAIL" },
  { label: "Logout",        value: "LOGOUT" },
  { label: "Akun terkunci", value: "LOCKED" },
];

const ROLE_OPTIONS: { label: string; value: AuditRole | "all" }[] = [
  { label: "Semua peran", value: "all" },
  { label: "Admin",       value: "admin" },
  { label: "Guru",        value: "teacher" },
  { label: "Siswa",       value: "student" },
  { label: "Orang tua",   value: "parent" },
  { label: "Kurator",     value: "curator" },
];

const EMPTY_PAGINATION: AuditPagination = { page: 1, limit: 20, totalItems: 0, totalPages: 1 };

const selectClass =
  "h-8 w-full rounded-lg border border-input bg-background px-2.5 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:border-ring focus:ring-ring/50 dark:bg-input/30";

function buildMetrics(dashboard: AuditDashboard | null): Metrics {
  const summary = dashboard?.summary;
  const items = dashboard?.items ?? [];
  const loginAttempts = (summary?.loginSuccessCount ?? 0) + (summary?.loginFailCount ?? 0);
  const lockedAccounts = [
    ...new Set(
      items
        .filter((item) => item.event === "LOCKED" && item.userId)
        .map((item) => item.userId as string)
    ),
  ];
  return {
    total:       summary?.totalEvents ?? 0,
    loginOk:     summary?.loginSuccessCount ?? 0,
    loginFail:   summary?.loginFailCount ?? 0,
    locked:      summary?.lockoutCount ?? 0,
    logout:      summary?.logoutCount ?? 0,
    uniqueIps:   new Set(items.map((item) => item.ipAddress).filter(Boolean)).size,
    failRate:
      loginAttempts > 0
        ? Math.round(((summary?.loginFailCount ?? 0) / loginAttempts) * 100)
        : 0,
    lockedAccounts,
  };
}

function buildTrendBuckets(dashboard: AuditDashboard | null): HourlyBucket[] {
  return (dashboard?.summary.trend ?? []).map((point) => ({
    hour:       point.label,
    LOGIN_OK:   point.loginSuccessCount,
    LOGIN_FAIL: point.loginFailCount,
    LOGOUT:     point.logoutCount,
    LOCKED:     point.lockoutCount,
  }));
}

function buildEventSlices(metrics: Metrics): EventSlice[] {
  return [
    { name: "Login Berhasil", value: metrics.loginOk,   color: EVENT_META.LOGIN_OK.color },
    { name: "Login Gagal",    value: metrics.loginFail,  color: EVENT_META.LOGIN_FAIL.color },
    { name: "Logout",         value: metrics.logout,     color: EVENT_META.LOGOUT.color },
    { name: "Akun Terkunci",  value: metrics.locked,     color: EVENT_META.LOCKED.color },
  ].filter((slice) => slice.value > 0);
}

function mapItems(items: AuditDashboard["items"]): LogEntry[] {
  return items.map((item) => ({
    id:        item.id,
    timestamp: item.createdAt,
    event:     item.event,
    userId:    item.userId,
    role:      item.role,
    ip:        item.ipAddress,
    userAgent: item.userAgent,
  }));
}

export default function AuthLogsPage() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<AuditDashboard | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [filters, setFilters] = useState<{
    event: AuditEvent | "all";
    role: AuditRole | "all";
    window: AuditWindow;
    page: number;
  }>({ event: "all", role: "all", window: "7d", page: 1 });

  useEffect(() => {
    let isActive = true;

    async function load() {
      setAuditLoading(true);
      const query: AuditDashboardQuery = {
        window: filters.window,
        page: filters.page,
        limit: 20,
      };
      if (filters.event !== "all") query.event = filters.event;
      if (filters.role !== "all") query.role = filters.role;

      try {
        const response = await AuditApi.getDashboard(query);
        if (!isActive) return;
        setDashboard(response.data);
        setAuditError(null);
        setLastRefresh(new Date());
      } catch (err) {
        if (!isActive) return;
        if (err instanceof UnauthorizedError) { router.push("/login"); return; }
        setDashboard(null);
        setAuditError(err instanceof Error ? err.message : "Gagal memuat data audit.");
      } finally {
        if (isActive) setAuditLoading(false);
      }
    }

    load();
    const id = window.setInterval(load, 30000);
    return () => { isActive = false; window.clearInterval(id); };
  }, [filters, refreshTick, router]);

  const metrics     = useMemo(() => buildMetrics(dashboard), [dashboard]);
  const trend       = useMemo(() => buildTrendBuckets(dashboard), [dashboard]);
  const eventSlices = useMemo(() => buildEventSlices(metrics), [metrics]);
  const recentLogs  = useMemo(() => mapItems(dashboard?.items ?? []), [dashboard]);

  const handleLogout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }, [router]);

  const lastRefreshLabel = lastRefresh
    ? lastRefresh.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "--:--:--";

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar lastRefreshLabel={lastRefreshLabel} onLogout={handleLogout} />

      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="sticky top-0 z-20 px-6 py-3 flex items-center justify-between bg-background/80 backdrop-blur-md border-b border-border">
          <div className="flex items-center gap-2.5">
            <Shield size={18} className="text-primary" />
            <span className="text-sm font-semibold">Auth Logs Monitor</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs flex items-center gap-1.5 text-muted-foreground">
              <Clock size={12} />
              {lastRefreshLabel}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRefreshTick((c) => c + 1)}
              className="gap-1.5"
            >
              <RefreshCw size={11} className={auditLoading ? "animate-spin" : ""} />
              Refresh
            </Button>
          </div>
        </header>

        <div className="p-5 space-y-5">
          {/* Filter bar */}
          <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Rentang waktu</label>
              <select
                value={filters.window}
                onChange={(e) =>
                  setFilters((c) => ({ ...c, window: e.target.value as AuditWindow, page: 1 }))
                }
                className={selectClass}
              >
                {WINDOW_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Event</label>
              <select
                value={filters.event}
                onChange={(e) =>
                  setFilters((c) => ({ ...c, event: e.target.value as AuditEvent | "all", page: 1 }))
                }
                className={selectClass}
              >
                {EVENT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Peran</label>
              <select
                value={filters.role}
                onChange={(e) =>
                  setFilters((c) => ({ ...c, role: e.target.value as AuditRole | "all", page: 1 }))
                }
                className={selectClass}
              >
                {ROLE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <Card>
              <CardContent className="py-3 flex flex-col justify-center h-full">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Status
                </span>
                <span
                  className={
                    "text-sm font-semibold mt-1 " +
                    (auditError ? "text-destructive" : "text-emerald-500")
                  }
                >
                  {auditError ? "Perlu cek env / backend" : "Siap memuat backend"}
                </span>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-3 flex flex-col justify-center h-full">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Page Size
                </span>
                <span className="text-sm font-semibold mt-1">
                  {dashboard?.pagination.limit ?? EMPTY_PAGINATION.limit} rows
                </span>
              </CardContent>
            </Card>
          </section>

          {auditError ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-destructive">
                {auditError}
              </CardContent>
            </Card>
          ) : auditLoading && !dashboard ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Memuat data audit...
              </CardContent>
            </Card>
          ) : dashboard ? (
            <div className="space-y-5">
              {/* Metric cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                <MetricCard icon={<Activity size={15} />}  label="Total Events"   value={metrics.total.toLocaleString("id-ID")}    sub={dashboard.filters.window}                              accent="#818cf8" />
                <MetricCard icon={<LogIn size={15} />}     label="Login Berhasil" value={metrics.loginOk.toLocaleString("id-ID")}   sub={`${dashboard.summary.uniqueUsers} user unik`}          accent="#10b981" trend="up" />
                <MetricCard icon={<Shield size={15} />}    label="Login Gagal"    value={metrics.loginFail.toLocaleString("id-ID")}  sub={`Fail rate ${metrics.failRate}%`}                      accent="#ef4444" alert={metrics.failRate > 15} />
                <MetricCard icon={<Lock size={15} />}      label="Akun Terkunci"  value={metrics.locked.toLocaleString("id-ID")}    sub={`${metrics.lockedAccounts.length} akun di halaman ini`} accent="#f59e0b" alert={metrics.locked > 0} />
                <MetricCard icon={<LogOut size={15} />}    label="Logout"         value={metrics.logout.toLocaleString("id-ID")}    sub="Sesi selesai"                                           accent="#6366f1" />
                <MetricCard icon={<Wifi size={15} />}      label="IP Unik"        value={metrics.uniqueIps.toLocaleString("id-ID")} sub="Di halaman saat ini"                                    accent="#22d3ee" />
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="lg:col-span-2 gap-0 py-0">
                  <div className="flex items-center justify-between px-5 py-4 border-b">
                    <div>
                      <p className="text-sm font-semibold">Tren Aktivitas</p>
                      <p className="text-xs mt-0.5 text-muted-foreground">
                        Ringkasan event dari backend sesuai filter aktif
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {(["LOGIN_OK", "LOGIN_FAIL", "LOGOUT", "LOCKED"] as AuditEvent[]).map((ev) => (
                        <span key={ev} className="flex items-center gap-1 text-xs text-muted-foreground">
                          <span className="w-2 h-2 rounded-full" style={{ background: EVENT_META[ev].color }} />
                          {EVENT_META[ev].label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="p-5">
                    <ActivityChart data={trend} />
                  </div>
                </Card>

                <Card className="gap-0 py-0">
                  <div className="px-5 py-4 border-b">
                    <p className="text-sm font-semibold">Distribusi Events</p>
                    <p className="text-xs mt-0.5 text-muted-foreground">
                      Berdasarkan ringkasan backend
                    </p>
                  </div>
                  <div className="p-5">
                    <DonutChart data={eventSlices} total={Math.max(metrics.total, 1)} />
                  </div>
                </Card>
              </div>

              {/* Security alerts + log stream */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <SecurityAlerts dashboard={dashboard} metrics={metrics} />
                <LogStream logs={recentLogs.slice(0, 30)} />
              </div>

              {/* Full log table */}
              <LogTable
                logs={recentLogs}
                pagination={dashboard.pagination ?? EMPTY_PAGINATION}
                isLoading={auditLoading}
                onPreviousPage={() => setFilters((c) => ({ ...c, page: Math.max(1, c.page - 1) }))}
                onNextPage={() => setFilters((c) => ({ ...c, page: c.page + 1 }))}
              />
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
