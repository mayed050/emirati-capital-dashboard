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
import { useLanguage } from "@/context/languageContext";
import { formatDate, formatNumber, formatShortDate } from "@/lib/format";
import type { MarketIndexPoint } from "@/types";

export function DashboardMarketChart({ series }: { series: MarketIndexPoint[] }) {
  const { language } = useLanguage();

  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={series} margin={{ top: 12, right: 8, left: 8, bottom: 6 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.24)" />
        <XAxis dataKey="date" tickFormatter={(value) => formatShortDate(value, language)} minTickGap={48} tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={{ stroke: "var(--line)" }} />
        <YAxis domain={["dataMin - 8", "dataMax + 8"]} tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={{ stroke: "var(--line)" }} width={58} />
        <Tooltip labelFormatter={(value) => formatDate(String(value))} formatter={(value) => formatNumber(Number(value))} />
        <Area type="monotone" dataKey="index" stroke="#f97316" strokeWidth={2} fill="#f9731633" isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
