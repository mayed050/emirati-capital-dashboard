"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Activity,
  ArrowUpDown,
  Building2,
  Coins,
  Calculator,
  Percent,
  Search,
  TrendingUp,
  Globe,
  Compass,
  Layers,
} from "lucide-react";
import { useLiveMarket } from "@/hooks/useLiveMarket";
import { formatCurrency, formatNumber, formatPercent, percentClass } from "@/lib/format";
import { calculateFinancialHealthScore, getExpectedTrend, healthClass } from "@/utils/analyticsEngine";
import type { HealthBand, MarketCode, StockRecord } from "@/types";
import { StockIcon } from "@/components/StockIcon";
import { useLanguage } from "@/context/languageContext";

type SortKey = "symbol" | "market" | "price" | "change" | "yield" | "pe" | "roe" | "health" | "tradeValue";

const ALL = "الكل";
const ALL_EN = "All";

export function AllStocks() {
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  const allLabel = isAr ? ALL : ALL_EN;

  const [query, setQuery] = useState("");
  const [market, setMarket] = useState<MarketCode | typeof allLabel>(allLabel);
  const [sector, setSector] = useState(allLabel);
  const [health, setHealth] = useState<HealthBand | typeof allLabel>(allLabel);
  const [sortKey, setSortKey] = useState<SortKey>("health");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  
  const { stocks, directions } = useLiveMarket();

  const marketLabels: Record<MarketCode, string> = {
    DFM: isAr ? "سوق دبي" : "DFM Dubai",
    ADX: isAr ? "سوق أبوظبي" : "ADX Abu Dhabi",
  };

  const sortLabels: Record<SortKey, string> = {
    symbol: t("thCompany"),
    market: t("thMarket"),
    price: t("thPrice"),
    change: t("thChange"),
    yield: t("thYield"),
    pe: "P/E",
    roe: "ROE",
    health: t("thHealth"),
    tradeValue: t("thVolume"),
  };

  const availableSectors = useMemo(() => {
    const marketStocks = market === allLabel ? stocks : stocks.filter((stock) => stock.market === market);
    return Array.from(new Set(marketStocks.map((stock) => stock.sector))).sort((a, b) => a.localeCompare(b, isAr ? "ar" : "en"));
  }, [market, stocks, allLabel, isAr]);

  const rows = useMemo(() => {
    return stocks
      .filter((stock) => market === allLabel || stock.market === market)
      .filter((stock) => sector === allLabel || stock.sector === sector)
      .filter((stock) => health === allLabel || calculateFinancialHealthScore(stock).band === health)
      .filter((stock) => {
        const q = query.trim().toLowerCase();
        if (!q) return true;
        return `${stock.symbol} ${stock.nameAr} ${stock.nameEn} ${stock.sector}`.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        const result = compare(valueForSort(a, sortKey), valueForSort(b, sortKey), isAr);
        return direction === "asc" ? result : -result;
      });
  }, [query, market, sector, health, sortKey, direction, allLabel, stocks, isAr]);

  const heat = [...rows]
    .sort((a, b) => calculateFinancialHealthScore(b).score - calculateFinancialHealthScore(a).score)
    .slice(0, 12);

  // Table Headers with Premium Icons
  const tableHeaders = [
    { label: t("thCompany"), icon: <Building2 size={15} className="text-sky-500 shrink-0" /> },
    { label: t("thPrice"), icon: <Coins size={15} className="text-amber-500 shrink-0" /> },
    { label: t("thChange"), icon: <Percent size={15} className="text-violet-500 shrink-0" /> },
    { label: t("thYield"), icon: <TrendingUp size={15} className="text-emerald-500 shrink-0" /> },
    { label: t("thHealth"), icon: <Activity size={15} className="text-rose-500 shrink-0" /> },
    { label: t("thVolume"), icon: <Layers size={15} className="text-teal-500 shrink-0" /> },
    { label: "P/E", icon: <Calculator size={15} className="text-slate-400 shrink-0" /> },
    { label: "EPS", icon: <Calculator size={15} className="text-slate-400 shrink-0" /> },
    { label: "ROE", icon: <Calculator size={15} className="text-slate-400 shrink-0" /> },
    { label: t("thTrend"), icon: <Compass size={15} className="text-orange-500 shrink-0" /> },
    { label: t("thSector"), icon: <Building2 size={15} className="text-slate-400 shrink-0" /> },
    { label: t("thMarket"), icon: <Globe size={15} className="text-indigo-500 shrink-0" /> },
  ];

  const getTrendIcon = (dir: string) => {
    if (dir === "صاعد") return "📈";
    if (dir === "مستقر إيجابي") return "↗️";
    if (dir === "ضاغط") return "📉";
    if (dir === "متذبذب") return "⚠️";
    return "➡️";
  };

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5">
      <header className="fusion-panel rounded-2xl p-5">
        <p className="text-sm font-black text-sky-500">{t("screenerTitle")}</p>
        <h1 className="mt-2 text-3xl font-black text-[color:var(--foreground)]">
          {isAr ? "أسعار الشركات والاستكشاف" : "Stock Screener Terminal"}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-[color:var(--muted)]">
          {t("screenerSubtitle")}
        </p>
      </header>

      {/* Advanced Filter Panel */}
      <section className="fusion-panel rounded-2xl p-4">
        <div className="grid gap-3 lg:grid-cols-[1.3fr_repeat(5,minmax(0,1fr))]">
          <label className="grid gap-1 text-sm font-black text-[color:var(--muted)]">
            {isAr ? "البحث المتقدم" : "Advanced Search"}
            <span className="relative">
              <Search className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--muted)]" size={17} aria-hidden />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="min-h-11 w-full rounded-xl pr-10 pl-3 outline-none focus:border-sky-400 text-sm font-bold"
                placeholder={t("searchPlaceholder")}
              />
            </span>
          </label>
          <Select
            label={t("filterMarket")}
            value={market}
            onChange={(value) => {
              setMarket(value as MarketCode | typeof allLabel);
              setSector(allLabel);
            }}
            options={[allLabel, "DFM", "ADX"]}
            labels={{ ...marketLabels, [allLabel]: allLabel }}
          />
          <Select 
            label={market === allLabel ? t("filterSector") : `${t("filterSector")} (${market})`} 
            value={sector} 
            onChange={setSector} 
            options={[allLabel, ...availableSectors]} 
          />
          <Select 
            label={t("filterHealth")} 
            value={health} 
            onChange={(value) => setHealth(value as HealthBand | typeof allLabel)} 
            options={[allLabel, "ممتاز", "جيد", "متوازن", "تحت المراقبة"]} 
            labels={{
              [allLabel]: allLabel,
              "ممتاز": t("ممتاز"),
              "جيد": t("جيد"),
              "متوازن": t("متوازن"),
              "تحت المراقبة": t("تحت المراقبة")
            }}
          />
          <Select 
            label={t("filterSort")} 
            value={sortKey} 
            onChange={(value) => setSortKey(value as SortKey)} 
            options={Object.keys(sortLabels)} 
            labels={sortLabels} 
          />
          <label className="grid gap-1 text-sm font-black text-[color:var(--muted)]">
            {t("filterDirection")}
            <button
              type="button"
              onClick={() => setDirection((value) => (value === "asc" ? "desc" : "asc"))}
              className="market-chip flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 hover:border-sky-400 text-sm font-bold"
            >
              <ArrowUpDown size={18} aria-hidden />
              {direction === "desc" ? (isAr ? "تنازلي" : "Descending") : (isAr ? "تصاعدي" : "Ascending")}
            </button>
          </label>
        </div>
      </section>

      {/* Heatmap Grid */}
      <section className="fusion-panel rounded-2xl p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-black text-[color:var(--foreground)]">{t("quickHealthMap")}</h2>
          <span className="rounded-full bg-sky-500/12 px-3 py-1 text-sm font-black text-sky-500">{rows.length}</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {heat.map((stock) => {
            const score = calculateFinancialHealthScore(stock).score;
            return (
              <Link
                key={stock.symbol}
                href={`/stocks/${stock.symbol}`}
                className="interactive-card rounded-xl border border-white/5 p-3 text-center transition hover:scale-[1.02] shadow-sm hover:shadow-md"
                style={{ background: heatColor(score) }}
              >
                <span className="block font-black text-white">{stock.symbol}</span>
                <span className="number mt-1 block text-sm font-black text-white">{score}/100</span>
                <span className="number mt-1 block text-xs font-bold text-white/85">{formatPercent(stock.fundamentals.dividendYield)}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Interactive Stock Table (Desktop) */}
      <section className="hidden overflow-x-auto rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] shadow-sm backdrop-blur md:block scrollbar-thin">
        <table className="w-full min-w-[1180px] border-collapse text-sm">
          <thead className="text-[color:var(--muted)] border-b border-[color:var(--line)]">
            <tr>
              {tableHeaders.map((header) => (
                <th key={header.label} className="px-3 py-3.5 text-start font-black">
                  <span className="inline-flex items-center gap-1.5">
                    {header.icon}
                    <span>{header.label}</span>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((stock) => {
              const healthScore = calculateFinancialHealthScore(stock);
              const trend = getExpectedTrend(stock);
              const isUp = stock.prices.changePercent >= 0;
              const isZero = stock.prices.changePercent === 0;

              return (
                <tr key={stock.symbol} className="border-b border-[color:var(--line)] last:border-0 hover:bg-sky-500/5 transition-all">
                  <td className="px-3 py-3">
                    <Link href={`/stocks/${stock.symbol}`} className="inline-flex items-center gap-3 font-black text-sky-500 hover:underline">
                      <StockIcon stock={stock} />
                      <span>
                        <span className="block text-slate-900">{isAr ? stock.nameAr : stock.nameEn}</span>
                        <span className="text-xs font-bold text-[color:var(--muted)]">{stock.symbol}</span>
                      </span>
                    </Link>
                  </td>
                  <td className={`number px-3 py-3 font-bold text-[color:var(--foreground)] transition-all ${
                    directions[stock.symbol] === "up"
                      ? "animate-flash-up"
                      : directions[stock.symbol] === "down"
                      ? "animate-flash-down"
                      : ""
                  }`}>{formatCurrency(stock.prices.last)}</td>
                  <td className={`number px-3 py-3 font-black transition-all ${percentClass(stock.prices.changePercent)} ${
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
                  <NumberCell value={formatPercent(stock.fundamentals.dividendYield)} />
                  <td className="px-3 py-3">
                    <span className={`rounded-full border px-2 py-1 text-xs font-black ${healthClass(healthScore.score)}`}>
                      {t(healthScore.band)} · {healthScore.score}
                    </span>
                  </td>
                  <NumberCell value={formatCurrency(stock.prices.tradeValue)} />
                  <NumberCell value={formatNumber(stock.fundamentals.pe)} />
                  <NumberCell value={formatNumber(stock.fundamentals.eps)} />
                  <NumberCell value={formatPercent(stock.fundamentals.roe)} />
                  <td className="px-3 py-3 font-bold text-[color:var(--muted)]">
                    <span className="inline-flex items-center gap-1">
                      {getTrendIcon(trend.direction)} {t(trend.direction)}
                    </span>
                  </td>
                  <td className="px-3 py-3 font-semibold text-[color:var(--muted)]">{stock.sector}</td>
                  <td className="px-3 py-3">
                    <MarketBadge market={stock.market} label={marketLabels[stock.market]} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* Interactive Stock Cards (Mobile Layout) */}
      <section className="grid gap-3 md:hidden">
        {rows.map((stock) => {
          const healthScore = calculateFinancialHealthScore(stock);
          const trend = getExpectedTrend(stock);
          return (
            <Link key={stock.symbol} href={`/stocks/${stock.symbol}`} className="fusion-panel interactive-card rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <StockIcon stock={stock} />
                  <div>
                    <p className="font-black text-[color:var(--foreground)]">{isAr ? stock.nameAr : stock.nameEn}</p>
                    <p className="mt-1 text-xs font-bold text-[color:var(--muted)]">
                      {stock.symbol} · {marketLabels[stock.market]}
                    </p>
                  </div>
                </div>
                <span className={`rounded-full border px-2 py-1 text-xs font-black ${healthClass(healthScore.score)}`}>
                  {healthScore.score}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                <Mini label={t("thPrice")} value={formatCurrency(stock.prices.last)} />
                <Mini label={t("thChange")} value={formatPercent(stock.prices.changePercent)} tone={percentClass(stock.prices.changePercent)} />
                <Mini label={t("thTrend")} value={`${getTrendIcon(trend.direction)} ${t(trend.direction)}`} />
              </div>
            </Link>
          );
        })}
      </section>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  labels,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  labels?: Record<string, string>;
}) {
  return (
    <label className="grid gap-1 text-sm font-black text-[color:var(--muted)]">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 rounded-xl px-3 outline-none focus:border-sky-400 text-xs font-bold">
        {options.map((option) => (
          <option key={option} value={option}>
            {labels?.[option] ?? option}
          </option>
        ))}
      </select>
    </label>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="market-chip rounded-full px-2 py-1 text-xs font-black shrink-0">{children}</span>;
}

function MarketBadge({ market, label }: { market: MarketCode; label: string }) {
  return <Badge>{label}</Badge>;
}

function NumberCell({ value }: { value: string }) {
  return <td className="number px-3 py-3 font-bold text-[color:var(--foreground)]">{value}</td>;
}

function Mini({ label, value, tone = "text-[color:var(--foreground)]" }: { label: string; value: string; tone?: string }) {
  return (
    <span className="rounded-xl bg-[color:var(--surface-strong)] p-2">
      <span className="block font-bold text-[color:var(--muted)]">{label}</span>
      <span className={`number mt-1 block font-black ${tone}`}>{value}</span>
    </span>
  );
}

function heatColor(score: number) {
  if (score >= 80) return "linear-gradient(135deg, #047857, #21c98b)";
  if (score >= 68) return "linear-gradient(135deg, #0f6aa8, #3aa0ff)";
  if (score >= 55) return "linear-gradient(135deg, #b7791f, #ffb020)";
  return "linear-gradient(135deg, #be123c, #ff5a72)";
}

function valueForSort(stock: StockRecord, key: SortKey): string | number {
  switch (key) {
    case "symbol":
      return stock.symbol;
    case "market":
      return stock.market;
    case "price":
      return stock.prices.last;
    case "change":
      return stock.prices.changePercent;
    case "yield":
      return stock.fundamentals.dividendYield;
    case "pe":
      return stock.fundamentals.pe;
    case "roe":
      return stock.fundamentals.roe;
    case "health":
      return calculateFinancialHealthScore(stock).score;
    case "tradeValue":
      return stock.prices.tradeValue;
  }
}

function compare(left: string | number, right: string | number, isAr: boolean) {
  if (typeof left === "string" && typeof right === "string") return left.localeCompare(right, isAr ? "ar" : "en");
  return Number(left) - Number(right);
}
