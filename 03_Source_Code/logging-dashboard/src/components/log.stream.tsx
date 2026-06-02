"use client";

import { useEffect, useRef, useState } from "react";
import type { LogEntry } from "@/lib/types";
import { EVENT_META, ROLE_META } from "@/lib/types";
import { Terminal } from "lucide-react";

interface Props { logs: LogEntry[] }

function EventBadge({ event }: { event: LogEntry["event"] }) {
  const m = EVENT_META[event];
  return (
    <span
      className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold font-mono shrink-0"
      style={{ background: m.bg, color: m.color, border: `1px solid ${m.color}30` }}
    >
      {event}
    </span>
  );
}

function RoleBadge({ role }: { role: LogEntry["role"] }) {
  if (!role) return null;
  const m = ROLE_META[role];
  return (
    <span
      className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0"
      style={{ background: `${m.color}15`, color: m.color }}
    >
      {m.label}
    </span>
  );
}

export function LogStream({ logs }: Props) {
  const [visible, setVisible] = useState<LogEntry[]>([]);
  const prevTopId = useRef<string | number | null>(null);

  useEffect(() => {
    if (logs.length === 0) return;
    const newTop = logs[0]?.id;
    if (newTop !== prevTopId.current) {
      setVisible(logs.slice(0, 30));
      prevTopId.current = newTop;
    }
  }, [logs]);

  return (
    <div className="card p-0 overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-2 px-5 py-3"
        style={{ borderBottom: "1px solid var(--bg-border)", background: "var(--bg-surface)" }}
      >
        <Terminal size={14} className="text-indigo-400" />
        <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Live Log Stream
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <span className="text-[11px] text-emerald-400">live</span>
        </div>
      </div>

      {/* Entries */}
      <div
        className="overflow-y-auto font-mono"
        style={{ maxHeight: 320, background: "#070c18" }}
      >
        {visible.map((log, idx) => {
          const ts = new Date(log.timestamp);
          const time = ts.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
          const isNew = idx === 0;
          return (
            <div
              key={log.id}
              className={`flex items-center gap-3 px-5 py-2 text-xs border-b transition-colors hover:bg-white/[0.02] ${isNew ? "log-entry-new" : ""}`}
              style={{
                borderColor: "var(--bg-border-subtle)",
                background: isNew ? "rgba(99,102,241,0.04)" : "transparent",
              }}
            >
              {/* Timestamp */}
              <span className="shrink-0 w-20 text-[10px]" style={{ color: "#3a4e6a" }}>{time}</span>

              {/* Event badge */}
              <EventBadge event={log.event} />

              {/* Role badge */}
              <RoleBadge role={log.role} />

              {/* User ID */}
              <span className="flex-1 truncate" style={{ color: "#4a6280" }}>
                {log.userId
                  ? <span style={{ color: "#6b82a0" }}>{log.userId}</span>
                  : <span style={{ color: "#2a3a4a" }}>—</span>
                }
              </span>

              {/* IP */}
              <span className="shrink-0 text-[10px]" style={{ color: "#304050" }}>
                {log.ip ?? "—"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
