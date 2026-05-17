"use client";

import { useState, useMemo } from "react";
import type { LogEntry, AuditEvent, AuditRole } from "@/lib/types";
import { EVENT_META, ROLE_META } from "@/lib/types";
import { Search, Filter, ChevronLeft, ChevronRight, Download } from "lucide-react";

interface Props { logs: LogEntry[] }

const PAGE_SIZE = 20;

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
      {m.emoji} {m.label}
    </span>
  );
}

export function LogTable({ logs }: Props) {
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState<AuditEvent | "ALL">("ALL");
  const [roleFilter, setRoleFilter] = useState<AuditRole | "ALL">("ALL");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return logs.filter(l => {
      if (eventFilter !== "ALL" && l.event !== eventFilter) return false;
      if (roleFilter  !== "ALL" && l.role  !== roleFilter)  return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          l.userId?.toLowerCase().includes(q) ||
          l.ip?.toLowerCase().includes(q) ||
          l.event.toLowerCase().includes(q) ||
          l.role?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [logs, search, eventFilter, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageData   = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const selectStyle = {
    background: "var(--bg-card)",
    border: "1px solid var(--bg-border)",
    color: "var(--text-secondary)",
    borderRadius: 8,
    padding: "6px 10px",
    fontSize: 12,
    outline: "none",
  };

  return (
    <div className="card overflow-hidden">
      {/* Toolbar */}
      <div
        className="flex flex-wrap items-center gap-3 px-5 py-4"
        style={{ borderBottom: "1px solid var(--bg-border)", background: "var(--bg-surface)" }}
      >
        {/* Search */}
        <div className="flex items-center gap-2 flex-1 min-w-[200px]" style={{ position: "relative" }}>
          <Search size={13} style={{ position: "absolute", left: 10, color: "var(--text-muted)", pointerEvents: "none" }} />
          <input
            type="text"
            placeholder="Cari user ID, IP, event…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--bg-border)",
              color: "var(--text-primary)",
            }}
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <Filter size={13} style={{ color: "var(--text-muted)" }} />
          <select
            value={eventFilter}
            onChange={e => { setEventFilter(e.target.value as AuditEvent | "ALL"); setPage(1); }}
            style={selectStyle}
          >
            <option value="ALL">Semua Event</option>
            <option value="LOGIN_OK">Login Berhasil</option>
            <option value="LOGIN_FAIL">Login Gagal</option>
            <option value="LOGOUT">Logout</option>
            <option value="LOCKED">Terkunci</option>
          </select>
          <select
            value={roleFilter}
            onChange={e => { setRoleFilter(e.target.value as AuditRole | "ALL"); setPage(1); }}
            style={selectStyle}
          >
            <option value="ALL">Semua Role</option>
            <option value="admin">Admin</option>
            <option value="teacher">Guru</option>
            <option value="student">Siswa</option>
            <option value="parent">Orang Tua</option>
            <option value="curator">Kurator</option>
          </select>
        </div>

        <span className="text-xs ml-auto" style={{ color: "var(--text-muted)" }}>
          {filtered.length.toLocaleString("id-ID")} entries
        </span>

        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-70"
          style={{ background: "var(--bg-card)", border: "1px solid var(--bg-border)", color: "var(--text-secondary)" }}
        >
          <Download size={11} />
          Export
        </button>
      </div>

      {/* Table */}
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
            {pageData.map((log, i) => {
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

        {pageData.length === 0 && (
          <div className="py-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            Tidak ada log yang sesuai filter.
          </div>
        )}
      </div>

      {/* Pagination */}
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ borderTop: "1px solid var(--bg-border)", background: "var(--bg-surface)" }}
      >
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          Halaman {safePage} dari {totalPages}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-opacity disabled:opacity-30"
            style={{ background: "var(--bg-card)", border: "1px solid var(--bg-border)", color: "var(--text-secondary)" }}
          >
            <ChevronLeft size={13} />
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const p = Math.max(1, Math.min(safePage - 2, totalPages - 4)) + i;
            return (
              <button
                key={p}
                onClick={() => setPage(p)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all"
                style={{
                  background: p === safePage ? "rgba(99,102,241,0.2)" : "var(--bg-card)",
                  border: p === safePage ? "1px solid rgba(99,102,241,0.4)" : "1px solid var(--bg-border)",
                  color: p === safePage ? "#818cf8" : "var(--text-secondary)",
                }}
              >
                {p}
              </button>
            );
          })}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
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
