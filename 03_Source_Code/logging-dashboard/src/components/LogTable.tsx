"use client";

import type { AuditPagination, LogEntry, AuditEvent, AuditRole } from "@/lib/types";
import { EVENT_META, ROLE_META } from "@/lib/types";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  logs: LogEntry[];
  pagination: AuditPagination;
  isLoading: boolean;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

function EventBadge({ event }: { event: AuditEvent }) {
  const m = EVENT_META[event];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold"
      style={{ background: m.bg, color: m.color, border: `1px solid ${m.color}25` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: m.color }} />
      {m.label}
    </span>
  );
}

function RoleBadge({ role }: { role: AuditRole | null }) {
  if (!role) return <span style={{ color: "var(--text-muted)" }}>—</span>;
  const m = ROLE_META[role];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium"
      style={{ background: `${m.color}14`, color: m.color }}
    >
      {m.label}
    </span>
  );
}

export function LogTable({ logs, pagination, isLoading, onPreviousPage, onNextPage }: Props) {
  return (
    <div className="card overflow-hidden">
      <div
        className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
        style={{ borderBottom: "1px solid var(--bg-border)", background: "var(--bg-surface)" }}
      >
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Audit Log Table
          </p>
          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            Menampilkan {logs.length} dari {pagination.totalItems.toLocaleString("id-ID")} event.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--bg-border)" }}>
              {["Timestamp", "Event", "Role", "User ID", "IP Address", "User Agent"].map(h => (
                <th
                  key={h}
                  className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-[10px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => {
              const ts = new Date(log.timestamp);
              const isAlert = log.event === "LOCKED" || log.event === "LOGIN_FAIL";
              return (
                <tr
                  key={log.id}
                  className="transition-colors hover:bg-white/[0.02]"
                  style={{
                    borderBottom: "1px solid var(--bg-border-subtle)",
                    background: isAlert ? EVENT_META[log.event].bg : "transparent",
                  }}
                >
                  <td className="px-4 py-2.5 font-mono" style={{ color: "var(--text-muted)" }}>
                    <div>{ts.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "2-digit" })}</div>
                    <div className="text-[10px]">{ts.toLocaleTimeString("id-ID")}</div>
                  </td>
                  <td className="px-4 py-2.5"><EventBadge event={log.event} /></td>
                  <td className="px-4 py-2.5"><RoleBadge role={log.role} /></td>
                  <td className="px-4 py-2.5 font-mono" style={{ color: "var(--text-secondary)" }}>
                    {log.userId ?? <span style={{ color: "var(--text-muted)" }}>—</span>}
                  </td>
                  <td className="px-4 py-2.5 font-mono" style={{ color: "var(--text-secondary)" }}>
                    {log.ip ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 max-w-[200px] truncate" style={{ color: "var(--text-muted)", fontSize: 10 }}>
                    {log.userAgent ?? "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {!isLoading && logs.length === 0 && (
          <div className="py-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            Tidak ada log yang sesuai filter.
          </div>
        )}
      </div>

      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ borderTop: "1px solid var(--bg-border)", background: "var(--bg-surface)" }}
      >
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          Halaman {pagination.page} dari {pagination.totalPages}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={onPreviousPage}
            disabled={pagination.page <= 1 || isLoading}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-opacity disabled:opacity-30"
            style={{ background: "var(--bg-card)", border: "1px solid var(--bg-border)", color: "var(--text-secondary)" }}
          >
            <ChevronLeft size={13} />
          </button>
          {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
            const firstPage = Math.max(1, Math.min(pagination.page - 2, pagination.totalPages - 4));
            const p = firstPage + i;
            return (
              <span
                key={p}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all"
                style={{
                  background: p === pagination.page ? "rgba(99,102,241,0.2)" : "var(--bg-card)",
                  border: p === pagination.page ? "1px solid rgba(99,102,241,0.4)" : "1px solid var(--bg-border)",
                  color: p === pagination.page ? "#818cf8" : "var(--text-secondary)",
                }}
              >
                {p}
              </span>
            );
          })}
          <button
            onClick={onNextPage}
            disabled={pagination.page >= pagination.totalPages || isLoading}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-opacity disabled:opacity-30"
            style={{ background: "var(--bg-card)", border: "1px solid var(--bg-border)", color: "var(--text-secondary)" }}
          >
            <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
