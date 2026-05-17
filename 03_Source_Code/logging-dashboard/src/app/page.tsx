"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { generateLogs, computeMetrics, buildHourlyBuckets, buildRoleBuckets, buildEventSlices, TEST_RESULTS } from "@/lib/mockData";
import type { LogEntry, AuditEvent, AuditRole } from "@/lib/types";
import { EVENT_META } from "@/lib/types";
import { Sidebar } from "@/components/Sidebar";
import { MetricCard } from "@/components/MetricCard";
import { ActivityChart } from "@/components/ActivityChart";
import { DonutChart } from "@/components/DonutChart";
import { RoleChart } from "@/components/RoleChart";
import { LogStream } from "@/components/LogStream";
import { SecurityAlerts } from "@/components/SecurityAlerts";
import { LogTable } from "@/components/LogTable";
import { TestResults } from "@/components/TestResults";
import {
  Shield, Activity, LogIn, LogOut, Lock, Wifi,
  RefreshCw, Clock,
} from "lucide-react";

const BASE_LOGS = generateLogs(250);

export default function Dashboard() {
  const [logs, setLogs] = useState<LogEntry[]>(BASE_LOGS);
  const [activeTab, setActiveTab] = useState<"overview" | "logs" | "tests">("overview");
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [liveCount, setLiveCount] = useState(0);

  const metrics     = useMemo(() => computeMetrics(logs), [logs]);
  const hourly      = useMemo(() => buildHourlyBuckets(logs), [logs]);
  const roleData    = useMemo(() => buildRoleBuckets(logs), [logs]);
  const eventSlices = useMemo(() => buildEventSlices(metrics), [metrics]);

  // Simulate live incoming events
  useEffect(() => {
    const roles: AuditRole[] = ["admin", "teacher", "student", "parent", "curator"];
    const events: AuditEvent[] = ["LOGIN_OK", "LOGIN_OK", "LOGIN_OK", "LOGIN_FAIL", "LOGOUT"];
    const ips = ["192.168.1.12", "10.0.0.5", "172.16.0.44", "203.0.113.55"];
    const users: Record<AuditRole, string[]> = {
      admin:   ["admin-001"],
      teacher: ["guru-001", "guru-002"],
      student: ["siswa-003", "siswa-007"],
      parent:  ["ortu-002"],
      curator: ["kurator-001"],
    };

    const timer = setInterval(() => {
      const role  = roles[Math.floor(Math.random() * roles.length)];
      const event = events[Math.floor(Math.random() * events.length)];
      const entry: LogEntry = {
        id: `live-${Date.now()}`,
        timestamp: new Date().toISOString(),
        event,
        userId: users[role][Math.floor(Math.random() * users[role].length)],
        role,
        ip: ips[Math.floor(Math.random() * ips.length)],
        userAgent: "Mozilla/5.0 (Live) Chrome/124",
      };
      setLogs(prev => [entry, ...prev.slice(0, 299)]);
      setLiveCount(c => c + 1);
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await new Promise(r => setTimeout(r, 700));
    setLastRefresh(new Date());
    setIsRefreshing(false);
  }, []);

  const recentLogs = logs.slice(0, 60);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-base)" }}>
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} liveCount={liveCount} />

      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
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
              {activeTab === "logs"     && "Audit Log Stream"}
              {activeTab === "tests"    && "Unit Test Results"}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
              <Clock size={12} />
              {lastRefresh.toLocaleTimeString("id-ID")}
            </span>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--bg-border)",
                color: "var(--text-secondary)",
              }}
            >
              <RefreshCw size={11} className={isRefreshing ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </header>

        <div className="p-5">
          {/* ─── OVERVIEW ─── */}
          {activeTab === "overview" && (
            <div className="space-y-5">
              {/* Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                <MetricCard
                  icon={<Activity size={15} />}
                  label="Total Events"
                  value={metrics.total.toLocaleString("id-ID")}
                  sub="7 hari terakhir"
                  accent="#818cf8"
                />
                <MetricCard
                  icon={<LogIn size={15} />}
                  label="Login Berhasil"
                  value={metrics.loginOk.toLocaleString("id-ID")}
                  sub={`${Math.round((metrics.loginOk / metrics.total) * 100)}% dari total`}
                  accent="#10b981"
                  trend="up"
                />
                <MetricCard
                  icon={<Shield size={15} />}
                  label="Login Gagal"
                  value={metrics.loginFail.toLocaleString("id-ID")}
                  sub={`Fail rate ${metrics.failRate}%`}
                  accent="#ef4444"
                  alert={metrics.failRate > 20}
                />
                <MetricCard
                  icon={<Lock size={15} />}
                  label="Akun Terkunci"
                  value={metrics.locked.toLocaleString("id-ID")}
                  sub={`${metrics.lockedAccounts.length} akun unik`}
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
                  sub="Sumber koneksi"
                  accent="#22d3ee"
                />
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                        Aktivitas 24 Jam Terakhir
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Jumlah event per jam</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {(["LOGIN_OK", "LOGIN_FAIL", "LOGOUT", "LOCKED"] as AuditEvent[]).map(e => (
                        <span key={e} className="flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
                          <span className="w-2 h-2 rounded-full" style={{ background: EVENT_META[e].color }} />
                          {EVENT_META[e].label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ActivityChart data={hourly} />
                </div>
                <div className="card p-5">
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Distribusi Events</p>
                  <p className="text-xs mt-0.5 mb-4" style={{ color: "var(--text-muted)" }}>Perbandingan tipe kejadian</p>
                  <DonutChart data={eventSlices} total={metrics.total} />
                </div>
              </div>

              {/* Role + Alerts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="card p-5">
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Aktivitas per Role</p>
                  <p className="text-xs mt-0.5 mb-4" style={{ color: "var(--text-muted)" }}>Breakdown event berdasarkan peran pengguna</p>
                  <RoleChart data={roleData} />
                </div>
                <SecurityAlerts logs={recentLogs} metrics={metrics} />
              </div>

              {/* Live stream */}
              <LogStream logs={recentLogs} />
            </div>
          )}

          {/* ─── LOGS TAB ─── */}
          {activeTab === "logs" && <LogTable logs={logs} />}

          {/* ─── TESTS TAB ─── */}
          {activeTab === "tests" && <TestResults tests={TEST_RESULTS} />}
        </div>
      </main>
    </div>
  );
}
