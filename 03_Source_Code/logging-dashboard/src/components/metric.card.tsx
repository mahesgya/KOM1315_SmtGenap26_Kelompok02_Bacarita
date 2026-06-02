"use client";

import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Props {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  accent: string;
  trend?: "up" | "down";
  alert?: boolean;
}

export function MetricCard({ icon, label, value, sub, accent, trend, alert }: Props) {
  return (
    <Card
      className={cn("transition-all duration-200 hover:scale-[1.02] gap-3")}
      style={alert ? { borderColor: `${accent}50`, boxShadow: `0 0 14px ${accent}18` } : {}}
    >
      <CardContent className="flex flex-col gap-3">
        {/* Top row */}
        <div className="flex items-start justify-between">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: `${accent}18`, color: accent }}
          >
            {icon}
          </div>
          <div className="flex items-center gap-1">
            {alert && <AlertTriangle size={11} style={{ color: accent }} />}
            {trend === "up"   && <TrendingUp  size={11} className="text-emerald-500" />}
            {trend === "down" && <TrendingDown size={11} className="text-destructive" />}
          </div>
        </div>

        {/* Value */}
        <div>
          <p className="text-xl font-bold leading-none">{value}</p>
          <p className="text-[11px] mt-1 font-medium" style={{ color: accent }}>{label}</p>
          <p className="text-[10px] mt-0.5 text-muted-foreground">{sub}</p>
        </div>

        {/* Accent bar */}
        <div className="h-0.5 rounded-full" style={{ background: `${accent}30` }}>
          <div className="h-full w-3/4 rounded-full" style={{ background: accent }} />
        </div>
      </CardContent>
    </Card>
  );
}
