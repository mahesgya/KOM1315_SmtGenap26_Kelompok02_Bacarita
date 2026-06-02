"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ApiLogItem, ApiLogPagination, AuditRole } from "@/lib/types";
import { METHOD_META, ROLE_META } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

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
  if (code === null) return <span className="text-muted-foreground">—</span>;
  const color =
    code >= 500 ? "#ef4444" : code >= 400 ? "#f59e0b" : code >= 200 ? "#10b981" : "#94a3b8";
  const bg =
    code >= 500
      ? "rgba(239,68,68,0.12)"
      : code >= 400
        ? "rgba(245,158,11,0.12)"
        : code >= 200
          ? "rgba(16,185,129,0.12)"
          : "rgba(148,163,184,0.12)";
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
  if (!role) return <span className="text-muted-foreground">—</span>;
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
    <Card className="overflow-hidden gap-0 py-0">
      <div className="flex items-center justify-between px-5 py-4 border-b bg-muted/30">
        <div>
          <p className="text-sm font-semibold">API Request Log</p>
          <p className="text-[11px] text-muted-foreground">
            Menampilkan {items.length} dari {pagination.totalItems.toLocaleString("id-ID")} request
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              {["Timestamp", "Method", "Endpoint", "Status", "Durasi", "Role", "User ID", "IP"].map(
                (h) => (
                  <TableHead key={h} className="text-[10px] uppercase tracking-wider font-semibold">
                    {h}
                  </TableHead>
                )
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const ts = new Date(item.createdAt);
              const isError = item.statusCode !== null && item.statusCode >= 400;
              return (
                <TableRow
                  key={item.id}
                  className={cn("text-xs", isError && "bg-destructive/5 dark:bg-destructive/5")}
                >
                  <TableCell className="font-mono text-muted-foreground py-2.5">
                    <div>
                      {ts.toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "2-digit",
                      })}
                    </div>
                    <div className="text-[10px]">{ts.toLocaleTimeString("id-ID")}</div>
                  </TableCell>
                  <TableCell className="py-2.5">
                    <MethodBadge method={item.method} />
                  </TableCell>
                  <TableCell className="max-w-[220px] py-2.5">
                    <p className="font-mono truncate text-[11px] text-foreground/70">
                      {item.endpoint}
                    </p>
                  </TableCell>
                  <TableCell className="py-2.5">
                    <StatusBadge code={item.statusCode} />
                  </TableCell>
                  <TableCell className="font-mono text-[11px] text-muted-foreground py-2.5">
                    {item.durationMs !== null ? `${item.durationMs}ms` : "—"}
                  </TableCell>
                  <TableCell className="py-2.5">
                    <RoleBadge role={item.role} />
                  </TableCell>
                  <TableCell className="font-mono text-xs py-2.5 text-foreground/70">
                    {item.userId ?? <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground py-2.5">
                    {item.ipAddress ?? "—"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {!isLoading && items.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Tidak ada request yang sesuai filter.
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-5 py-3 border-t bg-muted/30">
        <span className="text-xs text-muted-foreground">
          Halaman {pagination.page} dari {pagination.totalPages}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-xs"
            onClick={onPreviousPage}
            disabled={pagination.page <= 1 || isLoading}
          >
            <ChevronLeft size={13} />
          </Button>
          {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
            const firstPage = Math.max(
              1,
              Math.min(pagination.page - 2, pagination.totalPages - 4)
            );
            const p = firstPage + i;
            return (
              <span
                key={p}
                className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-medium",
                  p === pagination.page
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {p}
              </span>
            );
          })}
          <Button
            variant="outline"
            size="icon-xs"
            onClick={onNextPage}
            disabled={pagination.page >= pagination.totalPages || isLoading}
          >
            <ChevronRight size={13} />
          </Button>
        </div>
      </div>
    </Card>
  );
}
