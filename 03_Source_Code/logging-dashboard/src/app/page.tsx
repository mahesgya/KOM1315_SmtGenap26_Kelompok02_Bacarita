"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import {
  Shield,
  Activity,
  LogIn,
  LogOut,
  Lock,
  Wifi,
  RefreshCw,
  Clock,
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { MetricCard } from "@/components/MetricCard";
import { ActivityChart } from "@/components/ActivityChart";
import { DonutChart } from "@/components/DonutChart";
import { LogStream } from "@/components/LogStream";
import { SecurityAlerts } from "@/components/SecurityAlerts";
import { LogTable } from "@/components/LogTable";
import {
  fetchAuditDashboard,
  getStoredApiUrl,
  getStoredToken,
  setStoredApiUrl,
  setStoredToken,
} from "@/lib/auditApi";
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

type Tab = "overview" | "logs";

const WINDOW_OPTIONS: { label: string; value: AuditWindow }[] = [
  { label: "24 jam", value: "24h" },
  { label: "7 hari", value: "7d" },
  { label: "30 hari", value: "30d" },
  { label: "90 hari", value: "90d" },
];

const EVENT_OPTIONS: { label: string; value: AuditEvent | "all" }[] = [
  { label: "Semua event", value: "all" },
  { label: "Login berhasil", value: "LOGIN_OK" },
  { label: "Login gagal", value: "LOGIN_FAIL" },
  { label: "Logout", value: "LOGOUT" },
  { label: "Akun terkunci", value: "LOCKED" },
];

const ROLE_OPTIONS: { label: string; value: AuditRole | "all" }[] = [
  { label: "Semua peran", value: "all" },
  { label: "Admin", value: "admin" },
  { label: "Guru", value: "teacher" },
  { label: "Siswa", value: "student" },
  { label: "Orang tua", value: "parent" },
  { label: "Kurator", value: "curator" },
];

const EMPTY_PAGINATION: AuditPagination = {
  page: 1,
  limit: 20,
  totalItems: 0,
  totalPages: 1,
};

function buildMetrics(dashboard: AuditDashboard | null): Metrics {
  const summary = dashboard?.summary;
  const items = dashboard?.items ?? [];
  const loginAttempts = (summary?.loginSuccessCount ?? 0) + (summary?.loginFailCount ?? 0);
  const lockedAccounts = [...new Set(
    items.filter((item) => item.event === "LOCKED" && item.userId).map((item) => item.userId as string),
  )];

  return {
    total: summary?.totalEvents ?? 0,
    loginOk: summary?.loginSuccessCount ?? 0,
    loginFail: summary?.loginFailCount ?? 0,
    locked: summary?.lockoutCount ?? 0,
    logout: summary?.logoutCount ?? 0,
    uniqueIps: new Set(items.map((item) => item.ip).filter(Boolean)).size,
    failRate: loginAttempts > 0 ? Math.round(((summary?.loginFailCount ?? 0) / loginAttempts) * 100) : 0,
    lockedAccounts,
  };
}

function buildTrendBuckets(dashboard: AuditDashboard | null): HourlyBucket[] {
  return (dashboard?.summary.trend ?? []).map((point) => ({
    hour: point.label,
    LOGIN_OK: point.loginSuccessCount,
    LOGIN_FAIL: point.loginFailCount,
    LOGOUT: point.logoutCount,
    LOCKED: point.lockoutCount,
  }));
}

function buildEventSlices(metrics: Metrics): EventSlice[] {
  return [
    { name: "Login Berhasil", value: metrics.loginOk, color: EVENT_META.LOGIN_OK.color },
    { name: "Login Gagal", value: metrics.loginFail, color: EVENT_META.LOGIN_FAIL.color },
    { name: "Logout", value: metrics.logout, color: EVENT_META.LOGOUT.color },
    { name: "Akun Terkunci", value: metrics.locked, color: EVENT_META.LOCKED.color },
  ].filter((slice) => slice.value > 0);
}

function mapItems(items: AuditDashboard["items"]): LogEntry[] {
  return items.map((item) => ({
    id: item.id,
    timestamp: item.timestamp,
    event: item.event,
    userId: item.userId,
    role: item.role,
    ip: item.ip,
    userAgent: item.userAgent,
  }));
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [dashboard, setDashboard] = useState<AuditDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [apiUrlInput, setApiUrlInput] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [connection, setConnection] = useState<{ apiUrl: string; token: string }>({
    apiUrl: "",
    token: "",
  });
  const [filters, setFilters] = useState<{
    event: AuditEvent | "all";
    role: AuditRole | "all";
    window: AuditWindow;
    page: number;
  }>({
    event: "all",
    role: "all",
    window: "7d",
    page: 1,
  });

  useEffect(() => {
    const storedApiUrl = getStoredApiUrl();
    const storedToken = getStoredToken();

    startTransition(() => {
      setApiUrlInput(storedApiUrl);
      setTokenInput(storedToken);
      setConnection({
        apiUrl: storedApiUrl,
        token: storedToken,
      });
    });
  }, []);

  useEffect(() => {
    if (!connection.apiUrl || !connection.token) return;

    let isActive = true;

    async function loadDashboard() {
      setIsLoading(true);
      const query: AuditDashboardQuery = {
        window: filters.window,
        page: filters.page,
        limit: 20,
      };

      if (filters.event !== "all") query.event = filters.event;
      if (filters.role !== "all") query.role = filters.role;

      try {
        const response = await fetchAuditDashboard(connection.apiUrl, connection.token, query);
        if (!isActive) return;
        setDashboard(response.data);
        setError(null);
        setLastRefresh(new Date());
      } catch (loadError) {
        if (!isActive) return;
        setDashboard(null);
        setError(loadError instanceof Error ? loadError.message : "Gagal memuat data audit.");
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    loadDashboard();
    const intervalId = window.setInterval(loadDashboard, 30000);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, [connection, filters]);

  const metrics = useMemo(() => buildMetrics(dashboard), [dashboard]);
  const trend = useMemo(() => buildTrendBuckets(dashboard), [dashboard]);
  const eventSlices = useMemo(() => buildEventSlices(metrics), [metrics]);
  const recentLogs = useMemo(() => mapItems(dashboard?.items ?? []), [dashboard]);

  const lastRefreshLabel = lastRefresh
    ? lastRefresh.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "--:--:--";

  const handleConnect = () => {
    const normalizedApiUrl = apiUrlInput.trim().replace(/\/+$/, "");
    const trimmedToken = tokenInput.trim();
    setStoredApiUrl(normalizedApiUrl);
    setStoredToken(trimmedToken);
    setFilters((current) => ({ ...current, page: 1 }));
    setConnection({ apiUrl: normalizedApiUrl, token: trimmedToken });
  };

  const canFetch = Boolean(connection.apiUrl && connection.token);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-base)" }}>
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} lastRefreshLabel={lastRefreshLabel} />

      <main className="flex-1 overflow-y-auto">
        <header
          className="sticky top-0 z-20 px-6 py-3 flex items-center justify-between"
          style={{
            background: "rgba(7,12,24,0.88)",
            backdropFilter: "blur(14px)",
            borderBottom: "1px solid var(--bg-border)",
          }}
        >
          <div className="flex items-center gap-2.5">
            <Shield size={18} className="text-indigo-400" />
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {activeTab === "overview" && "Security Overview"}
              {activeTab === "logs" && "Audit Log Stream"}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
              <Clock size={12} />
              {lastRefreshLabel}
            </span>
            <button
              onClick={handleConnect}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--bg-border)",
                color: "var(--text-secondary)",
              }}
            >
              <RefreshCw size={11} className={isLoading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </header>

        <div className="p-5 space-y-5">
          <section className="card p-5">
            <div className="grid gap-3 lg:grid-cols-[1.1fr_1.4fr_1fr]">
              <label className="flex flex-col gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                API URL
                <input
                  type="text"
                  value={apiUrlInput}
                  onChange={(event) => setApiUrlInput(event.target.value)}
                  placeholder="http://localhost:3001"
                  className="rounded-lg px-3 py-2 outline-none"
                  style={{ background: "var(--bg-surface)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }}
                />
              </label>

              <label className="flex flex-col gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                Bearer Token Admin
                <input
                  type="password"
                  value={tokenInput}
                  onChange={(event) => setTokenInput(event.target.value)}
                  placeholder="Paste JWT admin"
                  className="rounded-lg px-3 py-2 outline-none"
                  style={{ background: "var(--bg-surface)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }}
                />
              </label>

              <div className="flex items-end">
                <button
                  onClick={handleConnect}
                  className="w-full rounded-lg px-4 py-2 text-sm font-medium transition-opacity hover:opacity-80"
                  style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff" }}
                >
                  Simpan koneksi
                </button>
              </div>
            </div>
          </section>

          <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
            <label className="flex flex-col gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
              Rentang waktu
              <select
                value={filters.window}
                onChange={(event) => setFilters((current) => ({ ...current, window: event.target.value as AuditWindow, page: 1 }))}
                className="rounded-lg px-3 py-2 outline-none"
                style={{ background: "var(--bg-card)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }}
              >
                {WINDOW_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
              Event
              <select
                value={filters.event}
                onChange={(event) => setFilters((current) => ({ ...current, event: event.target.value as AuditEvent | "all", page: 1 }))}
                className="rounded-lg px-3 py-2 outline-none"
                style={{ background: "var(--bg-card)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }}
              >
                {EVENT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
              Peran
              <select
                value={filters.role}
                onChange={(event) => setFilters((current) => ({ ...current, role: event.target.value as AuditRole | "all", page: 1 }))}
                className="rounded-lg px-3 py-2 outline-none"
                style={{ background: "var(--bg-card)", border: "1px solid var(--bg-border)", color: "var(--text-primary)" }}
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <div className="card p-4 flex flex-col justify-center">
              <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Status</span>
              <span className="text-sm font-semibold mt-1" style={{ color: canFetch ? "#10b981" : "#f59e0b" }}>
                {canFetch ? "Siap memuat backend" : "Koneksi belum lengkap"}
              </span>
            </div>

            <div className="card p-4 flex flex-col justify-center">
              <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Page Size</span>
              <span className="text-sm font-semibold mt-1" style={{ color: "var(--text-primary)" }}>
                {dashboard?.pagination.limit ?? EMPTY_PAGINATION.limit} rows
              </span>
            </div>
          </section>

          {!canFetch ? (
            <div className="card p-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
              Isi API URL dan token admin untuk memuat dashboard audit dari backend Bacarita.
            </div>
          ) : error ? (
            <div className="card p-8 text-center text-sm" style={{ color: "#fca5a5", borderColor: "rgba(239,68,68,0.35)" }}>
              {error}
            </div>
          ) : isLoading && !dashboard ? (
            <div className="card p-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
              Memuat data audit...
            </div>
          ) : (
            <>
              {activeTab === "overview" && dashboard && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                    <MetricCard
                      icon={<Activity size={15} />}
                      label="Total Events"
                      value={metrics.total.toLocaleString("id-ID")}
                      sub={dashboard.filters.window}
                      accent="#818cf8"
                    />
                    <MetricCard
                      icon={<LogIn size={15} />}
                      label="Login Berhasil"
                      value={metrics.loginOk.toLocaleString("id-ID")}
                      sub={`${dashboard.summary.uniqueUsers} user unik`}
                      accent="#10b981"
                      trend="up"
                    />
                    <MetricCard
                      icon={<Shield size={15} />}
                      label="Login Gagal"
                      value={metrics.loginFail.toLocaleString("id-ID")}
                      sub={`Fail rate ${metrics.failRate}%`}
                      accent="#ef4444"
                      alert={metrics.failRate > 15}
                    />
                    <MetricCard
                      icon={<Lock size={15} />}
                      label="Akun Terkunci"
                      value={metrics.locked.toLocaleString("id-ID")}
                      sub={`${metrics.lockedAccounts.length} akun di halaman ini`}
                      accent="#f59e0b"
                      alert={metrics.locked > 0}
                    />
                    <MetricCard
                      icon={<LogOut size={15} />}
                      label="Logout"
                      value={metrics.logout.toLocaleString("id-ID")}
                      sub="Sesi selesai"
                      accent="#6366f1"
                    />
                    <MetricCard
                      icon={<Wifi size={15} />}
                      label="IP Unik"
                      value={metrics.uniqueIps.toLocaleString("id-ID")}
                      sub="Di halaman saat ini"
                      accent="#22d3ee"
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 card p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                            Tren Aktivitas
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                            Ringkasan event dari backend sesuai filter aktif
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {(["LOGIN_OK", "LOGIN_FAIL", "LOGOUT", "LOCKED"] as AuditEvent[]).map((event) => (
                            <span key={event} className="flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
                              <span className="w-2 h-2 rounded-full" style={{ background: EVENT_META[event].color }} />
                              {EVENT_META[event].label}
                            </span>
                          ))}
                        </div>
                      </div>
                      <ActivityChart data={trend} />
                    </div>
                    <div className="card p-5">
                      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Distribusi Events</p>
                      <p className="text-xs mt-0.5 mb-4" style={{ color: "var(--text-muted)" }}>
                        Berdasarkan ringkasan backend
                      </p>
                      <DonutChart data={eventSlices} total={Math.max(metrics.total, 1)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <SecurityAlerts dashboard={dashboard} metrics={metrics} />
                    <LogStream logs={recentLogs.slice(0, 30)} />
                  </div>
                </div>
              )}

              {activeTab === "logs" && (
                <LogTable
                  logs={recentLogs}
                  pagination={dashboard?.pagination ?? EMPTY_PAGINATION}
                  isLoading={isLoading}
                  onPreviousPage={() => setFilters((current) => ({ ...current, page: Math.max(1, current.page - 1) }))}
                  onNextPage={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
