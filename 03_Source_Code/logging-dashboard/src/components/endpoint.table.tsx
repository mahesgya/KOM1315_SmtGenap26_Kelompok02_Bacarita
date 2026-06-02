"use client";

import type { ApiLogSummary } from "@/lib/types";
import { METHOD_META, ROLE_META } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
    <Card className="overflow-hidden flex flex-col gap-0 py-0">
      <CardHeader className="border-b px-5 py-4">
        <CardTitle className="text-sm">Top Endpoints</CardTitle>
        <CardDescription className="text-[11px]">
          10 endpoint paling banyak diakses
        </CardDescription>
      </CardHeader>

      <div className="flex-1 overflow-y-auto divide-y divide-border/50">
        {summary.byEndpoint.map((item, i) => (
          <div key={item.endpoint} className="px-5 py-2.5 flex items-center gap-3">
            <span className="text-xs font-bold w-5 text-center shrink-0 text-muted-foreground">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-mono truncate text-foreground/70">{item.endpoint}</p>
              <div className="h-1 rounded-full mt-1.5 bg-muted">
                <div
                  className="h-full rounded-full bg-primary/50"
                  style={{ width: `${(item.count / maxCount) * 100}%` }}
                />
              </div>
            </div>
            <span className="text-xs font-semibold tabular-nums shrink-0">
              {item.count.toLocaleString("id-ID")}
            </span>
          </div>
        ))}
        {summary.byEndpoint.length === 0 && (
          <p className="px-5 py-8 text-xs text-center text-muted-foreground">Belum ada data</p>
        )}
      </div>

      <CardContent className="border-t bg-muted/30 py-4 px-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider mb-2.5 text-muted-foreground">
              Per Method
            </p>
            <div className="space-y-2">
              {summary.byMethod.map((m) => (
                <div key={m.method} className="flex items-center gap-2">
                  <MethodBadge method={m.method} />
                  <span className="text-xs flex-1 font-mono text-foreground/70">
                    {m.count.toLocaleString("id-ID")}
                  </span>
                </div>
              ))}
              {summary.byMethod.length === 0 && (
                <p className="text-xs text-muted-foreground">—</p>
              )}
            </div>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-wider mb-2.5 text-muted-foreground">
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
                        background: meta ? `${meta.color}18` : undefined,
                        color: meta?.color,
                      }}
                    >
                      {meta?.label ?? r.role}
                    </span>
                    <span className="text-xs flex-1 text-foreground/70">
                      {r.count.toLocaleString("id-ID")}
                    </span>
                  </div>
                );
              })}
              {summary.byRole.length === 0 && (
                <p className="text-xs text-muted-foreground">—</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
