"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ApiLogItem, ApiLogPagination, AuditRole } from "@/lib/types";
import { METHOD_META, ROLE_META } from "@/lib/types";

interface Props {
  items: ApiLogItem[];
  pagination: ApiLogPagination;
  isLoading: boolean;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

function MethodBadge({ method }: { method: string }) {
  const m = METHOD_META[method] ?? { color: "#94a3b8", bg: "rgba(148,163,184,0.12)" };
  return (
    <span
      className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold"
      style={{ background: m.bg, color: m.color, border: `1px solid ${m.color}25` }}
    >
      {method}
    </span>
  );
}

function StatusBadge({ code }: { code: number | null }) {
  if (code === null) return <span style={{ color: "var(--text-muted)" }}>—</span>;
  const color =
    code >= 500 ? "#ef4444" : code >= 400 ? "#f59e0b" : code >= 200 ? "#10b981" : "#94a3b8";
  const bg =
    code >= 500
      ? "rgba(239,68,68,0.12)"
      : code >= 400
        ? "rgba(245,158,11,0.12)"
        : code >= 200
          ? "rgba(16,185,129,0.12)"
          : "var(--bg-card)";
  return (
    <span
      className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold"
      style={{ background: bg, color, border: `1px solid ${color}25` }}
    >
      {code}
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

export function ApiLogTable({ items, pagination, isLoading, onPreviousPage, onNextPage }: Props) {
  return (
    <div className="card overflow-hidden">
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: "1px solid var(--bg-border)", background: "var(--bg-surface)" }}
      >
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            API Request Log
          </p>
          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            Menampilkan {items.length} dari {pagination.totalItems.toLocaleString("id-ID")} request
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr
              style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--bg-border)" }}
            >
              {["Timestamp", "Method", "Endpoint", "Status", "Durasi", "Role", "User ID", "IP"].map(
                (h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-[10px]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const ts = new Date(item.createdAt);
              const isError = item.statusCode !== null && item.statusCode >= 400;
              return (
                <tr
                  key={item.id}
                  className="transition-colors hover:bg-white/[0.02]"
                  style={{
                    borderBottom: "1px solid var(--bg-border-subtle)",
                    background: isError ? "rgba(239,68,68,0.04)" : "transparent",
                  }}
                >
                  <td className="px-4 py-2.5 font-mono" style={{ color: "var(--text-muted)" }}>
                    <div>
                      {ts.toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "2-digit",
                      })}
                    </div>
                    <div className="text-[10px]">{ts.toLocaleTimeString("id-ID")}</div>
                  </td>
                  <td className="px-4 py-2.5">
                    <MethodBadge method={item.method} />
                  </td>
                  <td className="px-4 py-2.5 max-w-[220px]">
                    <p
                      className="font-mono truncate text-[11px]"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {item.endpoint}
                    </p>
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge code={item.statusCode} />
                  </td>
                  <td
                    className="px-4 py-2.5 font-mono text-[11px]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {item.durationMs !== null ? `${item.durationMs}ms` : "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    <RoleBadge role={item.role} />
                  </td>
                  <td className="px-4 py-2.5 font-mono" style={{ color: "var(--text-secondary)" }}>
                    {item.userId ?? <span style={{ color: "var(--text-muted)" }}>—</span>}
                  </td>
                  <td className="px-4 py-2.5 font-mono" style={{ color: "var(--text-muted)" }}>
                    {item.ipAddress ?? "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {!isLoading && items.length === 0 && (
          <div className="py-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            Tidak ada request yang sesuai filter.
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
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--bg-border)",
              color: "var(--text-secondary)",
            }}
          >
            <ChevronLeft size={13} />
          </button>
          {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
            const firstPage = Math.max(
              1,
              Math.min(pagination.page - 2, pagination.totalPages - 4),
            );
            const p = firstPage + i;
            return (
              <span
                key={p}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs"
                style={{
                  background:
                    p === pagination.page ? "rgba(99,102,241,0.2)" : "var(--bg-card)",
                  border:
                    p === pagination.page
                      ? "1px solid rgba(99,102,241,0.4)"
                      : "1px solid var(--bg-border)",
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
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--bg-border)",
              color: "var(--text-secondary)",
            }}
          >
            <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
