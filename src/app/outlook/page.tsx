"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Coins, LayoutGrid, CheckCircle2, TrendingUp, TrendingDown, MinusCircle } from "lucide-react";
import { DATASET_INFO, stocksData } from "@/data/stocksData";
import { formatCurrency, formatPercent } from "@/lib/format";
import { calculateFinancialHealthScore, getExpectedTrend, healthClass } from "@/utils/analyticsEngine";
import { useLanguage } from "@/context/languageContext";
import { useLiveMarket } from "@/hooks/useLiveMarket";

type TrendTab = "ALL" | "BULLISH" | "NEUTRAL" | "BEARISH";

export default function OutlookPage() {
  const { language, t } = useLanguage();
  const { stocks: liveStocks } = useLiveMarket();
  const isAr = language === "ar";

  // Client Filter States
  const [selectedMarket, setSelectedMarket] = useState<"ALL" | "DFM" | "ADX">("ALL");
  const [selectedTrend, setSelectedTrend] = useState<TrendTab>("ALL");

  // Hydrate with live stock data stream
  const stocks = useMemo(() => {
    return liveStocks.length > 0 ? liveStocks : stocksData;
  }, [liveStocks]);

  const rows = useMemo(() => {
    return stocks
      .map((stock) => {
        const trend = getExpectedTrend(stock);
        const health = calculateFinancialHealthScore(stock);
        
        // Categorize trend mathematically based on score
        let category: TrendTab = "NEUTRAL";
        if (trend.score >= 68) category = "BULLISH";
        else if (trend.score < 50) category = "BEARISH";

        return { stock, trend, health, category };
      })
      .filter((row) => selectedMarket === "ALL" || row.stock.market === selectedMarket)
      .filter((row) => selectedTrend === "ALL" || row.category === selectedTrend)
      .sort((a, b) => b.trend.score - a.trend.score);
  }, [stocks, selectedMarket, selectedTrend]);

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5">
      <header className="fusion-panel rounded-2xl p-5">
        <p className="text-sm font-black text-sky-500">
          {isAr ? "نموذج تحليلي رياضي" : "Mathematical Analysis Model"}
        </p>
        <h1 className="mt-2 text-3xl font-black text-[color:var(--foreground)]">
          {isAr ? "الاتجاه المتوقع خلال 3 أشهر" : "3-Month Expected Outlook"}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-[color:var(--muted)]">
          {isAr
            ? "قراءة فنية لحظية غير توصوية تجمع الزخم السعري، معدل النمو، عائد التوزيعات، والتقييم الداخلي في قراءات قابلة للفرز والتصفية الحية."
            : "A live, non-advisory technical framework combining price momentum, growth metrics, dividend yields, and internal evaluations into reactive scores."}
        </p>
      </header>

      {/* Advanced Tabbed Filters Panel */}
      <section className="fusion-panel rounded-2xl p-4 grid gap-4 md:grid-cols-2 items-center">
        {/* Market Filter */}
        <div>
          <span className="block text-xs font-black text-[color:var(--muted)] mb-2 uppercase tracking-wider">
            {isAr ? "1. تصفية سوق المال" : "1. Filter by Market"}
          </span>
          <div className="flex gap-2">
            {(["ALL", "DFM", "ADX"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setSelectedMarket(m)}
                className={`min-h-9 px-4 rounded-xl text-xs font-black transition ${
                  selectedMarket === m ? "bg-sky-600 text-white" : "market-chip"
                }`}
              >
                {m === "ALL" ? (isAr ? "جميع الأسواق" : "All Markets") : m}
              </button>
            ))}
          </div>
        </div>

        {/* Trend Tab Selector */}
        <div>
          <span className="block text-xs font-black text-[color:var(--muted)] mb-2 uppercase tracking-wider">
            {isAr ? "2. نوع الزخم والاتجاه" : "2. Momentum / Trend Class"}
          </span>
          <div className="flex flex-wrap gap-2">
            {(["ALL", "BULLISH", "NEUTRAL", "BEARISH"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTrend(tab)}
                className={`min-h-9 px-3 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                  selectedTrend === tab ? "bg-orange-500 text-white" : "market-chip"
                }`}
              >
                {tab === "BULLISH" && <TrendingUp size={14} />}
                {tab === "BEARISH" && <TrendingDown size={14} />}
                {tab === "NEUTRAL" && <MinusCircle size={14} />}
                <span>
                  {tab === "ALL" ? (isAr ? "الكل" : "All") :
                   tab === "BULLISH" ? (isAr ? "صاعد" : "Bullish") :
                   tab === "NEUTRAL" ? (isAr ? "محايد" : "Neutral") : (isAr ? "ضاغط" : "Bearish")}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Grid of Dynamic Cards */}
      <section className="grid gap-4 lg:grid-cols-2">
        {rows.map(({ stock, trend, health, category }) => {
          // Dynamic glow and border styles based on mathematical trend category
          const styleConfig = 
            category === "BULLISH"
              ? { border: "border-emerald-500/25 bg-emerald-500/4 hover:border-emerald-500", tone: "text-emerald-500", badge: "bg-emerald-500/12 text-emerald-500 border-emerald-500/35" }
              : category === "BEARISH"
              ? { border: "border-rose-500/25 bg-rose-500/4 hover:border-rose-500", tone: "text-rose-500", badge: "bg-rose-500/12 text-rose-500 border-rose-500/35" }
              : { border: "border-amber-500/25 bg-amber-500/4 hover:border-amber-500", tone: "text-amber-500", badge: "bg-amber-500/12 text-amber-500 border-amber-500/35" };

          return (
            <Link 
              key={stock.symbol} 
              href={`/stocks/${stock.symbol}`} 
              className={`fusion-panel rounded-2xl p-4 transition-all hover:scale-[1.01] border ${styleConfig.border}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-black text-[color:var(--foreground)]">
                    {isAr ? stock.nameAr : stock.nameEn}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs font-black">
                    <span className="market-chip rounded-full px-2.5 py-1">{stock.symbol}</span>
                    <span className="market-chip rounded-full px-2.5 py-1">{stock.market}</span>
                    <span className={`rounded-full border px-2.5 py-1 ${healthClass(health.score)}`}>
                      {isAr ? `صحة ${health.score}/100` : `Health ${health.score}/100`}
                    </span>
                  </div>
                </div>
                
                {/* Score Badge */}
                <div className={`number rounded-xl px-3 py-2 text-sm font-black border ${styleConfig.badge}`}>
                  {trend.score}
                </div>
              </div>

              {/* Dynamic Qualifiers & Details Row */}
              <div className="mt-4 rounded-xl border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-3">
                <p className={`font-black flex items-center gap-1.5 ${styleConfig.tone}`}>
                  {category === "BULLISH" && <TrendingUp size={16} />}
                  {category === "BEARISH" && <TrendingDown size={16} />}
                  {category === "NEUTRAL" && <MinusCircle size={16} />}
                  <span>{t(trend.direction)}</span>
                </p>
                <p className="mt-2 text-xs leading-6 text-[color:var(--muted)] font-semibold">
                  {trend.qualifiers.map((q) => t(q)).join(" · ")}
                </p>
              </div>

              {/* Quick Metrics Grid */}
              <div className="mt-4 grid gap-3 text-sm grid-cols-3">
                <Mini label={t("thChange")} value={formatPercent(stock.prices.changePercent)} />
                <Mini label={t("thYield")} value={formatPercent(stock.fundamentals.dividendYield)} />
                <Mini label={isAr ? "هدف داخلي" : "Internal Target"} value={formatCurrency(stock.modelTarget.base)} />
              </div>
            </Link>
          );
        })}
      </section>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-3">
      <p className="text-xs font-black text-[color:var(--muted)]">{label}</p>
      <p className="number mt-1 font-black text-[color:var(--foreground)]">{value}</p>
    </div>
  );
}
