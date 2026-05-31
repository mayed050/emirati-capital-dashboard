"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Pencil, Plus, RotateCcw, Trash2, Upload, X, Coins, TrendingUp, AlertTriangle } from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend
} from "recharts";
import { stocksData } from "@/data/stocksData";
import { formatCurrency, formatCurrencyFull, formatNumber, percentClass } from "@/lib/format";
import { MiniCard } from "@/components/ui/MiniCard";
import {
  HOLDINGS_STORAGE_KEY,
  calculatePortfolioMetrics,
  runStressTest,
  simulateDrip,
} from "@/utils/analyticsEngine";
import type { PortfolioHolding, StockSymbol } from "@/types";

const colors = ["#0f6aa8", "#10b981", "#f59e0b", "#e11d48", "#6366f1", "#14b8a6", "#8b5cf6", "#84cc16"];

type BackupFile = {
  version: 1;
  exportedAt: string;
  holdings: PortfolioHolding[];
};

export function PortfolioTracker() {
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [symbol, setSymbol] = useState<StockSymbol>("DEWA");
  const [shares, setShares] = useState("1000");
  const [averageCost, setAverageCost] = useState("2.60");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  
  // Interactive DRIP Simulator States
  const [dripSymbol, setDripSymbol] = useState<StockSymbol>("DEWA");
  const [dripYears, setDripYears] = useState<number>(10);
  const [dripContribution, setDripContribution] = useState<string>("5000");
  const [dripReinvest, setDripReinvest] = useState<boolean>(true);

  const fileInput = useRef<HTMLInputElement | null>(null);
  const hydrated = useRef(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = window.localStorage.getItem(HOLDINGS_STORAGE_KEY);
      hydrated.current = true;
      if (!saved) return;
      try {
        const parsed = JSON.parse(saved) as PortfolioHolding[];
        const restored = validateHoldings(parsed);
        setHoldings(restored);
        if (restored[0]?.symbol) setDripSymbol(restored[0].symbol);
      } catch {
        setMessage("تعذر قراءة بيانات المحفظة المخزنة محلياً.");
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    window.localStorage.setItem(HOLDINGS_STORAGE_KEY, JSON.stringify(holdings));
  }, [holdings]);

  const metrics = useMemo(() => calculatePortfolioMetrics(holdings, stocksData), [holdings]);
  const stress = useMemo(() => runStressTest(holdings, stocksData), [holdings]);
  
  const selectedDripStock = stocksData.find((stock) => stock.symbol === dripSymbol) ?? stocksData[0];
  const selectedShares = holdings.find((holding) => holding.symbol === selectedDripStock.symbol)?.shares ?? (Number(shares) || 0);
  
  // Interactive simulateDrip call
  const drip = useMemo(() => {
    return simulateDrip(
      selectedDripStock,
      selectedShares,
      dripYears,
      Number(dripContribution) || 0,
      dripReinvest
    );
  }, [selectedDripStock, selectedShares, dripYears, dripContribution, dripReinvest]);

  const cashflow = buildCashflow(holdings);

  function addHolding() {
    const shareValue = Number(shares);
    const costValue = Number(averageCost);
    if (!Number.isFinite(shareValue) || shareValue <= 0 || !Number.isFinite(costValue) || costValue < 0) {
      setMessage("أدخل عدد أسهم وتكلفة صحيحة.");
      return;
    }
    const stock = stocksData.find((item) => item.symbol === symbol);
    if (!stock) return;
    if (editingId) {
      setHoldings((current) =>
        current.map((holding) =>
          holding.id === editingId
            ? {
                ...holding,
                symbol,
                shares: shareValue,
                averageCost: costValue,
              }
            : holding,
        ),
      );
      setEditingId(null);
      setDripSymbol(symbol);
      setMessage(`تم تحديث ${stock.nameAr} في المحفظة.`);
      return;
    }
    setHoldings((current) => [
      ...current,
      {
        id: createId(),
        symbol,
        shares: shareValue,
        averageCost: costValue,
        addedAt: new Date().toISOString(),
      },
    ]);
    setDripSymbol(symbol);
    setMessage(`تمت إضافة ${stock.nameAr} إلى المحفظة.`);
  }

  function startEdit(holding: PortfolioHolding) {
    setEditingId(holding.id);
    setSymbol(holding.symbol);
    setShares(String(holding.shares));
    setAverageCost(String(holding.averageCost));
    setMessage("يمكنك تعديل بيانات الأصل ثم حفظ التعديل.");
  }

  function cancelEdit() {
    setEditingId(null);
    setMessage("");
  }

  function removeHolding(id: string) {
    setHoldings((current) => current.filter((holding) => holding.id !== id));
    if (editingId === id) cancelEdit();
  }

  function exportBackup() {
    const payload: BackupFile = {
      version: 1,
      exportedAt: new Date().toISOString(),
      holdings,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `emirati-capital-holdings-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("تم تصدير نسخة JSON من المحفظة.");
  }

  async function importBackup(file: File | undefined) {
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as BackupFile;
      if (parsed.version !== 1 || !Array.isArray(parsed.holdings)) {
        throw new Error("Invalid schema");
      }
      const restored = validateHoldings(parsed.holdings);
      setHoldings(restored);
      if (restored[0]?.symbol) setDripSymbol(restored[0].symbol);
      setMessage(`تم استيراد ${restored.length} أصل من النسخة الاحتياطية.`);
    } catch {
      setMessage("ملف الاستيراد غير صالح. الصيغة المطلوبة: version 1 و holdings صحيحة.");
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  return (
    <div className="view-fade grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5">
      <header className="glass-panel rounded-lg p-5">
        <p className="text-sm font-black text-sky-700">LocalStorage · مخرجات معيارية</p>
        <h1 className="mt-2 text-2xl font-black text-slate-950 md:text-3xl">متتبع المحفظة الاستثمارية الذكي</h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
          أضف أصولك محلياً بشكل آمن، تابع التدفقات الشهرية للتوزيعات، واختبر أثر هزات وهبوط السوق على عوائدك دون إرسال بياناتك لخوادم خارجية.
        </p>
      </header>

      <section className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
        <div className="glass-panel rounded-lg p-4">
          <h2 className="text-xl font-black text-slate-950">إدارة الأصول والصفقات</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-1">
            <label className="grid gap-1 text-sm font-black text-slate-600">
              اختر السهم
              <select value={symbol} onChange={(event) => setSymbol(event.target.value as StockSymbol)} className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 font-bold">
                {stocksData.map((stock) => (
                  <option key={stock.symbol} value={stock.symbol}>
                    {stock.symbol} - {stock.nameAr}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-black text-slate-600">
              عدد الأسهم المملوكة
              <input value={shares} onChange={(event) => setShares(event.target.value)} className="number min-h-11 rounded-lg border border-slate-200 bg-white px-3 font-bold" inputMode="decimal" />
            </label>
            <label className="grid gap-1 text-sm font-black text-slate-600">
              متوسط تكلفة الشراء (درهم)
              <input value={averageCost} onChange={(event) => setAverageCost(event.target.value)} className="number min-h-11 rounded-lg border border-slate-200 bg-white px-3 font-bold" inputMode="decimal" />
            </label>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={addHolding} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-sky-700 px-4 font-black text-white hover:bg-sky-800 sm:w-auto transition-all">
              {editingId ? <Pencil size={18} aria-hidden /> : <Plus size={18} aria-hidden />}
              {editingId ? "حفظ التعديل" : "إضافة السهم"}
            </button>
            {editingId ? (
              <button type="button" onClick={cancelEdit} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 font-black text-slate-700 hover:bg-slate-50 sm:w-auto transition-all">
                <X size={18} aria-hidden />
                إلغاء التعديل
              </button>
            ) : null}
          </div>
          {message ? <p className="mt-3 rounded-lg bg-sky-50 p-3 text-sm font-bold text-sky-900">{message}</p> : null}
        </div>

        <div className="glass-panel rounded-lg p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-3">
            <h2 className="text-xl font-black text-slate-950">إحصائيات المحفظة والأدوات</h2>
            <div className="grid w-full gap-2 sm:flex sm:w-auto sm:flex-wrap">
              <button type="button" onClick={exportBackup} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 hover:bg-sky-50 transition-all">
                <Download size={17} aria-hidden />
                تصدير محلي JSON
              </button>
              <button type="button" onClick={() => fileInput.current?.click()} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 hover:bg-sky-50 transition-all">
                <Upload size={17} aria-hidden />
                استيراد محفظة JSON
              </button>
              <button type="button" onClick={() => setHoldings([])} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 text-sm font-black text-rose-700 hover:bg-rose-100 transition-all">
                <RotateCcw size={17} aria-hidden />
                تصفير المحفظة
              </button>
            </div>
            <input ref={fileInput} type="file" accept="application/json" className="hidden" onChange={(event) => void importBackup(event.target.files?.[0])} />
          </div>

          {/* Metrics De-duplicated with MiniCard */}
          <div className="mt-4 grid gap-3 grid-cols-2 md:grid-cols-4">
            <MiniCard label="القيمة السوقية للمحفظة" value={formatCurrencyFull(metrics.marketValue)} />
            <MiniCard label="إجمالي تكلفة الشراء" value={formatCurrencyFull(metrics.totalCost)} />
            <MiniCard label="الأرباح/الخسائر غير المحققة" value={formatCurrencyFull(metrics.unrealizedPnL)} className={percentClass(metrics.unrealizedPnL)} />
            <MiniCard label="العائد السنوي المتوقع" value={formatCurrencyFull(metrics.annualIncome)} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="glass-panel rounded-lg p-4">
          <h2 className="text-xl font-black text-slate-950">تفاصيل الأصول والمراكز الحالية</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="text-slate-500">
                <tr>
                  {["السهم", "عدد الأسهم", "متوسط التكلفة", "السعر الحالي", "القيمة السوقية", "التوزيع السنوي", "خيارات"].map((heading) => (
                    <th key={heading} className="border-b border-slate-200 px-3 py-2 text-right font-black">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {holdings.map((holding) => {
                  const stock = stocksData.find((item) => item.symbol === holding.symbol);
                  if (!stock) return null;
                  return (
                    <tr key={holding.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                      <td className="px-3 py-3 font-black text-slate-900">{stock.symbol}<div className="text-xs text-slate-500">{stock.nameAr}</div></td>
                      <td className="number px-3 py-3">{formatNumber(holding.shares)}</td>
                      <td className="number px-3 py-3">{formatCurrency(holding.averageCost)}</td>
                      <td className="number px-3 py-3">{formatCurrency(stock.prices.last)}</td>
                      <td className="number px-3 py-3 font-black">{formatCurrencyFull(holding.shares * stock.prices.last)}</td>
                      <td className="number px-3 py-3">{formatCurrencyFull(holding.shares * stock.dividend.annualDividend)}</td>
                      <td className="px-3 py-3">
                        <div className="flex gap-2">
                          <button type="button" onClick={() => startEdit(holding)} className="grid h-9 w-9 place-items-center rounded-lg border border-sky-200 text-sky-700 hover:bg-sky-50 transition-all" aria-label="تعديل الأصل">
                            <Pencil size={16} aria-hidden />
                          </button>
                          <button type="button" onClick={() => removeHolding(holding.id)} className="grid h-9 w-9 place-items-center rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 transition-all" aria-label="حذف الأصل">
                            <Trash2 size={16} aria-hidden />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!holdings.length ? <p className="py-8 text-center text-sm font-bold text-slate-500">لم تقم بإضافة أسهم لمحفظتك بعد.</p> : null}
          </div>
        </div>

        <div className="glass-panel rounded-lg p-4">
          <h2 className="text-xl font-black text-slate-950">توزيع ونسب تركيز المحفظة</h2>
          <div className="mt-4 flex justify-center">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={metrics.allocation} dataKey="value" nameKey="symbol" innerRadius={58} outerRadius={90} paddingAngle={3}>
                  {metrics.allocation.map((entry, index) => (
                    <Cell key={entry.symbol} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrencyFull(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid gap-2 mt-2">
            {metrics.allocation.map((item, index) => (
              <div key={item.symbol} className="flex items-center justify-between rounded-lg bg-white/70 px-3 py-2 text-sm border border-slate-100">
                <span className="flex items-center gap-2 font-black text-slate-800">
                  <span className="h-3 w-3 rounded-full" style={{ background: colors[index % colors.length] }} />
                  {item.symbol}
                </span>
                <span className="number font-black text-slate-900">{item.weight.toFixed(1)}%</span>
              </div>
            ))}
          </div>
          {metrics.concentrationAlerts.map((alert) => (
            <p key={alert.id} className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-900 flex items-center gap-2">
              <AlertTriangle className="text-amber-600 shrink-0" size={18} />
              {alert.message}
            </p>
          ))}
        </div>
      </section>

      {/* Dynamic Compounding DRIP Simulator & Monthly Cashflow */}
      <section className="grid gap-4 xl:grid-cols-2">
        {/* Monthly Cashflow Calendar */}
        <div className="glass-panel rounded-lg p-4">
          <h2 className="text-xl font-black text-slate-950">التدفق النقدي المتوقع للتوزيعات (شهرياً)</h2>
          <p className="text-sm text-slate-500 mt-1">توقع توزيعات السيولة النقدية المستلمة مقسمة على شهور السنة المالية.</p>
          <div className="mt-4">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={cashflow}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => formatCurrencyFull(Number(value))} />
                <Bar dataKey="income" name="مبلغ التوزيع المستحق" fill="#0f6aa8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Premium Interactive DRIP Compounding Planner */}
        <div className="glass-panel rounded-lg p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between border-b border-slate-100 pb-3 mb-4">
            <div>
              <h2 className="text-xl font-black text-slate-950 flex items-center gap-2">
                <Coins className="text-sky-500" size={20} />
                مخطط تراكم وتضاعف الأرباح (DRIP)
              </h2>
              <p className="text-xs text-slate-500 mt-1">محاكاة أثر الفائدة المركبة وإعادة استثمار الأرباح النقدية لشراء أسهم جديدة.</p>
            </div>
            
            <label className="grid gap-1 text-[11px] font-black text-slate-600 shrink-0">
              سهم المحاكاة
              <select value={dripSymbol} onChange={(event) => setDripSymbol(event.target.value as StockSymbol)} className="min-h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold">
                {stocksData.map((stock) => (
                  <option key={stock.symbol} value={stock.symbol}>{stock.symbol} - {stock.nameAr}</option>
                ))}
              </select>
            </label>
          </div>

          {/* Interactive DRIP Controls Layout */}
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-3 bg-slate-50 rounded-xl p-3.5 mb-4">
            <label className="grid gap-1 text-xs font-black text-slate-600">
              أعوام الاستثمار
              <select 
                value={dripYears} 
                onChange={(event) => setDripYears(Number(event.target.value))} 
                className="min-h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold"
              >
                {[5, 10, 15, 20, 25, 30].map((yr) => (
                  <option key={yr} value={yr}>{yr} سنة</option>
                ))}
              </select>
            </label>

            <label className="grid gap-1 text-xs font-black text-slate-600">
              المساهمة السنوية الإضافية (درهم)
              <input 
                value={dripContribution} 
                onChange={(event) => setDripContribution(event.target.value)} 
                className="number min-h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold" 
                inputMode="decimal"
                placeholder="0"
              />
            </label>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-black text-slate-600">إعادة الاستثمار التلقائي</span>
              <button
                type="button"
                onClick={() => setDripReinvest(!dripReinvest)}
                className={`min-h-9 rounded-lg px-3 text-xs font-black transition-all ${
                  dripReinvest 
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/10" 
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {dripReinvest ? "مفعّل (أرباح مركبة)" : "معطل (سحب كاش)"}
              </button>
            </div>
          </div>

          <div className="w-full">
            <ResponsiveContainer width="100%" height={218}>
              <LineChart data={drip} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <XAxis dataKey="year" tick={{ fontSize: 11 }} label={{ value: "السنوات", position: "insideBottom", offset: -5, fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => formatCurrencyFull(Number(value))} />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Line type="monotone" dataKey="portfolioValue" name="إجمالي قيمة المحفظة (درهم)" stroke="#10b981" strokeWidth={3} dot={{ r: 3 }} isAnimationActive={false} />
                {!dripReinvest && (
                  <Line type="monotone" dataKey="accumulatedDividendsCash" name="الكاش المتراكم الموزع (درهم)" stroke="#0ea5e9" strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 2 }} isAnimationActive={false} />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Informational Advisory Box */}
          <div className="mt-3.5 rounded-lg border border-sky-500/15 bg-sky-500/5 p-3 text-xs leading-6 text-slate-600 flex items-start gap-2">
            <Info className="text-sky-500 shrink-0 mt-0.5" size={16} />
            <p>
              {dripReinvest 
                ? `محاكاة إعادة استثمار الأرباح لشراء أسهم جديدة في ${selectedDripStock.nameAr} تنشط قوة الفائدة المركبة! قيمة المحفظة النهائية المتوقعة بعد ${dripYears} سنة تبلغ ${formatCurrencyFull(drip[drip.length - 1]?.portfolioValue)} درهم بعدد أسهم قدره ${formatNumber(drip[drip.length - 1]?.shares)} سهم.`
                : `عند سحب التوزيعات كاش بدلاً من إعادة استثمارها، يفقد المستثمر أثر النمو المتضاعف للأصول. إجمالي الكاش التراكمي المستلم في نهاية ${dripYears} سنة يبلغ ${formatCurrencyFull(drip[drip.length - 1]?.accumulatedDividendsCash)} درهم.`
              }
            </p>
          </div>
        </div>
      </section>

      {/* Portfolio Stress Testing */}
      <section className="glass-panel rounded-lg p-4">
        <h2 className="text-xl font-black text-slate-950 flex items-center gap-2">
          <TrendingUp className="text-rose-500" size={20} />
          اختبارات ضغط وهبوط الأسواق
        </h2>
        <p className="text-sm text-slate-500 mt-1">محاكاة افتراضية لأثر الأزمات المالية وهبوط أسعار الأسهم بمعدل 10%، 20%، و30% على قيمة محفظتك الحالية.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {stress.map((scenario) => (
            <div key={scenario.dropPercent} className="rounded-xl border border-rose-100 bg-rose-50/70 p-4 transition-all hover:bg-rose-50">
              <p className="text-sm font-black text-rose-700">سيناريو هبوط {scenario.dropPercent}%</p>
              <p className="number mt-2 text-xl font-black text-slate-950">{formatCurrencyFull(scenario.portfolioValue)}</p>
              <p className="mt-1 text-sm font-bold text-rose-700">الخسارة الدفترية: {formatCurrencyFull(scenario.lossValue)}</p>
              <p className="mt-3 border-t border-rose-200/50 pt-2 text-xs font-bold text-slate-500 leading-6">الدخل السنوي المتوقع للتوزيعات بعد الضغط: {formatCurrencyFull(scenario.annualIncomeAfterDrop)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function buildCashflow(holdings: PortfolioHolding[]) {
  const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"].map((month) => ({ month, income: 0 }));
  for (const holding of holdings) {
    const stock = stocksData.find((item) => item.symbol === holding.symbol);
    if (!stock) continue;
    const monthIndex = new Date(`${stock.dividend.paymentDate}T00:00:00Z`).getUTCMonth();
    months[monthIndex].income += holding.shares * stock.dividend.lastAmount;
  }
  return months.map((month) => ({ ...month, income: Number(month.income.toFixed(2)) }));
}

function validateHoldings(value: unknown): PortfolioHolding[] {
  if (!Array.isArray(value)) throw new Error("Holdings must be an array");
  return value.map((item) => {
    const holding = item as PortfolioHolding;
    const stockExists = stocksData.some((stock) => stock.symbol === holding.symbol);
    if (!stockExists || !Number.isFinite(holding.shares) || holding.shares <= 0 || !Number.isFinite(holding.averageCost) || holding.averageCost < 0) {
      throw new Error("Invalid holding");
    }
    return {
      id: holding.id || createId(),
      symbol: holding.symbol,
      shares: holding.shares,
      averageCost: holding.averageCost,
      addedAt: holding.addedAt || new Date().toISOString(),
    };
  });
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `holding-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
