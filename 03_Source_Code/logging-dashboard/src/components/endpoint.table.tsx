"use client";

import type { ApiLogSummary } from "@/lib/types";
import { METHOD_META, ROLE_META } from "@/lib/types";

interface Props {
  summary: ApiLogSummary;
}

function MethodBadge({ method }: { method: string }) {
  const m = METHOD_META[method] ?? { color: "#94a3b8", bg: "rgba(148,163,184,0.12)" };
  return (
    <span
      className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wide"
      style={{ background: m.bg, color: m.color }}
    >
      {method}
    </span>
  );
}

export function EndpointTable({ summary }: Props) {
  const maxCount = summary.byEndpoint[0]?.count ?? 1;

  return (
    <div className="card overflow-hidden flex flex-col">
      <div
        className="px-5 py-4"
        style={{ borderBottom: "1px solid var(--bg-border)", background: "var(--bg-surface)" }}
      >
        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Top Endpoints
        </p>
        <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
          10 endpoint paling banyak diakses
        </p>
      </div>

      <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: "var(--bg-border-subtle)" }}>
        {summary.byEndpoint.map((item, i) => (
          <div key={item.endpoint} className="px-5 py-2.5 flex items-center gap-3">
            <span
              className="text-xs font-bold w-5 text-center shrink-0"
              style={{ color: "var(--text-muted)" }}
            >
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p
                className="text-[11px] font-mono truncate"
                style={{ color: "var(--text-secondary)" }}
              >
                {item.endpoint}
              </p>
              <div className="h-1 rounded-full mt-1.5" style={{ background: "var(--bg-card)" }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(item.count / maxCount) * 100}%`,
                    background: "rgba(99,102,241,0.5)",
                  }}
                />
              </div>
            </div>
            <span
              className="text-xs font-semibold tabular-nums shrink-0"
              style={{ color: "var(--text-primary)" }}
            >
              {item.count.toLocaleString("id-ID")}
            </span>
          </div>
        ))}
        {summary.byEndpoint.length === 0 && (
          <p className="px-5 py-8 text-xs text-center" style={{ color: "var(--text-muted)" }}>
            Belum ada data
          </p>
        )}
      </div>

      <div
        className="grid grid-cols-2 gap-4 px-5 py-4"
        style={{ borderTop: "1px solid var(--bg-border)", background: "var(--bg-surface)" }}
      >
        <div>
          <p
            className="text-[10px] uppercase tracking-wider mb-2.5"
            style={{ color: "var(--text-muted)" }}
          >
            Per Method
          </p>
          <div className="space-y-2">
            {summary.byMethod.map((m) => (
              <div key={m.method} className="flex items-center gap-2">
                <MethodBadge method={m.method} />
                <span
                  className="text-xs flex-1 font-mono"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {m.count.toLocaleString("id-ID")}
                </span>
              </div>
            ))}
            {summary.byMethod.length === 0 && (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>—</p>
            )}
          </div>
        </div>

        <div>
          <p
            className="text-[10px] uppercase tracking-wider mb-2.5"
            style={{ color: "var(--text-muted)" }}
          >
            Per Role
          </p>
          <div className="space-y-2">
            {summary.byRole.map((r) => {
              const meta = ROLE_META[r.role as keyof typeof ROLE_META];
              return (
                <div key={r.role} className="flex items-center gap-2">
                  <span
                    className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-medium"
                    style={{
                      background: meta ? `${meta.color}18` : "var(--bg-card)",
                      color: meta?.color ?? "var(--text-muted)",
                    }}
                  >
                    {meta?.label ?? r.role}
                  </span>
                  <span className="text-xs flex-1" style={{ color: "var(--text-secondary)" }}>
                    {r.count.toLocaleString("id-ID")}
                  </span>
                </div>
              );
            })}
            {summary.byRole.length === 0 && (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>—</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
