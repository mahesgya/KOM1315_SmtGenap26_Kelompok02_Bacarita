"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { ApiLogTrendPoint } from "@/lib/types";

interface Props {
  data: ApiLogTrendPoint[];
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { color: string; name: string; value: number; payload: ApiLogTrendPoint }[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  const pt = payload[0]?.payload;
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2.5 text-xs shadow-lg">
      <p className="font-semibold mb-2 text-muted-foreground">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}</span>
          <span className="font-bold ml-auto pl-4 text-foreground">{p.value}</span>
        </div>
      ))}
      {pt && (
        <p className="text-[10px] mt-1.5 border-t border-border pt-1.5 text-muted-foreground">
          Avg {pt.avgDurationMs}ms
        </p>
      )}
    </div>
  );
};

export function ApiRequestChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
        <defs>
          <linearGradient id="gApiTotal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gApiSuccess" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#10b981" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gApiError" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.15)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: "rgba(100,116,139,0.7)", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: "rgba(100,116,139,0.7)", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          width={28}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="total"        name="Total"  stroke="#6366f1" strokeWidth={1.5} fill="url(#gApiTotal)"   dot={false} />
        <Area type="monotone" dataKey="successCount" name="Sukses" stroke="#10b981" strokeWidth={1.5} fill="url(#gApiSuccess)" dot={false} />
        <Area type="monotone" dataKey="errorCount"   name="Error"  stroke="#ef4444" strokeWidth={1.5} fill="url(#gApiError)"   dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
