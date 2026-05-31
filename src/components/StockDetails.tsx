"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ComposedChart,
  ReferenceLine,
} from "recharts";
import { 
  ArrowRight, 
  CalendarDays, 
  ExternalLink, 
  ShieldCheck, 
  Target, 
  TrendingUp,
  Award,
  AlertTriangle,
  Lightbulb,
  ShieldAlert,
  Info,
  Building2,
  Percent,
  BarChart3,
  Coins
} from "lucide-react";
import { formatCurrency, formatCurrencyFull, formatDate, formatNumber, formatPercent, percentClass } from "@/lib/format";
import { StockIcon } from "@/components/StockIcon";
import { Badge } from "@/components/ui/Badge";
import { MiniCard } from "@/components/ui/MiniCard";
import { useLanguage } from "@/context/languageContext";
import {
  calculateDividendSustainability,
  calculateFinancialHealthScore,
  getExpectedTrend,
  healthClass,
  calculateSMA,
  calculateEMA,
  calculateRSI,
} from "@/utils/analyticsEngine";
import type { StockRecord } from "@/types";

type Period = "3M" | "6M" | "12M";
type SubTab = "overview" | "analysis" | "financials" | "dividends";

const tooltipStyle = {
  background: "var(--surface-strong)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  color: "var(--foreground)",
  boxShadow: "0 18px 50px rgba(2, 6, 23, 0.22)",
};

export function StockDetails({ stock }: { stock: StockRecord }) {
  const { t, language } = useLanguage();
  const [period, setPeriod] = useState<Period>("12M");
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("overview");
  const [activeSwotTab, setActiveSwotTab] = useState<"S" | "W" | "O" | "T" | null>(null);

  // Indicators States
  const [showSMA, setShowSMA] = useState(false);
  const [showEMA, setShowEMA] = useState(false);
  const [showRSI, setShowRSI] = useState(false);

  const health = calculateFinancialHealthScore(stock);
  const trend = getExpectedTrend(stock);
  const dividend = calculateDividendSustainability(stock);
  
  const history = useMemo(() => {
    const size = period === "3M" ? 3 : period === "6M" ? 6 : 12;
    return stock.historicalPrices.slice(-size);
  }, [period, stock.historicalPrices]);

  const historyPrices = useMemo(() => history.map((h) => h.price), [history]);
  const smas = useMemo(() => calculateSMA(historyPrices), [historyPrices]);
  const emas = useMemo(() => calculateEMA(historyPrices), [historyPrices]);
  const rsis = useMemo(() => calculateRSI(historyPrices), [historyPrices]);

  const historyWithIndicators = useMemo(() => {
    return history.map((point, index) => ({
      ...point,
      sma: smas[index],
      ema: emas[index],
      rsi: rsis[index],
    }));
  }, [history, smas, emas, rsis]);

  // Tab contents rendering helper functions
  const renderOverview = () => (
    <div className="view-fade grid gap-5 xl:grid-cols-[1.8fr_1.2fr] xl:items-stretch">
      {/* Right Column (2/3): Unified Interactive Price-Volume Chart with Indicators */}
      <section className="fusion-panel rounded-lg p-5 flex flex-col justify-between min-w-0">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-950">
              {language === "ar" ? "شارت حركة السعر وحجم التداول" : "Price & Volume Movement Chart"}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {language === "ar" ? "منحنى السعر التفصيلي مدمجاً مع حجم تداولات الجلسات اليومية في القاعدة." : "Detailed price curve overlaid with session volume sitting in the base."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {/* Indicators Toggles */}
            <button
              onClick={() => setShowSMA(!showSMA)}
              className={`min-h-8 rounded-lg px-2.5 text-[10px] font-black transition-all border ${
                showSMA ? "bg-amber-500 text-white border-amber-600 shadow-md" : "border-white/10 bg-white/5 text-slate-500 hover:bg-amber-500/10"
              }`}
            >
              SMA 14 📈
            </button>
            <button
              onClick={() => setShowEMA(!showEMA)}
              className={`min-h-8 rounded-lg px-2.5 text-[10px] font-black transition-all border ${
                showEMA ? "bg-violet-500 text-white border-violet-600 shadow-md" : "border-white/10 bg-white/5 text-slate-500 hover:bg-violet-500/10"
              }`}
            >
              EMA 14 📉
            </button>
            <button
              onClick={() => setShowRSI(!showRSI)}
              className={`min-h-8 rounded-lg px-2.5 text-[10px] font-black transition-all border ${
                showRSI ? "bg-rose-500 text-white border-rose-600 shadow-md" : "border-white/10 bg-white/5 text-slate-500 hover:bg-rose-500/10"
              }`}
            >
              RSI 14 📊
            </button>
            <div className="h-6 w-[1px] bg-white/10 mx-1 hidden sm:block"></div>
            {(["3M", "6M", "12M"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setPeriod(item)}
                className={`min-h-8 rounded-lg px-3 text-[10px] font-black transition-all ${
                  period === item ? "bg-sky-500 text-white shadow-lg shadow-sky-500/20" : "border border-white/10 bg-white/5 text-slate-700 hover:bg-sky-500/10"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full flex-1 flex flex-col justify-between">
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={showRSI ? 240 : 340}>
              <ComposedChart data={historyWithIndicators} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id={`priceFill-${stock.symbol}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
                
                {/* Primary Y Axis for Price */}
                <YAxis yAxisId="price" tick={{ fontSize: 10, fill: "var(--muted)" }} domain={["auto", "auto"]} axisLine={false} tickLine={false} />
                
                {/* Secondary Y Axis for Volume (domain scaled to keep bars at the bottom) */}
                <YAxis yAxisId="volume" hide domain={[0, (dataMax: number) => dataMax * 4]} />
                
                <Tooltip 
                  contentStyle={tooltipStyle} 
                  formatter={(value, name) => {
                    if (name === "السعر" || name === "Price") return [formatCurrency(Number(value)), language === "ar" ? "السعر" : "Price"];
                    if (name === "الحجم" || name === "Volume") return [formatNumber(Number(value)), language === "ar" ? "الحجم" : "Volume"];
                    return [value, name];
                  }} 
                />
                
                {/* Price Area */}
                <Area 
                  yAxisId="price" 
                  isAnimationActive={false} 
                  type="monotone" 
                  dataKey="price" 
                  name={language === "ar" ? "السعر" : "Price"} 
                  stroke="#0ea5e9" 
                  strokeWidth={3} 
                  fill={`url(#priceFill-${stock.symbol})`} 
                />
                
                {/* Volume Bars sitting elegantly in the bottom 25% of the chart */}
                <Bar 
                  yAxisId="volume" 
                  isAnimationActive={false} 
                  dataKey="volume" 
                  name={language === "ar" ? "الحجم" : "Volume"} 
                  fill="#10b981" 
                  opacity={0.35} 
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={30}
                />

                {/* Technical Indicators lines */}
                {showSMA && (
                  <Line 
                    yAxisId="price" 
                    type="monotone" 
                    dataKey="sma" 
                    stroke="#f59e0b" 
                    strokeWidth={2} 
                    dot={false} 
                    name={language === "ar" ? "متوسط بسيط SMA" : "SMA 14"} 
                    connectNulls 
                  />
                )}
                {showEMA && (
                  <Line 
                    yAxisId="price" 
                    type="monotone" 
                    dataKey="ema" 
                    stroke="#8b5cf6" 
                    strokeWidth={2} 
                    dot={false} 
                    name={language === "ar" ? "متوسط أسي EMA" : "EMA 14"} 
                    connectNulls 
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          {showRSI && (
            <div className="w-full mt-3 border-t border-white/10 pt-3">
              <p className="text-[10px] font-black text-slate-500 mb-1">{language === "ar" ? "مؤشر القوة النسبية RSI (14)" : "RSI (14) Momentum Indicator"}</p>
              <ResponsiveContainer width="100%" height={90}>
                <LineChart data={historyWithIndicators} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.08)" />
                  <XAxis dataKey="label" hide />
                  <YAxis tick={{ fontSize: 8, fill: "var(--muted)" }} domain={[0, 100]} ticks={[30, 50, 70]} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value) => [value, "RSI"]} />
                  <Line type="monotone" dataKey="rsi" stroke="#ef4444" strokeWidth={1.5} dot={false} name="RSI" connectNulls />
                  <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" label={{ value: "30", fill: "#10b981", fontSize: 8, position: "insideBottomLeft" }} />
                  <ReferenceLine y={70} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: "70", fill: "#f43f5e", fontSize: 8, position: "insideTopLeft" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>

      {/* Left Column (1/3): Packed 2x2 Grid of Key Metrics */}
      <section className="flex flex-col gap-4 justify-between min-w-0">
        <div className="grid gap-3 grid-cols-2 flex-1">
          <Metric icon={<TrendingUp size={16} aria-hidden />} label="سعر السهم الحالي" value={formatCurrency(stock.prices.last)} hint={formatCurrencyFull(stock.prices.tradeValue)} />
          <Metric icon={<Percent size={16} aria-hidden />} label="التغير اليومي" value={formatPercent(stock.prices.changePercent)} hint={formatCurrency(stock.prices.change)} tone={percentClass(stock.prices.changePercent)} />
          <Metric icon={<Coins size={16} aria-hidden />} label="آخر عائد نقدي" value={formatPercent(stock.fundamentals.dividendYield)} hint={dividend.rating} />
          <Metric icon={<ShieldCheck size={16} aria-hidden />} label="اتجاه السهم" value={trend.direction} hint={`درجة الأمان ${trend.score}`} />
        </div>
        
        {/* Quick Sector Profile Info Card */}
        <div className="fusion-panel rounded-lg p-4 flex-1 flex flex-col justify-center">
          <h3 className="text-sm font-black text-slate-950 flex items-center gap-2 mb-2">
            <Building2 size={16} className="text-sky-500" />
            الملف القطاعي للشركة
          </h3>
          <p className="text-xs text-slate-500 leading-5">
            تنشط شركة <strong className="text-slate-900">{stock.nameAr}</strong> في قطاع <strong className="text-slate-900">{stock.sector}</strong>. 
            تبلغ القيمة السوقية الإجمالية للمؤسسة <strong className="text-slate-900">{formatCurrencyFull(stock.prices.marketCap)}</strong>، وتعتبر من الكيانات القيادية ذات الصحة المتوازنة المصنفة بدرجة <strong className="text-sky-600">{health.score}/100</strong>.
          </p>
        </div>
      </section>
    </div>
  );

  const renderAnalysisSwot = () => (
    <div className="view-fade grid gap-5">
      {/* 2x2 SWOT Analysis Grid */}
      <section className="fusion-panel rounded-lg p-5">
        <div className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-black text-slate-950">التحليل الاستراتيجي الرباعي (SWOT Analysis)</h2>
            <p className="mt-1 text-sm text-slate-500">انقر على أي ربع من أرباع التحليل لاستعراض النصائح الاستشارية المخصصة للمستثمرين.</p>
          </div>
          <div className="flex gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              تحليل مالي معتمد
            </span>
          </div>
        </div>

        <div className="relative grid gap-5 md:grid-cols-2">
          {/* Decorative Center Badge */}
          <div className="absolute left-1/2 top-1/2 hidden h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-slate-100 bg-white shadow-xl shadow-slate-200/50 xl:flex z-10">
            <div className="text-center select-none">
              <p className="text-[9px] font-black text-slate-400 tracking-widest">ANALYSIS</p>
              <p className="text-sm font-black text-sky-600 font-serif leading-none mt-0.5">SWOT</p>
            </div>
          </div>

          {/* Strengths (S) */}
          <div 
            onClick={() => setActiveSwotTab(activeSwotTab === "S" ? null : "S")}
            className={`group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 cursor-pointer ${
              activeSwotTab === "S" 
                ? "border-emerald-500 bg-emerald-500/5 shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-500" 
                : "border-white/10 bg-white/5 hover:border-emerald-400/50 hover:shadow-xl hover:-translate-y-0.5"
            }`}
          >
            <div className="absolute -right-6 -top-6 text-9xl font-black text-emerald-500/5 select-none pointer-events-none font-serif transition-all group-hover:scale-105">S</div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 transition-all group-hover:scale-105">
                <Award size={22} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-950 transition-colors group-hover:text-emerald-600">عوامل القوة (Strengths)</h3>
                <p className="text-[11px] font-bold text-slate-400">عوامل القيادة التشغيلية والملاءة العالية</p>
              </div>
            </div>
            <ul className="mt-4 space-y-2">
              {stock.swot.strengths.map((item, index) => (
                <li key={index} className="flex items-start gap-2.5 rounded-lg border border-slate-100 bg-white p-2.5 text-xs text-slate-700 shadow-sm transition-all hover:bg-emerald-50/10 hover:border-emerald-100">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-black text-emerald-600">{index + 1}</span>
                  <span className="leading-5">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Weaknesses (W) */}
          <div 
            onClick={() => setActiveSwotTab(activeSwotTab === "W" ? null : "W")}
            className={`group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 cursor-pointer ${
              activeSwotTab === "W" 
                ? "border-amber-500 bg-amber-500/5 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500" 
                : "border-white/10 bg-white/5 hover:border-amber-400/50 hover:shadow-xl hover:-translate-y-0.5"
            }`}
          >
            <div className="absolute -right-6 -top-6 text-9xl font-black text-amber-500/5 select-none pointer-events-none font-serif transition-all group-hover:scale-105">W</div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 transition-all group-hover:scale-105">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-950 transition-colors group-hover:text-amber-600">نقاط الضعف (Weaknesses)</h3>
                <p className="text-[11px] font-bold text-slate-400">التحديات والمصاريف التي تؤثر على الهوامش</p>
              </div>
            </div>
            <ul className="mt-4 space-y-2">
              {stock.swot.weaknesses.map((item, index) => (
                <li key={index} className="flex items-start gap-2.5 rounded-lg border border-slate-100 bg-white p-2.5 text-xs text-slate-700 shadow-sm transition-all hover:bg-amber-50/10 hover:border-amber-100">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[10px] font-black text-amber-600">{index + 1}</span>
                  <span className="leading-5">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Opportunities (O) */}
          <div 
            onClick={() => setActiveSwotTab(activeSwotTab === "O" ? null : "O")}
            className={`group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 cursor-pointer ${
              activeSwotTab === "O" 
                ? "border-sky-500 bg-sky-500/5 shadow-lg shadow-sky-500/5 ring-1 ring-sky-500" 
                : "border-white/10 bg-white/5 hover:border-sky-400/50 hover:shadow-xl hover:-translate-y-0.5"
            }`}
          >
            <div className="absolute -right-6 -top-6 text-9xl font-black text-sky-500/5 select-none pointer-events-none font-serif transition-all group-hover:scale-105">O</div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/10 text-sky-500 transition-all group-hover:scale-105">
                <Lightbulb size={22} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-950 transition-colors group-hover:text-sky-600">الفرص المتاحة (Opportunities)</h3>
                <p className="text-[11px] font-bold text-slate-400">مشاريع التوسع والتحول والنمو في المنطقة</p>
              </div>
            </div>
            <ul className="mt-4 space-y-2">
              {stock.swot.opportunities.map((item, index) => (
                <li key={index} className="flex items-start gap-2.5 rounded-lg border border-slate-100 bg-white p-2.5 text-xs text-slate-700 shadow-sm transition-all hover:bg-sky-50/10 hover:border-sky-100">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[10px] font-black text-sky-600">{index + 1}</span>
                  <span className="leading-5">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Threats (T) */}
          <div 
            onClick={() => setActiveSwotTab(activeSwotTab === "T" ? null : "T")}
            className={`group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 cursor-pointer ${
              activeSwotTab === "T" 
                ? "border-rose-500 bg-rose-500/5 shadow-lg shadow-rose-500/5 ring-1 ring-rose-500" 
                : "border-white/10 bg-white/5 hover:border-rose-400/50 hover:shadow-xl hover:-translate-y-0.5"
            }`}
          >
            <div className="absolute -right-6 -top-6 text-9xl font-black text-rose-500/5 select-none pointer-events-none font-serif transition-all group-hover:scale-105">T</div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 transition-all group-hover:scale-105">
                <ShieldAlert size={22} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-950 transition-colors group-hover:text-rose-600">المخاطر المحيطة (Threats)</h3>
                <p className="text-[11px] font-bold text-slate-400">تقلبات السوق والفائدة والمنافسة الإقليمية</p>
              </div>
            </div>
            <ul className="mt-4 space-y-2">
              {stock.swot.threats.map((item, index) => (
                <li key={index} className="flex items-start gap-2.5 rounded-lg border border-slate-100 bg-white p-2.5 text-xs text-slate-700 shadow-sm transition-all hover:bg-rose-50/10 hover:border-rose-100">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100 text-[10px] font-black text-rose-600">{index + 1}</span>
                  <span className="leading-5">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Dynamic Insight Advisor Panel */}
        {activeSwotTab && (
          <div className="mt-5 rounded-xl border border-sky-500/15 bg-sky-500/5 p-4 view-fade">
            <div className="flex items-center gap-2.5">
              <Info className="text-sky-500" size={18} />
              <h4 className="text-sm font-black text-sky-950">
                {activeSwotTab === "S" && "💡 استراتيجية تعظيم القوة الاستثمارية:"}
                {activeSwotTab === "W" && "💡 حوكمة وتفادي عوامل الضعف:"}
                {activeSwotTab === "O" && "💡 اقتناص الفرص والمشاريع الجديدة:"}
                {activeSwotTab === "T" && "💡 التحوط المالي وإدارة المخاطر:"}
              </h4>
            </div>
            <p className="mt-2 text-xs leading-6 text-slate-600">
              {activeSwotTab === "S" && "تتميز هذه الشركة بركائز مالية قوية تمكنها من تحقيق تدفقات تشغيلية مستقرة وتنافسية جداً في الاقتصاد الإماراتي. ينصح بمقارنة هذه القوة بمتوسط الصناعة لضمان دوام الريادة."}
              {activeSwotTab === "W" && "نقاط الضعف تؤثر غالباً على هوامش الربح الإجمالية للمستثمرين. ينبغي متابعة مدى كفاءة الشركة في إدارة الديون والتكاليف التشغيلية لتحسين العائد على حقوق الملكية."}
              {activeSwotTab === "O" && "تمثل الفرص قاطرة التوسعات المستقبلية ورفع القيمة السوقية للسهم (Capital Appreciation). تساهم الشراكات وتطوير البنية الذكية في استغلال هذه الميزات بمرونة عالية."}
              {activeSwotTab === "T" && "تشمل التحديات الخارجية تقلبات أسعار الفائدة والسياسات العالمية. تمتلك الشركات الكبرى مثلها مرونة مالية عالية متمثلة في سيولة نقدية تغطي الالتزامات قصيرة الأجل للحد من المخاطر."}
            </p>
          </div>
        )}
      </section>

      {/* Target Value Model Range */}
      <section className="fusion-panel rounded-lg p-5">
        <div className="mb-4 flex items-center gap-2">
          <Target className="text-sky-500" size={20} aria-hidden />
          <h2 className="text-xl font-black text-slate-950">نموذج القيمة العادلة الموجهة</h2>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <MiniCard label="القيمة المتحفظة (منخفض)" value={formatCurrency(stock.modelTarget.low)} />
          <MiniCard label="القيمة المستهدفة (أساسي)" value={formatCurrency(stock.modelTarget.base)} />
          <MiniCard label="القيمة المتفائلة (مرتفع)" value={formatCurrency(stock.modelTarget.high)} />
        </div>
        <p className="mt-4 rounded-lg border border-sky-400/25 bg-sky-500/10 p-3 text-sm leading-7 text-slate-600">
          {stock.modelTarget.sourceNote} العائد المتوقع بناءً على سعر التقييم العادل المستهدف:{" "}
          <strong className={percentClass(stock.modelTarget.upsidePercent)}>{formatPercent(stock.modelTarget.upsidePercent)}</strong>.
        </p>
      </section>
    </div>
  );

  const renderFinancials = () => (
    <div className="view-fade grid gap-5">
      {/* 2x3 Grid of Fundamental Metrics */}
      <section className="fusion-panel rounded-lg p-5">
        <h2 className="text-xl font-black text-slate-950 mb-4">المؤشرات المالية والنسب الأساسية</h2>
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          <MiniCard label="مكرر الربحية P/E" value={formatNumber(stock.fundamentals.pe)} />
          <MiniCard label="ربحية السهم EPS" value={formatNumber(stock.fundamentals.eps)} />
          <MiniCard label="العائد على الملكية ROE" value={formatPercent(stock.fundamentals.roe)} />
          <MiniCard label="نمو الإيرادات" value={formatPercent(stock.fundamentals.revenueGrowth)} />
          <MiniCard label="نمو الأرباح" value={formatPercent(stock.fundamentals.netProfitGrowth)} />
          <MiniCard label="نسبة التوزيعات" value={formatPercent(stock.fundamentals.payoutRatio)} />
        </div>
      </section>

      {/* Revenue vs Net Profit Comparative Chart */}
      <section className="fusion-panel rounded-lg p-5">
        <div className="mb-4">
          <h2 className="text-xl font-black text-slate-950">مقارنة الإيرادات التاريخية وصافي الربح المحقق</h2>
          <p className="text-sm text-slate-500 mt-1">يظهر كفاءة التشغيل وقدرة الشركة على تحويل المبيعات لصافي تدفق نقدي مربح للمساهمين.</p>
        </div>
        <div className="w-full">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={[{ label: "آخر 12 شهر (TTM)", revenue: stock.fundamentals.revenueAED, profit: stock.fundamentals.netProfitAED }]} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.22)" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatCurrencyFull(Number(value))} />
              <Bar isAnimationActive={false} dataKey="revenue" name="إجمالي الإيرادات" fill="#0ea5e9" radius={[8, 8, 0, 0]} maxBarSize={120} />
              <Bar isAnimationActive={false} dataKey="profit" name="صافي الأرباح المحققة" fill="#10b981" radius={[8, 8, 0, 0]} maxBarSize={120} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );

  const renderDividends = () => (
    <div className="view-fade grid gap-5">
      {/* Sustainability and Payout Summary */}
      <section className="grid gap-3 md:grid-cols-2">
        <div className="interactive-card fusion-panel rounded-lg p-5">
          <div className="mb-3 inline-grid h-10 w-10 place-items-center rounded-lg bg-sky-500/15 text-sky-500">
            <Coins size={20} />
          </div>
          <p className="text-xs font-black text-slate-500">
            {language === "ar" ? "عائد التوزيعات النقدية السنوي" : "Annual Dividend Yield"}
          </p>
          <p className="number mt-2 text-2xl font-black text-slate-950">{formatPercent(stock.fundamentals.dividendYield)}</p>
          <p className="mt-2 text-xs font-bold text-slate-500">
            {language === "ar" ? "طريقة التوزيع: نصف سنوي" : "Frequency: Semi-annual"}
          </p>
        </div>

        <div className="interactive-card fusion-panel rounded-lg p-5">
          <div className="mb-3 inline-grid h-10 w-10 place-items-center rounded-lg bg-emerald-500/15 text-emerald-500">
            <ShieldCheck size={20} />
          </div>
          <p className="text-xs font-black text-slate-500">تقييم استدامة التوزيعات النقدية</p>
          <p className="number mt-2 text-2xl font-black text-slate-950">{dividend.rating}</p>
          <p className="mt-2 text-xs font-bold text-slate-500">نسبة التغطية النقدية: {formatPercent(stock.fundamentals.payoutRatio)}</p>
        </div>
      </section>

      {/* Historical Dividend Yield Trend Chart */}
      <section className="fusion-panel rounded-lg p-5">
        <div className="mb-4">
          <h2 className="text-xl font-black text-slate-950">تاريخ توزيعات الأرباح النقدية للمساهمين</h2>
          <p className="text-sm text-slate-500 mt-1">يظهر مسار نمو وتوزيع الأرباح السنوية عبر السنوات المالية السابقة للشركة.</p>
        </div>
        <div className="w-full">
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={stock.historicalDividends} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.22)" />
              <XAxis dataKey="fiscalYear" tick={{ fontSize: 12, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatCurrency(Number(value))} />
              <Line isAnimationActive={false} type="monotone" dataKey="amount" name="مبلغ التوزيع الموزع (درهم)" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 5, fill: "#0ea5e9" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );

  return (
    <div className="view-fade grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5">
      <Link href="/stocks" className="inline-flex w-fit items-center gap-2 text-sm font-black text-sky-500 hover:underline">
        <ArrowRight size={16} aria-hidden />
        {language === "ar" ? "العودة إلى مستكشف الأسهم" : "Back to Stock Explorer"}
      </Link>

      {/* Premium Profile Header Panel */}
      <header className="fusion-panel overflow-hidden rounded-lg p-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2">
              <Badge tone="slate">{stock.market}</Badge>
              <Badge tone="slate">{stock.sector}</Badge>
              <span className={`rounded-full border px-3 py-1 text-xs font-black ${healthClass(health.score)}`}>
                {language === "ar" ? `صحة ${health.band} · ${health.score}/100` : `Health: ${health.score}/100 (${health.band})`}
              </span>
            </div>

            <div className="mt-5 flex items-start gap-4">
              <StockIcon stock={stock} size="lg" />
              <div className="min-w-0">
                <h1 className="truncate text-3xl font-black text-slate-950 md:text-5xl">
                  {language === "ar" ? stock.nameAr : stock.nameEn}
                </h1>
                <p className="mt-2 text-sm font-bold text-slate-500">{stock.symbol} · {language === "ar" ? stock.nameEn : stock.nameAr}</p>
              </div>
            </div>

            <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-600">
              {stock.profile}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:w-[360px] xl:grid-cols-1">
            <a
              href={stock.officialUrls.marketProfile}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 text-sm font-black text-slate-700 hover:bg-sky-500/10"
            >
              {language === "ar" ? "صفحة السوق الرسمية" : "Official Market Page"}
              <ExternalLink size={16} aria-hidden />
            </a>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <p className="text-xs font-black text-slate-500">{language === "ar" ? "آخر تحديث للبيانات" : "Last Data Update"}</p>
              <p className="mt-1 font-black text-slate-950">{formatDate(stock.prices.lastUpdated)}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Premium Horizontal Pill Tab Bar */}
      <section className="flex border-b border-slate-200 overflow-x-auto pb-px scrollbar-none gap-2">
        <button
          type="button"
          onClick={() => setActiveSubTab("overview")}
          className={`min-h-11 px-5 text-sm font-black transition-all flex items-center gap-2 rounded-t-lg border-b-2 ${
            activeSubTab === "overview"
              ? "border-sky-500 text-sky-500 bg-sky-500/5 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-950 hover:bg-slate-50"
          }`}
        >
          <Building2 size={16} />
          {language === "ar" ? "نظرة عامة" : "Overview"}
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("analysis")}
          className={`min-h-11 px-5 text-sm font-black transition-all flex items-center gap-2 rounded-t-lg border-b-2 ${
            activeSubTab === "analysis"
              ? "border-sky-500 text-sky-500 bg-sky-500/5 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-950 hover:bg-slate-50"
          }`}
        >
          <Target size={16} />
          {language === "ar" ? "التحليلات الذكية & SWOT" : "Smart Analysis & SWOT"}
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("financials")}
          className={`min-h-11 px-5 text-sm font-black transition-all flex items-center gap-2 rounded-t-lg border-b-2 ${
            activeSubTab === "financials"
              ? "border-sky-500 text-sky-500 bg-sky-500/5 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-950 hover:bg-slate-50"
          }`}
        >
          <BarChart3 size={16} />
          {language === "ar" ? "المؤشرات المالية" : "Financial Metrics"}
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("dividends")}
          className={`min-h-11 px-5 text-sm font-black transition-all flex items-center gap-2 rounded-t-lg border-b-2 ${
            activeSubTab === "dividends"
              ? "border-sky-500 text-sky-500 bg-sky-500/5 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-950 hover:bg-slate-50"
          }`}
        >
          <Coins size={16} />
          {language === "ar" ? "التوزيعات والأرباح" : "Dividends & Payouts"}
        </button>
      </section>

      {/* Dynamic Tab Contents Panel */}
      <main className="min-w-0 transition-opacity duration-300">
        {activeSubTab === "overview" && renderOverview()}
        {activeSubTab === "analysis" && renderAnalysisSwot()}
        {activeSubTab === "financials" && renderFinancials()}
        {activeSubTab === "dividends" && renderDividends()}
      </main>
    </div>
  );
}

function Metric({ icon, label, value, hint, tone = "text-slate-950" }: { icon: ReactNode; label: string; value: string; hint?: string; tone?: string }) {
  return (
    <div className="interactive-card fusion-panel rounded-lg p-4 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-3 inline-grid h-9 w-9 place-items-center rounded-lg bg-sky-500/15 text-sky-500">{icon}</div>
      <p className="text-xs font-black text-slate-500">{label}</p>
      <p className={`number mt-2 text-xl font-black ${tone}`}>{value}</p>
      {hint ? <p className="mt-1 text-xs font-bold text-slate-500">{hint}</p> : null}
    </div>
  );
}

function ChartPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
      <h3 className="mb-3 font-black text-slate-950">{title}</h3>
      {children}
    </div>
  );
}
