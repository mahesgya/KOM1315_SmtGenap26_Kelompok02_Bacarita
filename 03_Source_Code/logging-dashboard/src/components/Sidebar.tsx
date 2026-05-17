"use client";

import { Shield, LayoutDashboard, ScrollText, FlaskConical, BookOpen, Wifi } from "lucide-react";

type Tab = "overview" | "logs" | "tests";

interface Props {
  activeTab: Tab;
  onTabChange: (t: Tab) => void;
  liveCount: number;
}

const NAV: { id: Tab; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: "overview", label: "Overview",       icon: <LayoutDashboard size={16} />, desc: "Metrics & charts" },
  { id: "logs",     label: "Audit Logs",     icon: <ScrollText size={16} />,      desc: "Full log stream" },
  { id: "tests",    label: "Unit Tests",     icon: <FlaskConical size={16} />,    desc: "Test results" },
];

export function Sidebar({ activeTab, onTabChange, liveCount }: Props) {
  return (
    <aside
      className="w-[220px] shrink-0 flex flex-col h-full"
      style={{ background: "var(--bg-surface)", borderRight: "1px solid var(--bg-border)" }}
    >
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-2.5" style={{ borderBottom: "1px solid var(--bg-border)" }}>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
        >
          <BookOpen size={15} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold leading-none" style={{ color: "var(--text-primary)" }}>Bacarita</p>
          <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>Security Logs</p>
        </div>
      </div>

      {/* Live indicator */}
      <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--bg-border)" }}>
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}
        >
          <span className="relative flex h-2 w-2">
            <span className="pulse-dot animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <div>
            <p className="text-xs font-medium text-emerald-400">Live</p>
            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>+{liveCount} new events</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          Navigation
        </p>
        {NAV.map(item => {
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all"
              style={{
                background: active ? "rgba(99,102,241,0.15)" : "transparent",
                border: active ? "1px solid rgba(99,102,241,0.3)" : "1px solid transparent",
                color: active ? "#818cf8" : "var(--text-secondary)",
              }}
            >
              <span className={active ? "text-indigo-400" : ""}>{item.icon}</span>
              <div>
                <p className="text-xs font-medium leading-none">{item.label}</p>
                <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>{item.desc}</p>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4" style={{ borderTop: "1px solid var(--bg-border)" }}>
        <div className="flex items-center gap-2">
          <Wifi size={12} className="text-emerald-400" />
          <div>
            <p className="text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>Sistem Aktif</p>
            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>NestJS + MySQL</p>
          </div>
        </div>
        <div
          className="mt-3 px-3 py-2 rounded-lg"
          style={{ background: "var(--bg-card)", border: "1px solid var(--bg-border)" }}
        >
          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Bacarita v1.0 · IPB LIDM 2025</p>
          <div className="flex items-center gap-1 mt-1">
            <Shield size={9} className="text-indigo-400" />
            <p className="text-[10px] text-indigo-400">AAA Protocol Active</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
