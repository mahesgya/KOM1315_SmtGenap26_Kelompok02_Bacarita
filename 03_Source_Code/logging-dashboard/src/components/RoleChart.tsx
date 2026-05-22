"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { RoleBucket } from "@/lib/types";
import { ROLE_META } from "@/lib/types";

interface Props { data: RoleBucket[] }

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: { color: string; name: string; value: number }[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-3 py-2.5 rounded-xl text-xs"
      style={{ background: "#0d1425", border: "1px solid #1e2d42", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}
    >
      <p className="font-semibold capitalize mb-2" style={{ color: "#94a3b8" }}>
        {ROLE_META[label as keyof typeof ROLE_META]?.label ?? label}
      </p>
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const roleTick = (props: any) => {
  const { x, y, payload } = props as { x: number; y: number; payload: { value: string } };
  const meta = ROLE_META[payload?.value as keyof typeof ROLE_META];
  if (!meta) return null;
  return (
    <text x={x} y={y} dy={4} textAnchor="end" fill={meta.color} fontSize={11} fontWeight={500}>
      {meta.label}
    </text>
  );
};

export function RoleChart({ data }: Props) {
  const formatted = data.map(d => ({
    ...d,
    role: d.role,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={formatted} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 60 }} barSize={6}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1a2a3a" horizontal={false} />
        <XAxis type="number" tick={{ fill: "#3a4a5a", fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="role" tick={roleTick} axisLine={false} tickLine={false} width={64} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(99,102,241,0.05)" }} />
        <Bar dataKey="LOGIN_OK"   name="OK"       fill="#10b981" radius={[0, 3, 3, 0]} />
        <Bar dataKey="LOGIN_FAIL" name="Gagal"    fill="#ef4444" radius={[0, 3, 3, 0]} />
        <Bar dataKey="LOGOUT"     name="Logout"   fill="#6366f1" radius={[0, 3, 3, 0]} />
        <Bar dataKey="LOCKED"     name="Terkunci" fill="#f59e0b" radius={[0, 3, 3, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
