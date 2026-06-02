'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Globe,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  Timer,
} from 'lucide-react';
import { Sidebar } from '@/components/sidebar';
import { MetricCard } from '@/components/metric.card';
import { ApiRequestChart } from '@/components/api-request.chart';
import { EndpointTable } from '@/components/endpoint.table';
import { ApiLogTable } from '@/components/api-log.table';
import { AuditApi } from '@/api/audit.api';
import { UnauthorizedError } from '@/api/client';
import type {
  AuditRole,
  AuditWindow,
  ApiLogDashboard,
  ApiLogQuery,
  ApiLogPagination,
} from '@/lib/types';

const WINDOW_OPTIONS: { label: string; value: AuditWindow }[] = [
  { label: '24 jam', value: '24h' },
  { label: '7 hari', value: '7d' },
  { label: '30 hari', value: '30d' },
  { label: '90 hari', value: '90d' },
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

const EMPTY_API_PAGINATION: ApiLogPagination = { page: 1, limit: 20, totalItems: 0, totalPages: 1 };

export default function ApiLogsPage() {
  const router = useRouter();
  const [apiDashboard, setApiDashboard] = useState<ApiLogDashboard | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [apiFilters, setApiFilters] = useState<{
    role: AuditRole | 'all';
    method: string;
    endpoint: string;
    window: AuditWindow;
    page: number;
  }>({ role: 'all', method: 'all', endpoint: '', window: '7d', page: 1 });

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
        setLastRefresh(new Date());
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

  const handleLogout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }, [router]);

  const lastRefreshLabel = lastRefresh
    ? lastRefresh.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '--:--:--';

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
      <Sidebar lastRefreshLabel={lastRefreshLabel} onLogout={handleLogout} />

      <main className="flex-1 overflow-y-auto">
        <header
          className="sticky top-0 z-20 px-6 py-3 flex items-center justify-between"
          style={{
            background: 'rgba(7,12,24,0.88)',
            backdropFilter: 'blur(14px)',
            borderBottom: '1px solid var(--bg-border)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <Globe size={18} className="text-cyan-400" />
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              API Request Monitor
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
              <RefreshCw size={11} className={apiLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </header>

        <div className="p-5 space-y-5">
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
                style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)', color: 'var(--text-primary)' }}
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

              <ApiLogTable
                items={apiDashboard.items}
                pagination={apiDashboard.pagination ?? EMPTY_API_PAGINATION}
                isLoading={apiLoading}
                onPreviousPage={() => setApiFilters((c) => ({ ...c, page: Math.max(1, c.page - 1) }))}
                onNextPage={() => setApiFilters((c) => ({ ...c, page: c.page + 1 }))}
              />
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
