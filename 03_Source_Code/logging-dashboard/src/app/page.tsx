'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Activity,
  LogIn,
  LogOut,
  Lock,
  Wifi,
  RefreshCw,
  Clock,
  Globe,
  CheckCircle,
  XCircle,
  Timer,
} from 'lucide-react';
import { Sidebar } from '@/components/sidebar';
import { MetricCard } from '@/components/metric.card';
import { ActivityChart } from '@/components/activity.chart';
import { DonutChart } from '@/components/donut.chart';
import { LogStream } from '@/components/log.stream';
import { SecurityAlerts } from '@/components/security.alerts';
import { LogTable } from '@/components/log.table';
import { ApiRequestChart } from '@/components/api-request.chart';
import { EndpointTable } from '@/components/endpoint.table';
import { ApiLogTable } from '@/components/api-log.table';
import { AuditApi } from '@/api/audit.api';
import { UnauthorizedError } from '@/api/client';
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
  ApiLogDashboard,
  ApiLogQuery,
  ApiLogPagination,
} from '@/lib/types';
import { EVENT_META } from '@/lib/types';

type Tab = 'overview' | 'logs' | 'api-logs';

// ─── Audit filter constants ───────────────────────────────────────────────────

const WINDOW_OPTIONS: { label: string; value: AuditWindow }[] = [
  { label: '24 jam', value: '24h' },
  { label: '7 hari', value: '7d' },
  { label: '30 hari', value: '30d' },
  { label: '90 hari', value: '90d' },
];

const EVENT_OPTIONS: { label: string; value: AuditEvent | 'all' }[] = [
  { label: 'Semua event', value: 'all' },
  { label: 'Login berhasil', value: 'LOGIN_OK' },
  { label: 'Login gagal', value: 'LOGIN_FAIL' },
  { label: 'Logout', value: 'LOGOUT' },
  { label: 'Akun terkunci', value: 'LOCKED' },
];

const ROLE_OPTIONS: { label: string; value: AuditRole | 'all' }[] = [
  { label: 'Semua peran', value: 'all' },
  { label: 'Admin', value: 'admin' },
  { label: 'Guru', value: 'teacher' },
  { label: 'Siswa', value: 'student' },
  { label: 'Orang tua', value: 'parent' },
  { label: 'Kurator', value: 'curator' },
];

const METHOD_OPTIONS: { label: string; value: string }[] = [
  { label: 'Semua method', value: 'all' },
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'PATCH', value: 'PATCH' },
  { label: 'DELETE', value: 'DELETE' },
];

const EMPTY_PAGINATION: AuditPagination = { page: 1, limit: 20, totalItems: 0, totalPages: 1 };
const EMPTY_API_PAGINATION: ApiLogPagination = { page: 1, limit: 20, totalItems: 0, totalPages: 1 };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildMetrics(dashboard: AuditDashboard | null): Metrics {
  const summary = dashboard?.summary;
  const items = dashboard?.items ?? [];
  const loginAttempts = (summary?.loginSuccessCount ?? 0) + (summary?.loginFailCount ?? 0);
  const lockedAccounts = [
    ...new Set(
      items
        .filter((item) => item.event === 'LOCKED' && item.userId)
        .map((item) => item.userId as string),
    ),
  ];
  return {
    total: summary?.totalEvents ?? 0,
    loginOk: summary?.loginSuccessCount ?? 0,
    loginFail: summary?.loginFailCount ?? 0,
    locked: summary?.lockoutCount ?? 0,
    logout: summary?.logoutCount ?? 0,
    uniqueIps: new Set(items.map((item) => item.ip).filter(Boolean)).size,
    failRate:
      loginAttempts > 0
        ? Math.round(((summary?.loginFailCount ?? 0) / loginAttempts) * 100)
        : 0,
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
    { name: 'Login Berhasil', value: metrics.loginOk,   color: EVENT_META.LOGIN_OK.color },
    { name: 'Login Gagal',    value: metrics.loginFail,  color: EVENT_META.LOGIN_FAIL.color },
    { name: 'Logout',         value: metrics.logout,     color: EVENT_META.LOGOUT.color },
    { name: 'Akun Terkunci',  value: metrics.locked,     color: EVENT_META.LOCKED.color },
  ].filter((slice) => slice.value > 0);
}

function mapItems(items: AuditDashboard['items']): LogEntry[] {
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

// ─── Component ───────────────────────────────────────────────────────────────

export default function Dashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  // ── Auth audit state ──
  const [dashboard, setDashboard] = useState<AuditDashboard | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [filters, setFilters] = useState<{
    event: AuditEvent | 'all';
    role: AuditRole | 'all';
    window: AuditWindow;
    page: number;
  }>({ event: 'all', role: 'all', window: '7d', page: 1 });

  // ── API audit state ──
  const [apiDashboard, setApiDashboard] = useState<ApiLogDashboard | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiFilters, setApiFilters] = useState<{
    role: AuditRole | 'all';
    method: string;
    endpoint: string;
    window: AuditWindow;
    page: number;
  }>({ role: 'all', method: 'all', endpoint: '', window: '7d', page: 1 });

  // ── Auth audit fetch ──
  useEffect(() => {
    let isActive = true;

    async function load() {
      setAuditLoading(true);
      const query: AuditDashboardQuery = {
        window: filters.window,
        page: filters.page,
        limit: 20,
      };
      if (filters.event !== 'all') query.event = filters.event;
      if (filters.role !== 'all') query.role = filters.role;

      try {
        const response = await AuditApi.getDashboard(query);
        if (!isActive) return;
        setDashboard(response.data);
        setAuditError(null);
        setLastRefresh(new Date());
      } catch (err) {
        if (!isActive) return;
        if (err instanceof UnauthorizedError) { router.push('/login'); return; }
        setDashboard(null);
        setAuditError(err instanceof Error ? err.message : 'Gagal memuat data audit.');
      } finally {
        if (isActive) setAuditLoading(false);
      }
    }

    load();
    const id = window.setInterval(load, 30000);
    return () => { isActive = false; window.clearInterval(id); };
  }, [filters, refreshTick, router]);

  // ── API audit fetch ──
  useEffect(() => {
    let isActive = true;

    async function load() {
      setApiLoading(true);
      const query: ApiLogQuery = {
        window: apiFilters.window,
        page: apiFilters.page,
        limit: 20,
      };
      if (apiFilters.role !== 'all') query.role = apiFilters.role;
      if (apiFilters.method !== 'all') query.method = apiFilters.method;
      if (apiFilters.endpoint.trim()) query.endpoint = apiFilters.endpoint.trim();

      try {
        const response = await AuditApi.getApiDashboard(query);
        if (!isActive) return;
        setApiDashboard(response.data);
        setApiError(null);
      } catch (err) {
        if (!isActive) return;
        if (err instanceof UnauthorizedError) { router.push('/login'); return; }
        setApiDashboard(null);
        setApiError(err instanceof Error ? err.message : 'Gagal memuat data API log.');
      } finally {
        if (isActive) setApiLoading(false);
      }
    }

    load();
    const id = window.setInterval(load, 30000);
    return () => { isActive = false; window.clearInterval(id); };
  }, [apiFilters, refreshTick, router]);

  const metrics     = useMemo(() => buildMetrics(dashboard), [dashboard]);
  const trend       = useMemo(() => buildTrendBuckets(dashboard), [dashboard]);
  const eventSlices = useMemo(() => buildEventSlices(metrics), [metrics]);
  const recentLogs  = useMemo(() => mapItems(dashboard?.items ?? []), [dashboard]);

  const handleLogout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }, [router]);

  const lastRefreshLabel = lastRefresh
    ? lastRefresh.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '--:--:--';

  const isLoading = auditLoading;
  const error = auditError;

  // ─── API log metrics ──────────────────────────────────────────────────────
  const apiSummary = apiDashboard?.summary;
  const apiTotal = apiSummary?.totalRequests ?? 0;
  const apiSuccess = apiSummary?.successCount ?? 0;
  const apiError4xx = apiSummary?.clientErrorCount ?? 0;
  const apiError5xx = apiSummary?.serverErrorCount ?? 0;
  const apiSuccessRate = apiTotal > 0 ? Math.round((apiSuccess / apiTotal) * 100) : 0;
  const apiErrorRate = apiTotal > 0 ? Math.round(((apiError4xx + apiError5xx) / apiTotal) * 100) : 0;
  const apiAvgDuration = apiSummary?.avgDurationMs ?? 0;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        lastRefreshLabel={lastRefreshLabel}
        onLogout={handleLogout}
      />

      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header
          className="sticky top-0 z-20 px-6 py-3 flex items-center justify-between"
          style={{
            background: 'rgba(7,12,24,0.88)',
            backdropFilter: 'blur(14px)',
            borderBottom: '1px solid var(--bg-border)',
          }}
        >
          <div className="flex items-center gap-2.5">
            {activeTab === 'api-logs' ? (
              <Globe size={18} className="text-cyan-400" />
            ) : (
              <Shield size={18} className="text-indigo-400" />
            )}
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {activeTab === 'overview' && 'Security Overview'}
              {activeTab === 'logs' && 'Audit Log Stream'}
              {activeTab === 'api-logs' && 'API Request Monitor'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
              <Clock size={12} />
              {lastRefreshLabel}
            </span>
            <button
              onClick={() => setRefreshTick((c) => c + 1)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)', color: 'var(--text-secondary)' }}
            >
              <RefreshCw size={11} className={(isLoading || apiLoading) ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </header>

        <div className="p-5 space-y-5">

          {/* ── Overview & Logs tabs share the same filter bar ─────────────── */}
          {(activeTab === 'overview' || activeTab === 'logs') && (
            <>
              <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
                <label className="flex flex-col gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                  Rentang waktu
                  <select
                    value={filters.window}
                    onChange={(e) => setFilters((c) => ({ ...c, window: e.target.value as AuditWindow, page: 1 }))}
                    className="rounded-lg px-3 py-2 outline-none"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)', color: 'var(--text-primary)' }}
                  >
                    {WINDOW_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </label>

                <label className="flex flex-col gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                  Event
                  <select
                    value={filters.event}
                    onChange={(e) => setFilters((c) => ({ ...c, event: e.target.value as AuditEvent | 'all', page: 1 }))}
                    className="rounded-lg px-3 py-2 outline-none"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)', color: 'var(--text-primary)' }}
                  >
                    {EVENT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </label>

                <label className="flex flex-col gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                  Peran
                  <select
                    value={filters.role}
                    onChange={(e) => setFilters((c) => ({ ...c, role: e.target.value as AuditRole | 'all', page: 1 }))}
                    className="rounded-lg px-3 py-2 outline-none"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)', color: 'var(--text-primary)' }}
                  >
                    {ROLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </label>

                <div className="card p-4 flex flex-col justify-center">
                  <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Status</span>
                  <span className="text-sm font-semibold mt-1" style={{ color: error ? '#ef4444' : '#10b981' }}>
                    {error ? 'Perlu cek env / backend' : 'Siap memuat backend'}
                  </span>
                </div>

                <div className="card p-4 flex flex-col justify-center">
                  <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Page Size</span>
                  <span className="text-sm font-semibold mt-1" style={{ color: 'var(--text-primary)' }}>
                    {dashboard?.pagination.limit ?? EMPTY_PAGINATION.limit} rows
                  </span>
                </div>
              </section>

              {error ? (
                <div className="card p-8 text-center text-sm" style={{ color: '#fca5a5', borderColor: 'rgba(239,68,68,0.35)' }}>
                  {error}
                </div>
              ) : isLoading && !dashboard ? (
                <div className="card p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                  Memuat data audit...
                </div>
              ) : (
                <>
                  {activeTab === 'overview' && dashboard && (
                    <div className="space-y-5">
                      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                        <MetricCard icon={<Activity size={15} />}  label="Total Events"    value={metrics.total.toLocaleString('id-ID')}  sub={dashboard.filters.window}                       accent="#818cf8" />
                        <MetricCard icon={<LogIn size={15} />}     label="Login Berhasil"  value={metrics.loginOk.toLocaleString('id-ID')}  sub={`${dashboard.summary.uniqueUsers} user unik`}  accent="#10b981" trend="up" />
                        <MetricCard icon={<Shield size={15} />}    label="Login Gagal"     value={metrics.loginFail.toLocaleString('id-ID')} sub={`Fail rate ${metrics.failRate}%`}               accent="#ef4444" alert={metrics.failRate > 15} />
                        <MetricCard icon={<Lock size={15} />}      label="Akun Terkunci"   value={metrics.locked.toLocaleString('id-ID')}    sub={`${metrics.lockedAccounts.length} akun di halaman ini`} accent="#f59e0b" alert={metrics.locked > 0} />
                        <MetricCard icon={<LogOut size={15} />}    label="Logout"          value={metrics.logout.toLocaleString('id-ID')}    sub="Sesi selesai"                                   accent="#6366f1" />
                        <MetricCard icon={<Wifi size={15} />}      label="IP Unik"         value={metrics.uniqueIps.toLocaleString('id-ID')} sub="Di halaman saat ini"                            accent="#22d3ee" />
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="lg:col-span-2 card p-5">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Tren Aktivitas</p>
                              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Ringkasan event dari backend sesuai filter aktif</p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                              {(['LOGIN_OK', 'LOGIN_FAIL', 'LOGOUT', 'LOCKED'] as AuditEvent[]).map((ev) => (
                                <span key={ev} className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                                  <span className="w-2 h-2 rounded-full" style={{ background: EVENT_META[ev].color }} />
                                  {EVENT_META[ev].label}
                                </span>
                              ))}
                            </div>
                          </div>
                          <ActivityChart data={trend} />
                        </div>
                        <div className="card p-5">
                          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Distribusi Events</p>
                          <p className="text-xs mt-0.5 mb-4" style={{ color: 'var(--text-muted)' }}>Berdasarkan ringkasan backend</p>
                          <DonutChart data={eventSlices} total={Math.max(metrics.total, 1)} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <SecurityAlerts dashboard={dashboard} metrics={metrics} />
                        <LogStream logs={recentLogs.slice(0, 30)} />
                      </div>
                    </div>
                  )}

                  {activeTab === 'logs' && (
                    <LogTable
                      logs={recentLogs}
                      pagination={dashboard?.pagination ?? EMPTY_PAGINATION}
                      isLoading={isLoading}
                      onPreviousPage={() => setFilters((c) => ({ ...c, page: Math.max(1, c.page - 1) }))}
                      onNextPage={() => setFilters((c) => ({ ...c, page: c.page + 1 }))}
                    />
                  )}
                </>
              )}
            </>
          )}

          {/* ── API Logs tab ──────────────────────────────────────────────── */}
          {activeTab === 'api-logs' && (
            <>
              {/* Filter bar */}
              <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <label className="flex flex-col gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                  Rentang waktu
                  <select
                    value={apiFilters.window}
                    onChange={(e) => setApiFilters((c) => ({ ...c, window: e.target.value as AuditWindow, page: 1 }))}
                    className="rounded-lg px-3 py-2 outline-none"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)', color: 'var(--text-primary)' }}
                  >
                    {WINDOW_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </label>

                <label className="flex flex-col gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                  Method
                  <select
                    value={apiFilters.method}
                    onChange={(e) => setApiFilters((c) => ({ ...c, method: e.target.value, page: 1 }))}
                    className="rounded-lg px-3 py-2 outline-none"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)', color: 'var(--text-primary)' }}
                  >
                    {METHOD_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </label>

                <label className="flex flex-col gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                  Peran
                  <select
                    value={apiFilters.role}
                    onChange={(e) => setApiFilters((c) => ({ ...c, role: e.target.value as AuditRole | 'all', page: 1 }))}
                    className="rounded-lg px-3 py-2 outline-none"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)', color: 'var(--text-primary)' }}
                  >
                    {ROLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </label>

                <label className="flex flex-col gap-2 text-sm xl:col-span-2" style={{ color: 'var(--text-muted)' }}>
                  Cari endpoint
                  <input
                    type="text"
                    value={apiFilters.endpoint}
                    onChange={(e) => setApiFilters((c) => ({ ...c, endpoint: e.target.value, page: 1 }))}
                    placeholder="/students/test-sessions…"
                    className="rounded-lg px-3 py-2 outline-none"
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--bg-border)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </label>
              </section>

              {apiError ? (
                <div className="card p-8 text-center text-sm" style={{ color: '#fca5a5', borderColor: 'rgba(239,68,68,0.35)' }}>
                  {apiError}
                </div>
              ) : apiLoading && !apiDashboard ? (
                <div className="card p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                  Memuat data API log...
                </div>
              ) : apiDashboard ? (
                <div className="space-y-5">
                  {/* Metric cards */}
                  <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                    <MetricCard
                      icon={<Globe size={15} />}
                      label="Total Request"
                      value={apiTotal.toLocaleString('id-ID')}
                      sub={apiDashboard.filters.window}
                      accent="#818cf8"
                    />
                    <MetricCard
                      icon={<CheckCircle size={15} />}
                      label="Sukses (2xx)"
                      value={apiSuccess.toLocaleString('id-ID')}
                      sub={`${apiSuccessRate}% success rate`}
                      accent="#10b981"
                      trend="up"
                    />
                    <MetricCard
                      icon={<XCircle size={15} />}
                      label="Error (4xx+5xx)"
                      value={(apiError4xx + apiError5xx).toLocaleString('id-ID')}
                      sub={`${apiErrorRate}% error rate`}
                      accent="#ef4444"
                      alert={apiErrorRate > 10}
                    />
                    <MetricCard
                      icon={<Timer size={15} />}
                      label="Avg Durasi"
                      value={`${apiAvgDuration}ms`}
                      sub="Response time rata-rata"
                      accent="#22d3ee"
                    />
                  </div>

                  {/* Trend + Endpoint table */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 card p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Tren Request API</p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Volume request per bucket waktu</p>
                        </div>
                        <div className="flex gap-3">
                          {[
                            { key: 'total',        label: 'Total',  color: '#6366f1' },
                            { key: 'successCount', label: 'Sukses', color: '#10b981' },
                            { key: 'errorCount',   label: 'Error',  color: '#ef4444' },
                          ].map((l) => (
                            <span key={l.key} className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                              <span className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                              {l.label}
                            </span>
                          ))}
                        </div>
                      </div>
                      <ApiRequestChart data={apiSummary?.trend ?? []} />
                    </div>

                    <EndpointTable summary={apiDashboard.summary} />
                  </div>

                  {/* Full log table */}
                  <ApiLogTable
                    items={apiDashboard.items}
                    pagination={apiDashboard.pagination ?? EMPTY_API_PAGINATION}
                    isLoading={apiLoading}
                    onPreviousPage={() => setApiFilters((c) => ({ ...c, page: Math.max(1, c.page - 1) }))}
                    onNextPage={() => setApiFilters((c) => ({ ...c, page: c.page + 1 }))}
                  />
                </div>
              ) : null}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
