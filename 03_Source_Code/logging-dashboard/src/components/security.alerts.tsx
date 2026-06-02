"use client";

import type { AuditDashboard, Metrics } from "@/lib/types";
import { AlertTriangle, ShieldAlert, Lock, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Props {
  dashboard: AuditDashboard;
  metrics: Metrics;
}

interface AlertItem {
  id: string;
  level: "critical" | "warning" | "info";
  icon: React.ReactNode;
  title: string;
  desc: string;
  time: string;
}

const LEVEL_STYLE = {
  critical: {
    textColor: "text-destructive",
    bg: "bg-destructive/10",
    border: "border-destructive/25",
    iconBg: "bg-destructive/15",
  },
  warning: {
    textColor: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/25",
    iconBg: "bg-amber-500/15",
  },
  info: {
    textColor: "text-primary",
    bg: "bg-primary/5",
    border: "border-primary/20",
    iconBg: "bg-primary/15",
  },
};

export function SecurityAlerts({ dashboard, metrics }: Props) {
  const alerts: AlertItem[] = [];
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
      desc: `${metrics.loginFail} percobaan login gagal dari ${loginAttemptCount} percobaan pada filter aktif.`,
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
      desc: `${latestLog.event} oleh ${latestLog.userId ?? "user tidak diketahui"} dari IP ${latestLog.ipAddress ?? "-"}.`,
      time: new Date(latestLog.createdAt).toLocaleString("id-ID"),
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

  const criticalCount = alerts.filter((a) => a.level === "critical").length;

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b px-5 py-4">
        <div className="flex items-center gap-2">
          <AlertTriangle size={14} className="text-amber-500" />
          <CardTitle className="text-sm">Security Alerts</CardTitle>
          {criticalCount > 0 && (
            <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-destructive/15 text-destructive border border-destructive/30">
              {criticalCount} CRITICAL
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <div className="space-y-2.5 overflow-y-auto" style={{ maxHeight: 260 }}>
          {alerts.map((alert) => {
            const style = LEVEL_STYLE[alert.level];
            return (
              <div
                key={alert.id}
                className={cn("rounded-xl p-3.5 flex gap-3 border", style.bg, style.border)}
              >
                <div
                  className={cn(
                    "w-7 h-7 rounded-lg shrink-0 flex items-center justify-center mt-0.5",
                    style.iconBg,
                    style.textColor
                  )}
                >
                  {alert.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn("text-xs font-semibold", style.textColor)}>{alert.title}</p>
                    <span className="text-[10px] shrink-0 text-muted-foreground">{alert.time}</span>
                  </div>
                  <p className="text-[11px] mt-1 leading-relaxed text-muted-foreground">
                    {alert.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t">
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-2 text-muted-foreground">
            Ringkasan Filter
          </p>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="rounded-lg px-3 py-2 bg-muted text-muted-foreground">
              Window: {dashboard.filters.window}
            </div>
            <div className="rounded-lg px-3 py-2 bg-muted text-muted-foreground">
              Unique user: {dashboard.summary.uniqueUsers}
            </div>
            <div className="rounded-lg px-3 py-2 bg-muted text-muted-foreground">
              Event: {dashboard.filters.event ?? "all"}
            </div>
            <div className="rounded-lg px-3 py-2 bg-muted text-muted-foreground">
              Role: {dashboard.filters.role ?? "all"}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
