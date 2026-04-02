"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Reading } from "@/lib/api";

interface ChartProps {
  data: Reading[];
  dataKey: keyof Reading;
  title: string;
  color: string;
  unit?: string;
}

export default function Chart({ data, dataKey, title, color, unit }: ChartProps) {
  const chartData = data.map((r) => ({
    time: new Date(r.timestamp).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    value: typeof r[dataKey] === "string" ? parseFloat(r[dataKey] as string) : r[dataKey],
  }));

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              fontSize: 12,
              border: "none",
              boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
              padding: "8px 12px",
            }}
            formatter={(val: number) => [`${val}${unit ? " " + unit : ""}`, title]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#grad-${dataKey})`}
            dot={false}
            activeDot={{ r: 3, stroke: color, fill: "#fff", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
