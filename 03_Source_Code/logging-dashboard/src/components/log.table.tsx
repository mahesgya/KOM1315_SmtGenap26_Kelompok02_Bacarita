"use client";

import type { AuditPagination, LogEntry, AuditEvent, AuditRole } from "@/lib/types";
import { EVENT_META, ROLE_META } from "@/lib/types";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold whitespace-nowrap"
      style={{ background: m.bg, color: m.color, border: `1px solid ${m.color}25` }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: m.color }} />
      {m.label}
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

export function LogTable({ logs, pagination, isLoading, onPreviousPage, onNextPage }: Props) {
  return (
    <Card className="overflow-hidden gap-0 py-0">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b bg-muted/30">
        <div>
          <p className="text-sm font-semibold">Audit Log Table</p>
          <p className="text-[11px] text-muted-foreground">
            Menampilkan {logs.length} dari {pagination.totalItems.toLocaleString("id-ID")} event.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              {["Timestamp", "Event", "Role", "User ID", "IP Address", "User Agent"].map((h) => (
                <TableHead key={h} className="text-[10px] uppercase tracking-wider font-semibold">
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => {
              const ts = new Date(log.timestamp);
              const isAlert = log.event === "LOCKED" || log.event === "LOGIN_FAIL";
              return (
                <TableRow
                  key={log.id}
                  className={cn("text-xs", isAlert && "bg-destructive/5 dark:bg-destructive/5")}
                >
                  <TableCell className="font-mono text-muted-foreground py-2.5">
                    <div>
                      {ts.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "2-digit" })}
                    </div>
                    <div className="text-[10px]">{ts.toLocaleTimeString("id-ID")}</div>
                  </TableCell>
                  <TableCell className="py-2.5">
                    <EventBadge event={log.event} />
                  </TableCell>
                  <TableCell className="py-2.5">
                    <RoleBadge role={log.role} />
                  </TableCell>
                  <TableCell className="font-mono text-xs py-2.5">
                    {log.userId ?? <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="font-mono text-xs py-2.5">
                    {log.ip ?? "—"}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-[10px] text-muted-foreground py-2.5">
                    {log.userAgent ?? "—"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {!isLoading && logs.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Tidak ada log yang sesuai filter.
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
            const firstPage = Math.max(1, Math.min(pagination.page - 2, pagination.totalPages - 4));
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
