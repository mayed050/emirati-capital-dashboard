"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Building2, Coins, Percent, Calculator, Layers } from "lucide-react";
import { useLiveMarket } from "@/hooks/useLiveMarket";
import { getUnifiedMarketDataset } from "@/lib/data/unified-market-data";
import { DashboardQuickActions } from "@/components/dashboard/DashboardQuickActions";
import { StockIcon } from "@/components/StockIcon";
import { formatCurrency, formatCurrencyFull, formatNumber, formatPercent, formatPlainPercent, percentClass } from "@/lib/format";
import { useLanguage } from "@/context/languageContext";
import { AlertManager } from "@/components/AlertManager";
import {
  buildSmartAlerts,
  calculateFinancialHealthScore,
  getExpectedTrend,
} from "@/utils/analyticsEngine";
import type { MarketCode, StockRecord } from "@/types";

type MovementMode = "gainers" | "losers" | "value" | "volume";

const unifiedMarket = getUnifiedMarketDataset();
const DATASET_INFO = unifiedMarket.dataset;
const DashboardMarketChart = dynamic(
  () => import("@/components/dashboard/DashboardMarketChart").then((module) => module.DashboardMarketChart),
  { ssr: false, loading: () => <ChartSkeleton height="h-[320px]" /> },
);
const DashboardAnalyticsCharts = dynamic(
  () => import("@/components/dashboard/DashboardAnalyticsCharts").then((module) => module.DashboardAnalyticsCharts),
  { ssr: false, loading: () => <ChartSkeleton height="h-[285px]" /> },
);

const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const marketLabels: Record<MarketCode, string> = {
  DFM: "دبي",
  ADX: "أبوظبي",
};

const movementModes: { key: MovementMode; label: string }[] = [
  { key: "gainers", label: "المرتفعة" },
  { key: "losers", label: "المنخفضة" },
  { key: "volume", label: "النشطة بالكمية" },
  { key: "value", label: "النشطة بالقيمة" },
];

const gulfIndices = [
  { name: "تاسي", value: 11027.54, points: 41.98, change: 0.38 },
  { name: "نمو", value: 22905.5, points: 125.9, change: 0.55 },
  { name: "الكويت", value: 9304.29, points: -68.97, change: -0.74 },
  { name: "قطر", value: 10591.56, points: -115.14, change: -1.08 },
  { name: "مسقط", value: 7775.42, points: 0, change: 0 },
  { name: "البحرين", value: 1979.05, points: 17.17, change: 0.88 },
];

const globalIndices = [
  { name: "S&P 500", value: 5921.4, points: 18.2, change: 0.31 },
  { name: "Nasdaq 100", value: 21488.9, points: 92.1, change: 0.43 },
  { name: "FTSE 100", value: 8720.6, points: -21.5, change: -0.25 },
  { name: "Nikkei 225", value: 37891.2, points: 127.4, change: 0.34 },
];

export function Dashboard() {
  const { t, language } = useLanguage();
  const [selectedMarket, setSelectedMarket] = useState<MarketCode>("DFM");
  const [movementMode, setMovementMode] = useState<MovementMode>("gainers");
  
  const { stocks, directions } = useLiveMarket();
  const overviewStocks = useMemo(() => stocks.filter((s) => s.marketLeader), [stocks]);
  const marketStocks = useMemo(
    () => overviewStocks.filter((stock) => stock.market === selectedMarket),
    [overviewStocks, selectedMarket],
  );
  const marketSummary = useMemo(() => buildMarketSummary(marketStocks, selectedMarket), [marketStocks, selectedMarket]);
  const alerts = buildSmartAlerts(overviewStocks).slice(0, 10);
  const marketAlerts = buildSmartAlerts(marketStocks).slice(0, 3);
  const movementRows = useMemo(() => buildMovementRows(marketStocks, movementMode), [marketStocks, movementMode]);
  const calendarEvents = useMemo(() => buildCalendarEvents(marketStocks), [marketStocks]);
  const calendarDays = useMemo(() => buildCalendarDays(2026, 4, calendarEvents), [calendarEvents]);
  const sectorData = useMemo(() => groupBySector(marketStocks), [marketStocks]);
  const topYields = useMemo(() => {
    return [...marketStocks]
      .sort((a, b) => b.fundamentals.dividendYield - a.fundamentals.dividendYield)
      .slice(0, 8)
      .map((stock) => ({ symbol: stock.symbol, yield: Number(stock.fundamentals.dividendYield.toFixed(2)) }));
  }, [marketStocks]);
  const healthRows = useMemo(() => {
    return marketStocks
      .map((stock) => ({ stock, health: calculateFinancialHealthScore(stock), trend: getExpectedTrend(stock) }))
      .sort((a, b) => b.health.score - a.health.score);
  }, [marketStocks]);
  const leaderDfmCount = unifiedMarket.counts.dfmLeaders;
  const leaderAdxCount = unifiedMarket.counts.adxLeaders;
  const extraWatchlistCount = unifiedMarket.counts.extraWatchlist;

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5">
      <section className="fusion-panel overflow-hidden rounded-2xl p-5 md:p-7">
        <div className="mb-5 rounded-xl border border-[color:var(--line)] bg-[color:var(--chip)] px-4 py-3 text-sm leading-7 text-[color:var(--muted)]">
          <strong className="text-[color:var(--foreground)]">تنويه:</strong> المنصة معلوماتية للمتابعة فقط، وتعرض لقطة غير
          حية لقادة سوقي دبي وأبوظبي دون أي توصية شراء أو بيع.
        </div>
        <div className="grid gap-6">
          <div>
            <p className="text-sm font-black text-orange-500">لقطة سوق مرتبة حسب مرجع الصورة</p>
            <h1 className="mt-3 max-w-4xl text-3xl font-black leading-tight text-[color:var(--foreground)] md:text-5xl">
              نظرة عامة على السوق
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-8 text-[color:var(--muted)]">
              ترتيب البطاقات يبدأ بالسوق وبياناته ثم الحركة والمؤشرات والتقويم، مع إبقاء أدوات منصة الأسهم الإماراتية
              للتحليل والمحفظة والتنبيهات.
            </p>
            <p className="mt-2 text-sm font-bold text-emerald-500">
              آخر تحديث داخلي: {DATASET_INFO.snapshotDate} · قادة دبي {leaderDfmCount} · قادة أبوظبي {leaderAdxCount} · متابعة إضافية {extraWatchlistCount}
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <HeroMetric label="قادة السوق" value={formatNumber(unifiedMarket.counts.leaders)} hint={`${leaderDfmCount} دبي · ${leaderAdxCount} أبوظبي`} />
            <HeroMetric label="متوسط العائد" value={formatPlainPercent(marketSummary.avgYield)} hint={`لقادة ${marketLabels[selectedMarket]}`} />
            <HeroMetric 
              label={language === "ar" ? "أعلى عائد نقدي" : "Highest Cash Yield"} 
              value={topYields[0] ? `${topYields[0].yield}%` : "0.00%"} 
              hint={topYields[0] ? `${topYields[0].symbol} · ${language === "ar" ? "قائد العوائد" : "Yield Leader"}` : ""} 
              tone="text-emerald-500" 
            />
            <HeroMetric label="القيمة السوقية" value={formatCurrency(marketSummary.totalMarketCap)} hint={`تداول: ${formatCurrency(marketSummary.totalTradeValue)}`} />
            <HeroMetric label="تنبيهات ذكية" value={formatNumber(alerts.length)} hint="استحقاقات وصحة مالية" tone="text-amber-500" />
          </div>
        </div>
      </section>

      <section className="fusion-panel rounded-2xl border-t-2 border-orange-500 p-4">
        <SectionHeader
          title={`الإمارات (${selectedMarket})`}
          subtitle={`${marketSummary.sessionDate} · مؤشر داخلي لقادة سوق ${marketLabels[selectedMarket]}`}
          action={<MarketTabs selectedMarket={selectedMarket} onChange={setSelectedMarket} />}
        />
        <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl bg-[color:var(--chip)] px-3 py-2">
              <span className="font-black text-sky-500">سوق {marketLabels[selectedMarket]}</span>
              <span className="number text-lg font-black text-[color:var(--foreground)]">{formatNumber(marketSummary.latestIndex)}</span>
              <span className={`number inline-flex items-center gap-1 text-sm font-black ${percentClass(marketSummary.changePercent)}`}>
                {marketSummary.changePercent >= 0 ? <ArrowUpRight size={16} aria-hidden /> : <ArrowDownRight size={16} aria-hidden />}
                {formatPercent(marketSummary.changePercent)}
              </span>
              <span className="number text-sm font-bold text-[color:var(--muted)]">{formatCurrency(marketSummary.totalTradeValue)}</span>
            </div>
            <DashboardMarketChart series={marketSummary.series} />
          </div>

          <div className="grid content-start gap-3">
            {marketSummary.indexCards.map((item) => (
              <div key={item.label} className="rounded-xl border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-3">
                <p className="text-xs font-black text-[color:var(--muted)]">{item.label}</p>
                <p className="number mt-1 text-lg font-black text-[color:var(--foreground)]">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="fusion-panel rounded-2xl border-t-2 border-orange-500 p-4">
        <SectionHeader title="بيانات السوق" subtitle={`أرقام مجمعة لقادة سوق ${marketLabels[selectedMarket]} في اللقطة`} />
        <div className="grid gap-2 md:grid-cols-3">
          {marketSummary.dataRows.map((row) => (
            <div key={row.label} className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-xl border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-3 py-3">
              <span className="text-sm font-black text-[color:var(--muted)]">{row.label}</span>
              <span className="number text-sm font-black text-[color:var(--foreground)]">{row.value}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="fusion-panel rounded-2xl border-t-2 border-orange-500 p-4">
        <SectionHeader
          title="حركة السوق"
          subtitle={`قائمة مرتبة حسب ${movementModes.find((item) => item.key === movementMode)?.label}`}
          action={
            <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
              {movementModes.map((mode) => (
                <button
                  key={mode.key}
                  type="button"
                  onClick={() => setMovementMode(mode.key)}
                  className={`min-h-9 shrink-0 rounded-lg px-3 text-sm font-black ${
                    movementMode === mode.key ? "bg-orange-500 text-white" : "market-chip"
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          }
        />
        <div className="overflow-x-auto rounded-xl border border-[color:var(--line)]">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead className="text-[color:var(--muted)] border-b border-[color:var(--line)] bg-[color:var(--chip)]">
              <tr>
                {[
                  { label: "الشركة", icon: <Building2 size={14} className="text-sky-500 shrink-0" /> },
                  { label: "السعر", icon: <Coins size={14} className="text-amber-500 shrink-0" /> },
                  { label: "التغير", icon: <Percent size={14} className="text-violet-500 shrink-0" /> },
                  { label: "مكرر الربحية", icon: <Calculator size={14} className="text-slate-400 shrink-0" /> },
                  { label: "قيمة التداول", icon: <Layers size={14} className="text-teal-500 shrink-0" /> }
                ].map((col) => (
                  <th key={col.label} className="px-3 py-3.5 text-start font-black">
                    <span className="inline-flex items-center gap-1.5">
                      {col.icon}
                      <span>{col.label}</span>
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {movementRows.map((stock) => {
                const isUp = stock.prices.changePercent >= 0;
                const isZero = stock.prices.changePercent === 0;

                return (
                  <tr key={stock.symbol} className="border-b border-[color:var(--line)] last:border-0 hover:bg-sky-500/10">
                    <td className="px-3 py-3">
                      <Link href={`/stocks/${stock.symbol}`} className="inline-flex items-center gap-3 font-black text-sky-500">
                        <StockIcon stock={stock} size="sm" />
                        <span>
                          <span className="block">{stock.symbol}</span>
                          <span className="block text-xs text-[color:var(--muted)]">{stock.nameAr}</span>
                        </span>
                      </Link>
                    </td>
                    <td className={`number px-3 py-3 font-bold text-start text-[color:var(--foreground)] transition-all ${
                      directions[stock.symbol] === "up"
                        ? "animate-flash-up"
                        : directions[stock.symbol] === "down"
                        ? "animate-flash-down"
                        : ""
                    }`}>{formatCurrency(stock.prices.last)}</td>
                    <td className={`number px-3 py-3 font-black text-start transition-all ${percentClass(stock.prices.changePercent)} ${
                      directions[stock.symbol] === "up"
                        ? "animate-flash-up"
                        : directions[stock.symbol] === "down"
                        ? "animate-flash-down"
                        : ""
                    }`}>
                      <span className="inline-flex items-center gap-1">
                        {!isZero && (isUp ? "↗️" : "↘️")}
                        {formatPercent(stock.prices.changePercent)}
                      </span>
                    </td>
                    <td className="number px-3 py-3 font-bold text-start text-[color:var(--foreground)]">{formatNumber(stock.fundamentals.pe)}</td>
                    <td className="number px-3 py-3 font-bold text-start text-[color:var(--foreground)]">{formatCurrency(stock.prices.tradeValue)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <div className="fusion-panel rounded-2xl border-t-2 border-orange-500 p-4">
          <SectionHeader title="مؤشرات السوق" subtitle={`مقاييس داخلية لقادة ${marketLabels[selectedMarket]}`} />
          <div className="grid gap-3 sm:grid-cols-2">
            {marketSummary.indicatorCards.map((item) => (
              <div key={item.label} className="rounded-xl border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-4 text-center">
                <p className="text-sm font-black text-[color:var(--muted)]">{item.label}</p>
                <p className="number mt-2 text-xl font-black text-orange-500">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="fusion-panel rounded-2xl border-t-2 border-orange-500 p-4">
          <SectionHeader title="أبرز التنبيهات" subtitle="بديل عملي لقائمة التعليقات في الصورة" />
          <div className="grid gap-3">
            {marketAlerts.map((alert) => (
              <article key={alert.id} className="rounded-xl border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-3">
                <p className="text-xs font-black text-sky-500">{alert.symbol ?? "DATA"}</p>
                <h3 className="mt-1 font-black text-[color:var(--foreground)]">{alert.title}</h3>
                <p className="mt-1 text-sm leading-6 text-[color:var(--muted)]">{alert.message}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <DashboardQuickActions />

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="fusion-panel rounded-2xl border-t-2 border-orange-500 p-4">
          <SectionHeader
            title={language === "ar" ? "تقويم التوزيعات" : "Dividend Calendar"}
            subtitle={language === "ar" ? "تقويم استحقاقات التوزيعات وأحداث الدفع" : "Dividend entitlements and payment events calendar"}
            action={<span className="text-sm font-black text-[color:var(--muted)]">May 2026</span>}
          />
          <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-xl border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-3">
              <div className="mb-2 grid grid-cols-7 text-center text-xs font-black text-[color:var(--muted)]">
                {weekdays.map((day) => <span key={day}>{day}</span>)}
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-sm">
                {calendarDays.map((day, index) => (
                  <span
                    key={`${day?.day ?? "blank"}-${index}`}
                    className={`min-h-9 rounded-lg px-1 py-2 font-black ${
                      day?.isToday ? "bg-orange-500 text-white" : day?.hasEvent ? "bg-orange-500/12 text-orange-500" : "text-[color:var(--muted)]"
                    }`}
                  >
                    {day?.day ?? ""}
                  </span>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto rounded-xl border border-[color:var(--line)]">
              <table className="w-full min-w-[380px] border-collapse text-sm">
                <thead>
                  <tr className="text-[color:var(--muted)]">
                    {[
                      language === "ar" ? "الشركة" : "Stock", 
                      language === "ar" ? "الحدث" : "Event", 
                      language === "ar" ? "التاريخ" : "Date", 
                      language === "ar" ? "المبلغ" : "Amount"
                    ].map((heading) => (
                      <th key={heading} className="border-b border-[color:var(--line)] px-3 py-3 text-right font-black">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {calendarEvents.slice(0, 8).map((event) => (
                    <tr key={`${event.symbol}-${event.kind}-${event.date}`} className="border-b border-[color:var(--line)] last:border-0 hover:bg-sky-500/5">
                      <td className="px-3 py-2.5 font-black text-sky-500">{event.symbol}</td>
                      <td className="px-3 py-2.5">{event.kind === "ex" ? (language === "ar" ? "استبعاد" : "Ex-Div") : (language === "ar" ? "دفع" : "Payout")}</td>
                      <td className="number px-3 py-2.5">{event.date}</td>
                      <td className="number px-3 py-2.5 font-bold">{formatCurrency(event.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Live Target Alerts Panel */}
        <AlertManager />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <IndexTable title="مؤشرات الأسواق الخليجية" date="2026/05/26" rows={gulfIndices} />
        <IndexTable title="مؤشرات الأسواق العالمية" date="لقطة مرجعية غير حية" rows={globalIndices} />
      </section>

      <DashboardAnalyticsCharts sectorData={sectorData} topYields={topYields} />

      <section className="fusion-panel rounded-2xl p-4">
        <SectionHeader title="خريطة الصحة والعائد" subtitle="لون الخلية يقرأ الصحة المالية، والنسبة تعرض العائد النقدي." />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-8">
          {healthRows.map(({ stock, health }) => (
            <Link
              key={stock.symbol}
              href={`/stocks/${stock.symbol}`}
              className="rounded-xl border border-[color:var(--line)] p-3 text-center transition hover:scale-[1.02]"
              style={{ background: heatColor(health.score) }}
            >
              <span className="block font-black text-white">{stock.symbol}</span>
              <span className="number mt-1 block text-sm font-black text-white">{health.score}/100</span>
              <span className="number mt-1 block text-xs font-bold text-white/82">{formatPlainPercent(stock.fundamentals.dividendYield)}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function MarketTabs({ selectedMarket, onChange }: { selectedMarket: MarketCode; onChange: (market: MarketCode) => void }) {
  return (
    <div className="flex gap-2">
      {(["DFM", "ADX"] as const).map((market) => (
        <button
          key={market}
          type="button"
          onClick={() => onChange(market)}
          className={`min-h-9 rounded-lg px-3 text-sm font-black ${selectedMarket === market ? "bg-orange-500 text-white" : "market-chip"}`}
        >
          {marketLabels[market]}
        </button>
      ))}
    </div>
  );
}

function HeroMetric({ label, value, hint, tone = "text-[color:var(--foreground)]" }: { label: string; value: string; hint: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-4 shadow-sm">
      <p className="text-xs font-bold text-[color:var(--muted)]">{label}</p>
      <p className={`number mt-2 text-xl font-black ${tone}`}>{value}</p>
      <p className="mt-1 text-xs font-bold text-[color:var(--muted)]">{hint}</p>
    </div>
  );
}

function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h2 className="text-xl font-black text-orange-500">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm leading-6 text-[color:var(--muted)]">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

function ChartSkeleton({ height }: { height: string }) {
  return (
    <div className={`${height} w-full animate-pulse rounded-xl border border-[color:var(--line)] bg-[color:var(--chip)]`} />
  );
}

function IndexTable({ title, date, rows }: { title: string; date: string; rows: { name: string; value: number; points: number; change: number }[] }) {
  return (
    <section className="fusion-panel rounded-2xl border-t-2 border-orange-500 p-4">
      <SectionHeader title={title} subtitle={date} />
      <div className="overflow-x-auto rounded-xl border border-[color:var(--line)]">
        <table className="w-full min-w-[520px] border-collapse text-sm">
          <tbody>
            {rows.map((row) => (
              <tr key={row.name} className="border-b border-[color:var(--line)] last:border-0">
                <td className="px-3 py-3 font-black text-sky-500">{row.name}</td>
                <td className="number px-3 py-3 font-black">{formatNumber(row.value)}</td>
                <td className={`number px-3 py-3 font-black ${percentClass(row.points)}`}>{formatNumber(row.points)}</td>
                <td className={`number px-3 py-3 font-black ${percentClass(row.change)}`}>{formatPercent(row.change)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function buildMarketSummary(stocks: StockRecord[], market: MarketCode) {
  const totalMarketCap = stocks.reduce((sum, stock) => sum + stock.prices.marketCap, 0);
  const totalTradeValue = stocks.reduce((sum, stock) => sum + stock.prices.tradeValue, 0);
  const totalVolume = stocks.reduce((sum, stock) => sum + stock.prices.volume, 0);
  const avgYield = average(stocks.map((stock) => stock.fundamentals.dividendYield));
  const avgPe = average(stocks.map((stock) => stock.fundamentals.pe));
  const avgRoe = average(stocks.map((stock) => stock.fundamentals.roe));
  const sessionDate = market === "DFM" ? DATASET_INFO.dfmSessionDate : DATASET_INFO.adxSessionDate;
  const series = buildMarketSeries(stocks);
  const latestIndex = series.at(-1)?.index ?? 0;
  const previousIndex = series.at(-2)?.index ?? latestIndex;
  const change = latestIndex - previousIndex;
  const changePercent = previousIndex ? (change / previousIndex) * 100 : 0;
  const indexHigh = Math.max(...series.map((point) => point.index));
  const indexLow = Math.min(...series.map((point) => point.index));
  const tradedToMarketCap = totalMarketCap > 0 ? (totalTradeValue / totalMarketCap) * 100 : 0;

  return {
    sessionDate,
    series,
    latestIndex,
    changePercent,
    totalMarketCap,
    totalTradeValue,
    avgYield,
    indexCards: [
      { label: "قيمة التداول", value: formatCurrency(totalTradeValue) },
      { label: "عدد الشركات", value: formatNumber(stocks.length) },
      { label: "التغير", value: formatPercent(changePercent) },
      { label: "حجم التداول", value: formatNumber(totalVolume) },
    ],
    dataRows: [
      { label: "قيمة التداول", value: formatCurrencyFull(totalTradeValue) },
      { label: "الافتتاح", value: formatNumber(series[0]?.index ?? latestIndex) },
      { label: "الإغلاق السابق", value: formatNumber(previousIndex) },
      { label: "أعلى", value: formatNumber(indexHigh) },
      { label: "أدنى", value: formatNumber(indexLow) },
      { label: "عدد الشركات", value: formatNumber(stocks.length) },
      { label: "حجم التداول", value: formatNumber(totalVolume) },
      { label: "القيمة السوقية", value: formatCurrencyFull(totalMarketCap) },
      { label: "نسبة التداول للقيمة", value: formatPlainPercent(tradedToMarketCap) },
    ],
    indicatorCards: [
      { label: "مكرر الأرباح المقدر", value: `${formatNumber(avgPe)} مرة` },
      { label: "عائد التوزيع النقدي", value: formatPlainPercent(avgYield) },
      { label: "العائد على حقوق الملكية", value: formatPlainPercent(avgRoe) },
      { label: "مضاعف القيمة للتداول", value: `${formatNumber(totalMarketCap / Math.max(totalTradeValue, 1))} مرة` },
    ],
  };
}

function buildMarketSeries(stocks: StockRecord[]) {
  const labels = stocks[0]?.historicalPrices.map((point) => point.label) ?? [];
  const totalMarketCap = stocks.reduce((sum, stock) => sum + stock.prices.marketCap, 0) || 1;

  return labels.map((label, index) => {
    const weighted = stocks.reduce((sum, stock) => {
      const firstPrice = stock.historicalPrices[0]?.price || stock.prices.previousClose || stock.prices.last;
      const price = stock.historicalPrices[index]?.price ?? stock.prices.last;
      return sum + (price / Math.max(firstPrice, 0.01)) * stock.prices.marketCap;
    }, 0);

    return {
      label,
      index: Number(((weighted / totalMarketCap) * 1000).toFixed(2)),
    };
  });
}

function buildMovementRows(stocks: StockRecord[], mode: MovementMode) {
  const rows = [...stocks];
  if (mode === "gainers") return rows.sort((a, b) => b.prices.changePercent - a.prices.changePercent).slice(0, 10);
  if (mode === "losers") return rows.sort((a, b) => a.prices.changePercent - b.prices.changePercent).slice(0, 10);
  if (mode === "volume") return rows.sort((a, b) => b.prices.volume - a.prices.volume).slice(0, 10);
  return rows.sort((a, b) => b.prices.tradeValue - a.prices.tradeValue).slice(0, 10);
}

function buildCalendarEvents(stocks: StockRecord[]) {
  return stocks
    .flatMap((stock) => [
      { symbol: stock.symbol, kind: "ex" as const, date: stock.dividend.exDate, amount: stock.dividend.lastAmount },
      { symbol: stock.symbol, kind: "pay" as const, date: stock.dividend.paymentDate, amount: stock.dividend.annualDividend },
    ])
    .filter((event) => event.date.startsWith("2026-05"))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function buildCalendarDays(year: number, month: number, events: { date: string }[]) {
  const firstDay = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const eventDays = new Set(events.map((event) => new Date(`${event.date}T00:00:00Z`).getUTCDate()));
  const blanks = Array.from({ length: firstDay }, () => null);
  const days = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    return { day, hasEvent: eventDays.has(day), isToday: day === 29 };
  });

  return [...blanks, ...days];
}

function groupBySector(stocks: StockRecord[]) {
  const map = new Map<string, number>();
  for (const stock of stocks) map.set(stock.sector, (map.get(stock.sector) ?? 0) + 1);
  return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function heatColor(score: number) {
  if (score >= 80) return "linear-gradient(135deg, #047857, #21c98b)";
  if (score >= 68) return "linear-gradient(135deg, #0f6aa8, #3aa0ff)";
  if (score >= 55) return "linear-gradient(135deg, #b7791f, #ffb020)";
  return "linear-gradient(135deg, #be123c, #ff5a72)";
}
