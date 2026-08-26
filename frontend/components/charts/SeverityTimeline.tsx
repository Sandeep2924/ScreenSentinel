"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { TimelinePoint } from "@/lib/types";

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-sm border border-line bg-panel2 px-3 py-2 shadow-panel">
      <p className="font-mono text-[10px] uppercase tracking-widest2 text-ink-faint">{label}</p>
      {payload
        .slice()
        .reverse()
        .map((p: any) => (
          <p key={p.dataKey} className="font-mono text-xs" style={{ color: p.fill }}>
            {p.dataKey}: {p.value}
          </p>
        ))}
    </div>
  );
}

export default function SeverityTimeline({ data }: { data: TimelinePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#232936" strokeDasharray="3 3" />
        <XAxis
          dataKey="bucket"
          tick={{ fill: "#5B6472", fontSize: 10, fontFamily: "IBM Plex Mono, monospace" }}
          axisLine={{ stroke: "#232936" }}
          tickLine={false}
          interval={2}
        />
        <YAxis
          tick={{ fill: "#5B6472", fontSize: 10, fontFamily: "IBM Plex Mono, monospace" }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
        <Bar dataKey="info" stackId="s" fill="#5B8CA8" radius={[0, 0, 0, 0]} />
        <Bar dataKey="warning" stackId="s" fill="#F5A524" radius={[0, 0, 0, 0]} />
        <Bar dataKey="critical" stackId="s" fill="#E5484D" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
