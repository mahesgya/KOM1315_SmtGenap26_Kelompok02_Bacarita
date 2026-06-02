"use client";

import type { AuditDashboard, Metrics } from "@/lib/types";
import { AlertTriangle, ShieldAlert, Lock, Eye } from "lucide-react";

interface Props {
  dashboard: AuditDashboard;
  metrics: Metrics;
}

interface Alert {
  id: string;
  level: "critical" | "warning" | "info";
  icon: React.ReactNode;
  title: string;
  desc: string;
  time: string;
}

const LEVEL_STYLE = {
  critical: { color: "#ef4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.25)", dot: "#ef4444" },
  warning:  { color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)", dot: "#f59e0b" },
  info:     { color: "#6366f1", bg: "rgba(99,102,241,0.08)", border: "rgba(99,102,241,0.25)", dot: "#6366f1" },
};

export function SecurityAlerts({ dashboard, metrics }: Props) {
  const alerts: Alert[] = [];
  const latestLog = dashboard.items[0] ?? null;
  const loginAttemptCount = metrics.loginOk + metrics.loginFail;

  if (metrics.locked > 0) {
    alerts.push({
      id: "lock",
      level: "critical",
      icon: <Lock size={13} />,
      title: `${metrics.locked} Akun Terkunci`,
      desc: `${metrics.lockedAccounts.length} akun unik tercatat terkunci pada jendela ${dashboard.filters.window}.`,
      time: dashboard.filters.window,
    });
  }

  if (metrics.failRate > 15) {
    alerts.push({
      id: "failrate",
      level: "warning",
      icon: <ShieldAlert size={13} />,
      title: `Fail Rate Tinggi: ${metrics.failRate}%`,
      desc: `${metrics.loginFail} percobaan login gagal dari ${loginAttemptCount} percobaan login pada hasil filter aktif.`,
      time: dashboard.filters.window,
    });
  }

  if (dashboard.summary.recentAlertCount > 0) {
    alerts.push({
      id: "recent-alerts",
      level: "warning",
      icon: <AlertTriangle size={13} />,
      title: `${dashboard.summary.recentAlertCount} Alert 24 Jam`,
      desc: "Backend menandai login gagal dan akun terkunci dalam 24 jam terakhir sebagai alert keamanan.",
      time: "24 jam terakhir",
    });
  }

  if (latestLog) {
    alerts.push({
      id: "latest-event",
      level: "info",
      icon: <Eye size={13} />,
      title: "Event Terbaru",
      desc: `${latestLog.event} oleh ${latestLog.userId ?? "user tidak diketahui"} dari IP ${latestLog.ip ?? "-"}.`,
      time: new Date(latestLog.timestamp).toLocaleString("id-ID"),
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      id: "allgood",
      level: "info",
      icon: <Eye size={13} />,
      title: "Tidak Ada Ancaman Terdeteksi",
      desc: "Belum ada indikator risiko dari ringkasan audit yang dikembalikan backend.",
      time: dashboard.filters.window,
    });
  }

  return (
    <div className="card p-5 flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle size={14} className="text-amber-400" />
        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Security Alerts</p>
        {alerts.filter((alert) => alert.level === "critical").length > 0 && (
          <span
            className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}
          >
            {alerts.filter((alert) => alert.level === "critical").length} CRITICAL
          </span>
        )}
      </div>

      <div className="flex-1 space-y-2.5 overflow-y-auto" style={{ maxHeight: 260 }}>
        {alerts.map((alert) => {
          const style = LEVEL_STYLE[alert.level];

          return (
            <div
              key={alert.id}
              className="rounded-xl p-3.5 flex gap-3"
              style={{ background: style.bg, border: `1px solid ${style.border}` }}
            >
              <div
                className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center mt-0.5"
                style={{ background: `${style.dot}20`, color: style.color }}
              >
                {alert.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold" style={{ color: style.color }}>{alert.title}</p>
                  <span className="text-[10px] shrink-0" style={{ color: "var(--text-muted)" }}>{alert.time}</span>
                </div>
                <p className="text-[11px] mt-1 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {alert.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3" style={{ borderTop: "1px solid var(--bg-border)" }}>
        <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
          Ringkasan Filter
        </p>
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="rounded-lg px-3 py-2" style={{ background: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
            Window: {dashboard.filters.window}
          </div>
          <div className="rounded-lg px-3 py-2" style={{ background: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
            Unique user: {dashboard.summary.uniqueUsers}
          </div>
          <div className="rounded-lg px-3 py-2" style={{ background: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
            Event: {dashboard.filters.event ?? "all"}
          </div>
          <div className="rounded-lg px-3 py-2" style={{ background: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
            Role: {dashboard.filters.role ?? "all"}
          </div>
        </div>
      </div>
    </div>
  );
}
