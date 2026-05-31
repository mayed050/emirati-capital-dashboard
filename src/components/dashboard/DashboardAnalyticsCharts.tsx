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
import { useLanguage } from "@/context/languageContext";

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
  const { language } = useLanguage();

  return (
    <section className="grid gap-4 xl:grid-cols-2">
      <ChartPanel title={language === "ar" ? "توزيع القطاعات" : "Sector Distribution"}>
        <ResponsiveContainer width="100%" height={285}>
          <PieChart>
            <Pie data={sectorData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={98} paddingAngle={2} isAnimationActive={false}>
              {sectorData.map((entry, index) => (
                <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value, name) => [language === "ar" ? `${value} أسهم` : `${value} Stocks`, name]} />
          </PieChart>
        </ResponsiveContainer>
        <Legend data={sectorData} />
      </ChartPanel>

      <ChartPanel title={language === "ar" ? "أعلى العوائد النقدية للقادة (%)" : "Top Dividend Yields of Leaders (%)"}>
        <div className="grid gap-3 h-[285px] overflow-y-auto pr-1">
          {topYields.slice(0, 4).map((item, index) => {
            return (
              <div 
                key={item.symbol} 
                className="flex items-center justify-between p-3 rounded-xl border border-[color:var(--line)] bg-[color:var(--surface-strong)] hover:border-emerald-500/35 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/12 text-sm font-black text-emerald-500">
                    #{index + 1}
                  </span>
                  <div>
                    <span className="block font-black text-[color:var(--foreground)]">{item.symbol}</span>
                    <span className="block text-xs font-bold text-[color:var(--muted)]">
                      {language === "ar" ? "قائد توزيعات" : "Dividend Leader"}
                    </span>
                  </div>
                </div>
                
                <div className="text-right">
                  <span className="number block text-lg font-black text-emerald-500">{item.yield}%</span>
                  <div className="mt-1 h-1.5 w-24 rounded-full bg-[color:var(--line)] overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-emerald-500" 
                      style={{ width: `${Math.min(item.yield * 10, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
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
