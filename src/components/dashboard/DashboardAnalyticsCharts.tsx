"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatPlainPercent } from "@/lib/format";

type SectorDatum = {
  name: string;
  value: number;
};

type YieldDatum = {
  symbol: string;
  yield: number;
};

const chartColors = ["#3aa0ff", "#21c98b", "#7c5cff", "#ffb020", "#ff5a72", "#14b8a6", "#8b5cf6", "#84cc16"];

export function DashboardAnalyticsCharts({
  sectorData,
  topYields,
}: {
  sectorData: SectorDatum[];
  topYields: YieldDatum[];
}) {
  return (
    <section className="grid gap-4 xl:grid-cols-2">
      <ChartPanel title="توزيع القطاعات">
        <ResponsiveContainer width="100%" height={285}>
          <PieChart>
            <Pie data={sectorData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={98} paddingAngle={2} isAnimationActive={false}>
              {sectorData.map((entry, index) => (
                <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value, name) => [`${value} أسهم`, name]} />
          </PieChart>
        </ResponsiveContainer>
        <Legend data={sectorData} />
      </ChartPanel>

      <ChartPanel title="أعلى العوائد النقدية للقادة (%)">
        <ResponsiveContainer width="100%" height={285}>
          <BarChart data={topYields} layout="vertical" margin={{ top: 8, right: 12, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.24)" />
            <XAxis type="number" tick={{ fontSize: 12, fill: "var(--muted)" }} axisLine={{ stroke: "var(--line)" }} />
            <YAxis dataKey="symbol" type="category" tick={{ fontSize: 12, fill: "var(--muted)" }} axisLine={{ stroke: "var(--line)" }} width={82} />
            <Tooltip formatter={(value) => formatPlainPercent(Number(value))} />
            <Bar dataKey="yield" fill="#21c98b" radius={[6, 6, 6, 6]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </ChartPanel>
    </section>
  );
}

function ChartPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="fusion-panel rounded-2xl border-t-2 border-orange-500 p-4">
      <div className="mb-4">
        <h2 className="text-xl font-black text-orange-500">{title}</h2>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Legend({ data }: { data: SectorDatum[] }) {
  return (
    <div className="mt-2 flex flex-wrap justify-center gap-3">
      {data.map((item, index) => (
        <span key={item.name} className="inline-flex items-center gap-1 text-xs font-bold text-[color:var(--muted)]">
          <span className="h-3 w-3 rounded-sm" style={{ background: chartColors[index % chartColors.length] }} />
          {item.name} ({item.value})
        </span>
      ))}
    </div>
  );
}
