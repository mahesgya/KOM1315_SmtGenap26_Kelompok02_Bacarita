"use client";

import { useEffect, useRef, useState } from "react";
import type { LogEntry } from "@/lib/types";
import { EVENT_META, ROLE_META } from "@/lib/types";
import { Terminal } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Props {
  logs: LogEntry[];
}

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
    <Card className="overflow-hidden gap-0 py-0">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-3 border-b bg-muted/30">
        <Terminal size={14} className="text-primary" />
        <span className="text-sm font-semibold">Live Log Stream</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <span className="text-[11px] text-emerald-500">live</span>
        </div>
      </div>

      {/* Log entries */}
      <ScrollArea className="h-[320px]">
        <div className="font-mono">
          {visible.map((log, idx) => {
            const ts = new Date(log.timestamp);
            const time = ts.toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            });
            const isNew = idx === 0;
            return (
              <div
                key={log.id}
                className={cn(
                  "flex items-center gap-3 px-5 py-2 text-xs border-b border-border/50 hover:bg-muted/30 transition-colors",
                  isNew && "log-entry-new bg-primary/5"
                )}
              >
                <span className="shrink-0 w-20 text-[10px] text-muted-foreground">{time}</span>
                <EventBadge event={log.event} />
                <RoleBadge role={log.role} />
                <span className="flex-1 truncate text-muted-foreground">
                  {log.userId ? (
                    <span className="text-foreground/70">{log.userId}</span>
                  ) : (
                    <span className="text-muted-foreground/50">—</span>
                  )}
                </span>
                <span className="shrink-0 text-[10px] text-muted-foreground/70">
                  {log.ip ?? "—"}
                </span>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </Card>
  );
}
