"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { HourlyBucket } from "@/lib/types";

interface Props { data: HourlyBucket[] }

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean; payload?: { color: string; name: string; value: number }[]; label?: string
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-3 py-2.5 rounded-xl text-xs"
      style={{
        background: "#0d1425",
        border: "1px solid #1e2d42",
        boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
      }}
    >
      <p className="font-semibold mb-2" style={{ color: "#94a3b8" }}>{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span style={{ color: "#94a3b8" }}>{p.name}</span>
          <span className="font-bold ml-auto pl-4" style={{ color: "#e2e8f0" }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export function ActivityChart({ data }: Props) {
  const displayData = data.filter((_, i) => i % 2 === 0 || i === data.length - 1);

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={displayData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
        <defs>
          <linearGradient id="gOk"   x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#10b981" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gFail" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gOut"  x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.20} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gLock" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.20} />
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1a2a3a" vertical={false} />
        <XAxis
          dataKey="hour"
          tick={{ fill: "#3a4a5a", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: "#3a4a5a", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          width={28}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="LOGIN_OK"   name="Login OK"   stroke="#10b981" strokeWidth={1.5} fill="url(#gOk)"   dot={false} />
        <Area type="monotone" dataKey="LOGIN_FAIL" name="Login Gagal" stroke="#ef4444" strokeWidth={1.5} fill="url(#gFail)" dot={false} />
        <Area type="monotone" dataKey="LOGOUT"     name="Logout"      stroke="#6366f1" strokeWidth={1.5} fill="url(#gOut)"  dot={false} />
        <Area type="monotone" dataKey="LOCKED"     name="Terkunci"    stroke="#f59e0b" strokeWidth={1.5} fill="url(#gLock)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
