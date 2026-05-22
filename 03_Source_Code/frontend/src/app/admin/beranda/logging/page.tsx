"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import AdminServices from "@/services/admin.services";
import {
  AuditEventType,
  AuditRoleType,
  AuditWindowType,
  IAuthAuditLogDashboard,
  IAuthAuditLogQuery,
} from "@/types/admin.types";
import { ErrorPayload } from "@/types/general.types";
import {
  SECURITY_COVERAGE_META,
  SECURITY_COVERAGE_SECTIONS,
} from "@/lib/admin/security-coverage";

const WINDOW_OPTIONS: { label: string; value: AuditWindowType }[] = [
  { label: "24 jam", value: "24h" },
  { label: "7 hari", value: "7d" },
  { label: "30 hari", value: "30d" },
  { label: "90 hari", value: "90d" },
];

const EVENT_OPTIONS: { label: string; value: AuditEventType | "all" }[] = [
  { label: "Semua event", value: "all" },
  { label: "Login berhasil", value: "LOGIN_OK" },
  { label: "Login gagal", value: "LOGIN_FAIL" },
  { label: "Logout", value: "LOGOUT" },
  { label: "Akun terkunci", value: "LOCKED" },
];

const ROLE_OPTIONS: { label: string; value: AuditRoleType | "all" }[] = [
  { label: "Semua peran", value: "all" },
  { label: "Admin", value: "admin" },
  { label: "Kurator", value: "curator" },
  { label: "Guru", value: "teacher" },
  { label: "Orang tua", value: "parent" },
  { label: "Siswa", value: "student" },
];

function formatEventLabel(event: AuditEventType) {
  switch (event) {
    case "LOGIN_OK":
      return "Login berhasil";
    case "LOGIN_FAIL":
      return "Login gagal";
    case "LOGOUT":
      return "Logout";
    case "LOCKED":
      return "Akun terkunci";
    default:
      return event;
  }
}

function formatRoleLabel(role: AuditRoleType | null) {
  switch (role) {
    case "admin":
      return "Admin";
    case "curator":
      return "Kurator";
    case "teacher":
      return "Guru";
    case "parent":
      return "Orang tua";
    case "student":
      return "Siswa";
    default:
      return "Tidak diketahui";
  }
}

export default function AdminLoggingPage() {
  const dispatch = useDispatch();
  const [dashboard, setDashboard] = useState<IAuthAuditLogDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<{
    event: AuditEventType | "all";
    role: AuditRoleType | "all";
    window: AuditWindowType;
    page: number;
  }>({
    event: "all",
    role: "all",
    window: "7d",
    page: 1,
  });

  useEffect(() => {
    const fetchAuditLogs = async () => {
      const query: IAuthAuditLogQuery = {
        window: filters.window,
        page: filters.page,
        limit: 10,
      };

      if (filters.event !== "all") {
        query.event = filters.event;
      }

      if (filters.role !== "all") {
        query.role = filters.role;
      }

      const response = await AdminServices.GetAuditLogs(query, dispatch);
      if (response.success) {
        setDashboard(response.data);
        setError(null);
        return;
      }

      setError((response as ErrorPayload).error);
    };

    fetchAuditLogs();
  }, [dispatch, filters]);

  const trendBars = useMemo(() => {
    const points = dashboard?.summary.trend ?? [];
    const maxValue = Math.max(...points.map((point) => point.total), 1);

    return points.map((point) => ({
      ...point,
      height: `${Math.max((point.total / maxValue) * 100, point.total > 0 ? 12 : 0)}%`,
    }));
  }, [dashboard]);

  const insights = useMemo(() => {
    if (!dashboard) return [];

    const summary = dashboard.summary;
    const failureRate =
      summary.totalEvents === 0
        ? 0
        : Math.round((summary.loginFailCount / summary.totalEvents) * 100);

    return [
      `Ada ${summary.recentAlertCount} alert login gagal atau akun terkunci dalam 24 jam terakhir.`,
      `${summary.uniqueUsers} akun unik tercatat pada jendela ${dashboard.filters.window}.`,
      `Proporsi login gagal pada hasil filter saat ini adalah ${failureRate}%.`,
    ];
  }, [dashboard]);

  return (
    <div className="h-full w-full">
      <div className="mx-auto flex h-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold text-[#4A2C19]">Keamanan & Audit Login</h1>
          <p className="max-w-2xl text-sm text-[#8A5B3D]">
            Pantau aktivitas autentikasi internal dari data audit backend, termasuk tren, alert terbaru, dan riwayat detail per event.
          </p>
        </div>

        <section className="rounded-2xl border border-[#DE954F] bg-[#FFF8EC] p-5 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#4A2C19]">Cakupan AAA</h2>
              <p className="mt-1 max-w-3xl text-sm text-[#8A5B3D]">
                Dokumentasi kontrol keamanan untuk {SECURITY_COVERAGE_META.aaaLabel}. Bagian ini menjelaskan kontrol yang diuji dan sumber implementasi yang menjadi dasar dashboard ini.
              </p>
            </div>
            <div className="rounded-xl border border-[#F0C89A] bg-[#FFF3E2] px-4 py-3 text-xs text-[#6B4A32]">
              <div>{SECURITY_COVERAGE_META.unitTestCount} unit test AuthGuard</div>
              <div>{SECURITY_COVERAGE_META.adminE2eCoverageAreas}+ skenario e2e admin auth</div>
              <div>{SECURITY_COVERAGE_META.auditedEvents.join(" · ")} dicatat</div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {SECURITY_COVERAGE_SECTIONS.map((section) => (
              <section key={section.id} className="rounded-2xl border border-[#F0D7B6] bg-[#FFFCF7] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-[#B07A4A]">{section.shortLabel}</div>
                    <h3 className="mt-1 text-base font-semibold text-[#4A2C19]">{section.title}</h3>
                  </div>
                  <span className="rounded-full bg-[#F7E8D5] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#8A5B3D]">
                    {section.status}
                  </span>
                </div>

                <p className="mt-3 text-sm leading-6 text-[#6B4A32]">{section.summary}</p>

                <div className="mt-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#B07A4A]">Kontrol Terdokumentasi</div>
                  <div className="mt-2 space-y-2">
                    {section.controls.map((control) => (
                      <div key={control} className="rounded-xl border border-[#F3E1CA] bg-[#FFF8EC] p-3 text-sm text-[#5C3B27]">
                        {control}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#B07A4A]">Sumber Bukti</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {section.evidence.map((item) => (
                      <span key={item} className="rounded-full border border-[#F0C89A] bg-[#FFF3E2] px-3 py-1 text-[11px] text-[#6B4A32]">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </section>
            ))}
          </div>
        </section>

        <div className="grid gap-3 md:grid-cols-4">
          <label className="flex flex-col gap-2 text-sm text-[#6B4A32]">
            Rentang waktu
            <select
              value={filters.window}
              onChange={(event) => setFilters((current) => ({ ...current, window: event.target.value as AuditWindowType, page: 1 }))}
              className="rounded-xl border border-[#DE954F] bg-[#FFF8EC] px-3 py-2 text-sm text-[#4A2C19] outline-none"
            >
              {WINDOW_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm text-[#6B4A32]">
            Event
            <select
              value={filters.event}
              onChange={(event) => setFilters((current) => ({ ...current, event: event.target.value as AuditEventType | "all", page: 1 }))}
              className="rounded-xl border border-[#DE954F] bg-[#FFF8EC] px-3 py-2 text-sm text-[#4A2C19] outline-none"
            >
              {EVENT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm text-[#6B4A32]">
            Peran
            <select
              value={filters.role}
              onChange={(event) => setFilters((current) => ({ ...current, role: event.target.value as AuditRoleType | "all", page: 1 }))}
              className="rounded-xl border border-[#DE954F] bg-[#FFF8EC] px-3 py-2 text-sm text-[#4A2C19] outline-none"
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error ? (
          <div className="rounded-2xl border border-[#DE954F] bg-[#FFF8EC] p-6 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-[#4A2C19]">Gagal memuat data audit</h2>
            <p className="mt-2 text-sm text-[#8A5B3D]">{error}</p>
          </div>
        ) : !dashboard ? (
          <div className="flex h-48 items-center justify-center rounded-2xl border border-[#DE954F] bg-[#FFF8EC] shadow-sm">
            <span className="text-[#8A5B3D]">Memuat data audit...</span>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-[#DE954F] bg-[#FFF8EC] p-5 shadow-sm">
                <div className="text-xs font-medium uppercase tracking-wide text-[#B07A4A]">Total Event</div>
                <div className="mt-3 text-3xl font-semibold text-[#4A2C19]">{dashboard.summary.totalEvents}</div>
              </div>
              <div className="rounded-2xl border border-[#DE954F] bg-[#FFF8EC] p-5 shadow-sm">
                <div className="text-xs font-medium uppercase tracking-wide text-[#B07A4A]">Login Berhasil</div>
                <div className="mt-3 text-3xl font-semibold text-[#4A2C19]">{dashboard.summary.loginSuccessCount}</div>
              </div>
              <div className="rounded-2xl border border-[#DE954F] bg-[#FFF8EC] p-5 shadow-sm">
                <div className="text-xs font-medium uppercase tracking-wide text-[#B07A4A]">Login Gagal</div>
                <div className="mt-3 text-3xl font-semibold text-[#9B4B2E]">{dashboard.summary.loginFailCount}</div>
              </div>
              <div className="rounded-2xl border border-[#DE954F] bg-[#FFF8EC] p-5 shadow-sm">
                <div className="text-xs font-medium uppercase tracking-wide text-[#B07A4A]">Alert 24 Jam</div>
                <div className="mt-3 text-3xl font-semibold text-[#9B4B2E]">{dashboard.summary.recentAlertCount}</div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
              <section className="rounded-2xl border border-[#DE954F] bg-[#FFF8EC] p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-[#4A2C19]">Tren Aktivitas</h2>
                    <p className="mt-1 text-xs text-[#8A5B3D]">Ringkasan volume event berdasarkan filter aktif.</p>
                  </div>
                </div>

                <div className="mt-6 flex h-64 items-end gap-3 overflow-x-auto">
                  {trendBars.length === 0 ? (
                    <div className="grid h-full w-full place-items-center rounded-xl border border-dashed border-[#DE954F] text-sm text-[#8A5B3D]">
                      Tidak ada data tren pada filter ini.
                    </div>
                  ) : (
                    trendBars.map((point) => (
                      <div key={point.label} className="flex min-w-16 flex-1 flex-col items-center gap-2">
                        <div className="flex h-48 w-full items-end rounded-t-xl bg-[#F7E8D5] px-2 pb-2">
                          <div className="w-full rounded-t-lg bg-[#DE954F]" style={{ height: point.height }} />
                        </div>
                        <div className="text-center text-[11px] text-[#8A5B3D]">
                          <div>{point.label}</div>
                          <div className="font-semibold text-[#4A2C19]">{point.total}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-[#DE954F] bg-[#FFF8EC] p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-[#4A2C19]">Insight Singkat</h2>
                <div className="mt-4 space-y-3">
                  {insights.map((insight) => (
                    <div key={insight} className="rounded-xl border border-[#F0C89A] bg-[#FFF3E2] p-3 text-sm text-[#6B4A32]">
                      {insight}
                    </div>
                  ))}
                  <div className="rounded-xl border border-[#F0C89A] bg-[#FFF3E2] p-3 text-sm text-[#6B4A32]">
                    Total akun terkunci pada hasil filter ini: <span className="font-semibold text-[#4A2C19]">{dashboard.summary.lockoutCount}</span>
                  </div>
                </div>
              </section>
            </div>

            <section className="rounded-2xl border border-[#DE954F] bg-[#FFF8EC] p-5 shadow-sm">
              <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[#4A2C19]">Tabel Audit</h2>
                  <p className="text-xs text-[#8A5B3D]">
                    Menampilkan {dashboard.items.length} dari {dashboard.pagination.totalItems} event.
                  </p>
                </div>
              </div>

              {dashboard.items.length === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-[#DE954F] p-8 text-center text-sm text-[#8A5B3D]">
                  Tidak ada log yang cocok dengan filter saat ini.
                </div>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="text-xs uppercase tracking-wide text-[#B07A4A]">
                      <tr>
                        <th className="px-3 py-3">Waktu</th>
                        <th className="px-3 py-3">Event</th>
                        <th className="px-3 py-3">Peran</th>
                        <th className="px-3 py-3">User ID</th>
                        <th className="px-3 py-3">IP</th>
                        <th className="px-3 py-3">User Agent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.items.map((item) => (
                        <tr key={item.id} className="border-t border-[#F0D7B6] text-[#5C3B27]">
                          <td className="px-3 py-3">{new Date(item.createdAt).toLocaleString("id-ID")}</td>
                          <td className="px-3 py-3">{formatEventLabel(item.event)}</td>
                          <td className="px-3 py-3">{formatRoleLabel(item.role)}</td>
                          <td className="px-3 py-3">{item.userId ?? "-"}</td>
                          <td className="px-3 py-3">{item.ipAddress ?? "-"}</td>
                          <td className="max-w-xs px-3 py-3 text-xs text-[#8A5B3D]">{item.userAgent ?? "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-5 flex items-center justify-between">
                <button
                  type="button"
                  disabled={dashboard.pagination.page <= 1}
                  onClick={() => setFilters((current) => ({ ...current, page: Math.max(1, current.page - 1) }))}
                  className="rounded-xl border border-[#DE954F] px-4 py-2 text-sm font-semibold text-[#4A2C19] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Sebelumnya
                </button>
                <span className="text-sm text-[#8A5B3D]">
                  Halaman {dashboard.pagination.page} dari {dashboard.pagination.totalPages}
                </span>
                <button
                  type="button"
                  disabled={dashboard.pagination.page >= dashboard.pagination.totalPages}
                  onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}
                  className="rounded-xl bg-[#DE954F] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Berikutnya
                </button>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
