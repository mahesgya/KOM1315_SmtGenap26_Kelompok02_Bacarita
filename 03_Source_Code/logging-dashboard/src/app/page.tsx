"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Globe, RefreshCw, Clock, CheckCircle, XCircle, Timer } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { MetricCard } from "@/components/metric.card";
import { ApiRequestChart } from "@/components/api-request.chart";
import { EndpointTable } from "@/components/endpoint.table";
import { ApiLogTable } from "@/components/api-log.table";
import { AuditApi } from "@/api/audit.api";
import { UnauthorizedError } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import type {
  AuditRole,
  AuditWindow,
  ApiLogDashboard,
  ApiLogQuery,
  ApiLogPagination,
} from "@/lib/types";

const WINDOW_OPTIONS: { label: string; value: AuditWindow }[] = [
  { label: "24 jam",  value: "24h" },
  { label: "7 hari",  value: "7d" },
  { label: "30 hari", value: "30d" },
  { label: "90 hari", value: "90d" },
];

const ROLE_OPTIONS: { label: string; value: AuditRole | "all" }[] = [
  { label: "Semua peran", value: "all" },
  { label: "Admin",       value: "admin" },
  { label: "Guru",        value: "teacher" },
  { label: "Siswa",       value: "student" },
  { label: "Orang tua",   value: "parent" },
  { label: "Kurator",     value: "curator" },
];

const METHOD_OPTIONS: { label: string; value: string }[] = [
  { label: "Semua method", value: "all" },
  { label: "GET",    value: "GET" },
  { label: "POST",   value: "POST" },
  { label: "PUT",    value: "PUT" },
  { label: "PATCH",  value: "PATCH" },
  { label: "DELETE", value: "DELETE" },
];

const EMPTY_API_PAGINATION: ApiLogPagination = {
  page: 1, limit: 20, totalItems: 0, totalPages: 1,
};

const selectClass =
  "h-8 w-full rounded-lg border border-input bg-background px-2.5 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:border-ring focus:ring-ring/50 dark:bg-input/30";

export default function ApiLogsPage() {
  const router = useRouter();
  const [apiDashboard, setApiDashboard] = useState<ApiLogDashboard | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [apiFilters, setApiFilters] = useState<{
    role: AuditRole | "all";
    method: string;
    endpoint: string;
    window: AuditWindow;
    page: number;
  }>({ role: "all", method: "all", endpoint: "", window: "7d", page: 1 });

  useEffect(() => {
    let isActive = true;

    async function load() {
      setApiLoading(true);
      const query: ApiLogQuery = {
        window: apiFilters.window,
        page: apiFilters.page,
        limit: 20,
      };
      if (apiFilters.role !== "all") query.role = apiFilters.role;
      if (apiFilters.method !== "all") query.method = apiFilters.method;
      if (apiFilters.endpoint.trim()) query.endpoint = apiFilters.endpoint.trim();

      try {
        const response = await AuditApi.getApiDashboard(query);
        if (!isActive) return;
        setApiDashboard(response.data);
        setApiError(null);
        setLastRefresh(new Date());
      } catch (err) {
        if (!isActive) return;
        if (err instanceof UnauthorizedError) { router.push("/login"); return; }
        setApiDashboard(null);
        setApiError(err instanceof Error ? err.message : "Gagal memuat data API log.");
      } finally {
        if (isActive) setApiLoading(false);
      }
    }

    load();
    const id = window.setInterval(load, 30000);
    return () => { isActive = false; window.clearInterval(id); };
  }, [apiFilters, refreshTick, router]);

  const handleLogout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }, [router]);

  const lastRefreshLabel = lastRefresh
    ? lastRefresh.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "--:--:--";

  const apiSummary = apiDashboard?.summary;
  const apiTotal = apiSummary?.totalRequests ?? 0;
  const apiSuccess = apiSummary?.successCount ?? 0;
  const apiError4xx = apiSummary?.clientErrorCount ?? 0;
  const apiError5xx = apiSummary?.serverErrorCount ?? 0;
  const apiSuccessRate = apiTotal > 0 ? Math.round((apiSuccess / apiTotal) * 100) : 0;
  const apiErrorRate  = apiTotal > 0 ? Math.round(((apiError4xx + apiError5xx) / apiTotal) * 100) : 0;
  const apiAvgDuration = apiSummary?.avgDurationMs ?? 0;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar lastRefreshLabel={lastRefreshLabel} onLogout={handleLogout} />

      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="sticky top-0 z-20 px-6 py-3 flex items-center justify-between bg-background/80 backdrop-blur-md border-b border-border">
          <div className="flex items-center gap-2.5">
            <Globe size={18} className="text-cyan-500" />
            <span className="text-sm font-semibold">API Request Monitor</span>
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
              <RefreshCw size={11} className={apiLoading ? "animate-spin" : ""} />
              Refresh
            </Button>
          </div>
        </header>

        <div className="p-5 space-y-5">
          {/* Filter bar */}
          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Rentang waktu</label>
              <select
                value={apiFilters.window}
                onChange={(e) =>
                  setApiFilters((c) => ({ ...c, window: e.target.value as AuditWindow, page: 1 }))
                }
                className={selectClass}
              >
                {WINDOW_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Method</label>
              <select
                value={apiFilters.method}
                onChange={(e) =>
                  setApiFilters((c) => ({ ...c, method: e.target.value, page: 1 }))
                }
                className={selectClass}
              >
                {METHOD_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Peran</label>
              <select
                value={apiFilters.role}
                onChange={(e) =>
                  setApiFilters((c) => ({ ...c, role: e.target.value as AuditRole | "all", page: 1 }))
                }
                className={selectClass}
              >
                {ROLE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5 xl:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Cari endpoint</label>
              <Input
                type="text"
                value={apiFilters.endpoint}
                onChange={(e) =>
                  setApiFilters((c) => ({ ...c, endpoint: e.target.value, page: 1 }))
                }
                placeholder="/students/test-sessions…"
              />
            </div>
          </section>

          {apiError ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-destructive">
                {apiError}
              </CardContent>
            </Card>
          ) : apiLoading && !apiDashboard ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Memuat data API log...
              </CardContent>
            </Card>
          ) : apiDashboard ? (
            <div className="space-y-5">
              {/* Metric cards */}
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                <MetricCard
                  icon={<Globe size={15} />}
                  label="Total Request"
                  value={apiTotal.toLocaleString("id-ID")}
                  sub={apiDashboard.filters.window}
                  accent="#818cf8"
                />
                <MetricCard
                  icon={<CheckCircle size={15} />}
                  label="Sukses (2xx)"
                  value={apiSuccess.toLocaleString("id-ID")}
                  sub={`${apiSuccessRate}% success rate`}
                  accent="#10b981"
                  trend="up"
                />
                <MetricCard
                  icon={<XCircle size={15} />}
                  label="Error (4xx+5xx)"
                  value={(apiError4xx + apiError5xx).toLocaleString("id-ID")}
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

              {/* Chart + endpoints */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="lg:col-span-2 gap-0 py-0">
                  <div className="flex items-center justify-between px-5 py-4 border-b">
                    <div>
                      <p className="text-sm font-semibold">Tren Request API</p>
                      <p className="text-xs mt-0.5 text-muted-foreground">
                        Volume request per bucket waktu
                      </p>
                    </div>
                    <div className="flex gap-3">
                      {[
                        { key: "total",        label: "Total",  color: "#6366f1" },
                        { key: "successCount", label: "Sukses", color: "#10b981" },
                        { key: "errorCount",   label: "Error",  color: "#ef4444" },
                      ].map((l) => (
                        <span key={l.key} className="flex items-center gap-1 text-xs text-muted-foreground">
                          <span className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                          {l.label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="p-5">
                    <ApiRequestChart data={apiSummary?.trend ?? []} />
                  </div>
                </Card>

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
