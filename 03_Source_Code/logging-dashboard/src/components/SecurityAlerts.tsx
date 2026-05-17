"use client";

import type { LogEntry, Metrics } from "@/lib/types";
import { ROLE_META } from "@/lib/types";
import { AlertTriangle, ShieldAlert, Lock, Eye } from "lucide-react";

interface Props { logs: LogEntry[]; metrics: Metrics }

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
  info:     { color: "#6366f1", bg: "rgba(99,102,241,0.08)",  border: "rgba(99,102,241,0.25)",  dot: "#6366f1" },
};

export function SecurityAlerts({ logs, metrics }: Props) {
  const now = new Date();

  const alerts: Alert[] = [];

  // Locked accounts
  if (metrics.locked > 0) {
    alerts.push({
      id: "lock",
      level: "critical",
      icon: <Lock size={13} />,
      title: `${metrics.locked} Akun Terkunci`,
      desc: `Akun ${metrics.lockedAccounts.slice(0, 2).join(", ")}${metrics.lockedAccounts.length > 2 ? ` +${metrics.lockedAccounts.length - 2} lainnya` : ""} dikunci setelah 5x gagal login.`,
      time: "baru saja",
    });
  }

  // High fail rate
  if (metrics.failRate > 15) {
    alerts.push({
      id: "failrate",
      level: "warning",
      icon: <ShieldAlert size={13} />,
      title: `Fail Rate Tinggi: ${metrics.failRate}%`,
      desc: `${metrics.loginFail} percobaan login gagal dari total ${metrics.loginOk + metrics.loginFail} percobaan.`,
      time: "1 jam terakhir",
    });
  }

  // Suspicious IPs (multiple fails from same IP)
  const ipFails: Record<string, number> = {};
  logs.filter(l => l.event === "LOGIN_FAIL" && l.ip).forEach(l => {
    ipFails[l.ip!] = (ipFails[l.ip!] || 0) + 1;
  });
  const suspiciousIps = Object.entries(ipFails)
    .filter(([, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1]);

  if (suspiciousIps.length > 0) {
    const [ip, count] = suspiciousIps[0];
    alerts.push({
      id: "bruteip",
      level: "warning",
      icon: <AlertTriangle size={13} />,
      title: `Brute Force Terdeteksi`,
      desc: `IP ${ip} melakukan ${count} percobaan gagal. Kemungkinan serangan brute force.`,
      time: "24 jam terakhir",
    });
  }

  // Multi-role access from same IP
  const ipRoles: Record<string, Set<string>> = {};
  logs.filter(l => l.ip && l.role).forEach(l => {
    if (!ipRoles[l.ip!]) ipRoles[l.ip!] = new Set();
    ipRoles[l.ip!].add(l.role!);
  });
  const multiRoleIps = Object.entries(ipRoles).filter(([, roles]) => roles.size >= 4);
  if (multiRoleIps.length > 0) {
    alerts.push({
      id: "multirole",
      level: "info",
      icon: <Eye size={13} />,
      title: "Multi-Role Access",
      desc: `${multiRoleIps.length} IP mengakses sistem dengan ≥4 role berbeda. Perlu pemantauan.`,
      time: "7 hari terakhir",
    });
  }

  // All good
  if (alerts.length === 0) {
    alerts.push({
      id: "allgood",
      level: "info",
      icon: <Eye size={13} />,
      title: "Tidak Ada Ancaman Terdeteksi",
      desc: "Sistem berjalan normal. Semua autentikasi dalam batas aman.",
      time: now.toLocaleTimeString("id-ID"),
    });
  }

  return (
    <div className="card p-5 flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle size={14} className="text-amber-400" />
        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Security Alerts</p>
        {alerts.filter(a => a.level === "critical").length > 0 && (
          <span
            className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}
          >
            {alerts.filter(a => a.level === "critical").length} CRITICAL
          </span>
        )}
      </div>

      <div className="flex-1 space-y-2.5 overflow-y-auto" style={{ maxHeight: 260 }}>
        {alerts.map(alert => {
          const s = LEVEL_STYLE[alert.level];
          return (
            <div
              key={alert.id}
              className="rounded-xl p-3.5 flex gap-3"
              style={{ background: s.bg, border: `1px solid ${s.border}` }}
            >
              <div
                className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center mt-0.5"
                style={{ background: `${s.dot}20`, color: s.color }}
              >
                {alert.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold" style={{ color: s.color }}>{alert.title}</p>
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

      {/* Role distribution footer */}
      <div className="mt-4 pt-3" style={{ borderTop: "1px solid var(--bg-border)" }}>
        <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
          Distribusi Role Aktif
        </p>
        <div className="flex gap-2 flex-wrap">
          {(Object.keys(ROLE_META) as Array<keyof typeof ROLE_META>).map(role => {
            const m = ROLE_META[role];
            const count = logs.filter(l => l.role === role).length;
            return (
              <div
                key={role}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px]"
                style={{ background: `${m.color}12`, border: `1px solid ${m.color}25`, color: m.color }}
              >
                <span>{m.emoji}</span>
                <span>{m.label}</span>
                <span className="font-bold">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
