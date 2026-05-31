"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatNumber } from "@/lib/format";

export type MarketSeriesPoint = {
  label: string;
  index: number;
};

export function DashboardMarketChart({ series }: { series: MarketSeriesPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={series} margin={{ top: 12, right: 8, left: 8, bottom: 6 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.24)" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={{ stroke: "var(--line)" }} />
        <YAxis domain={["dataMin - 8", "dataMax + 8"]} tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={{ stroke: "var(--line)" }} width={58} />
        <Tooltip formatter={(value) => formatNumber(Number(value))} />
        <Area type="monotone" dataKey="index" stroke="#f97316" strokeWidth={3} fill="#f9731633" isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
