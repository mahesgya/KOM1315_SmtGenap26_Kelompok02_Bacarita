"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { EventSlice } from "@/lib/types";

interface Props { data: EventSlice[]; total: number }

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number; payload: EventSlice }[] }) => {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div
      className="px-3 py-2 rounded-xl text-xs"
      style={{ background: "#0d1425", border: "1px solid #1e2d42", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}
    >
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.payload.color }} />
        <span style={{ color: "#94a3b8" }}>{p.name}</span>
        <span className="font-bold ml-2" style={{ color: "#e2e8f0" }}>{p.value}</span>
      </div>
    </div>
  );
};

export function DonutChart({ data, total }: Props) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full" style={{ height: 180 }}>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={78}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} opacity={0.9} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            {total.toLocaleString("id-ID")}
          </p>
          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>total events</p>
        </div>
      </div>

      {/* Legend */}
      <div className="w-full mt-2 space-y-1.5">
        {data.map((item) => {
          const pct = Math.round((item.value / total) * 100);
          return (
            <div key={item.name} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }} />
              <span className="text-[11px] flex-1" style={{ color: "var(--text-secondary)" }}>{item.name}</span>
              <span className="text-[11px] font-medium" style={{ color: "var(--text-primary)" }}>{item.value}</span>
              <div className="w-16 h-1 rounded-full overflow-hidden" style={{ background: "var(--bg-border)" }}>
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: item.color }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
