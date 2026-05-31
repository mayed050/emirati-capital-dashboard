"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Pencil, Plus, RotateCcw, Trash2, Upload, X, Coins, TrendingUp, AlertTriangle, ArrowUpRight, ArrowDownRight, RefreshCw, ShoppingCart, Info } from "lucide-react";
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
import { useLanguage } from "@/context/languageContext";
import {
  HOLDINGS_STORAGE_KEY,
  calculatePortfolioMetrics,
  runStressTest,
  simulateDrip,
} from "@/utils/analyticsEngine";
import type { PortfolioHolding, StockSymbol } from "@/types";

export interface PortfolioTransaction {
  id: string;
  symbol: StockSymbol;
  type: "BUY" | "SELL";
  shares: number;
  price: number;
  timestamp: string;
  totalValue: number;
}

const colors = ["#0f6aa8", "#10b981", "#f59e0b", "#e11d48", "#6366f1", "#14b8a6", "#8b5cf6", "#84cc16"];

type BackupFile = {
  version: 1;
  exportedAt: string;
  holdings: PortfolioHolding[];
};

export function PortfolioTracker() {
  const { t, language } = useLanguage();
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [symbol, setSymbol] = useState<StockSymbol>("DEWA");
  const [shares, setShares] = useState("1000");
  const [averageCost, setAverageCost] = useState("2.60");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  
  // Paper Trading Cash & Transactions Ledger States
  const [virtualCash, setVirtualCash] = useState<number>(100000);
  const [transactions, setTransactions] = useState<PortfolioTransaction[]>([]);

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
      const savedCash = window.localStorage.getItem("emirati-capital:virtual-cash");
      const savedTx = window.localStorage.getItem("emirati-capital:transactions");
      
      hydrated.current = true;
      if (savedCash) setVirtualCash(Number(savedCash));
      if (savedTx) {
        try {
          setTransactions(JSON.parse(savedTx));
        } catch {}
      }
      
      if (!saved) return;
      try {
        const parsed = JSON.parse(saved) as PortfolioHolding[];
        const restored = validateHoldings(parsed);
        setHoldings(restored);
        if (restored[0]?.symbol) setDripSymbol(restored[0].symbol);
      } catch {
        setMessage(language === "ar" ? "تعذر قراءة بيانات المحفظة المخزنة محلياً." : "Failed to read local holdings data.");
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [language]);

  useEffect(() => {
    if (!hydrated.current) return;
    window.localStorage.setItem(HOLDINGS_STORAGE_KEY, JSON.stringify(holdings));
    window.localStorage.setItem("emirati-capital:virtual-cash", String(virtualCash));
    window.localStorage.setItem("emirati-capital:transactions", JSON.stringify(transactions));
  }, [holdings, virtualCash, transactions]);

  const executePaperTrade = (tradeType: "BUY" | "SELL", tradeSymbol: StockSymbol, tradeSharesCount: number) => {
    if (tradeSharesCount <= 0) {
      setMessage(language === "ar" ? "أدخل عدد أسهم صحيح للتداول." : "Enter a valid number of shares to trade.");
      return;
    }
    const stock = stocksData.find((s) => s.symbol === tradeSymbol);
    if (!stock) return;
    
    const livePrice = stock.prices.last;
    const totalCost = tradeSharesCount * livePrice;
    
    if (tradeType === "BUY") {
      if (virtualCash < totalCost) {
        setMessage(language === "ar" ? "رصيد الكاش غير كافٍ لإتمام الشراء الافتراضي!" : "Insufficient virtual cash to complete paper buy!");
        return;
      }
      setVirtualCash((prev) => prev - totalCost);
      
      setHoldings((current) => {
        const existing = current.find((h) => h.symbol === tradeSymbol);
        if (existing) {
          const totalShares = existing.shares + tradeSharesCount;
          const avgCost = (existing.shares * existing.averageCost + totalCost) / totalShares;
          return current.map((h) => h.symbol === tradeSymbol ? { ...h, shares: totalShares, averageCost: Number(avgCost.toFixed(3)) } : h);
        } else {
          return [...current, { id: createId(), symbol: tradeSymbol, shares: tradeSharesCount, averageCost: livePrice, addedAt: new Date().toISOString() }];
        }
      });
      
      const tx: PortfolioTransaction = {
        id: createId(),
        symbol: tradeSymbol,
        type: "BUY",
        shares: tradeSharesCount,
        price: livePrice,
        timestamp: new Date().toISOString(),
        totalValue: Number(totalCost.toFixed(2))
      };
      setTransactions((prev) => [tx, ...prev]);
      setMessage(language === "ar" ? `تم شراء ${tradeSharesCount} أسهم من ${stock.nameAr} افتراضياً بقيمة ${formatCurrency(totalCost)}` : `Bought ${tradeSharesCount} shares of ${stock.symbol} for ${formatCurrency(totalCost)}`);
    } else {
      const existingHolding = holdings.find((h) => h.symbol === tradeSymbol);
      if (!existingHolding || existingHolding.shares < tradeSharesCount) {
        setMessage(language === "ar" ? "ليس لديك أسهم كافية في المحفظة لبيعها!" : "Insufficient shares in portfolio to sell!");
        return;
      }
      
      setVirtualCash((prev) => prev + totalCost);
      
      setHoldings((current) => {
        return current.map((h) => {
          if (h.symbol === tradeSymbol) {
            const remainingShares = h.shares - tradeSharesCount;
            return { ...h, shares: remainingShares };
          }
          return h;
        }).filter((h) => h.shares > 0);
      });
      
      const tx: PortfolioTransaction = {
        id: createId(),
        symbol: tradeSymbol,
        type: "SELL",
        shares: tradeSharesCount,
        price: livePrice,
        timestamp: new Date().toISOString(),
        totalValue: Number(totalCost.toFixed(2))
      };
      setTransactions((prev) => [tx, ...prev]);
      setMessage(language === "ar" ? `تم بيع ${tradeSharesCount} أسهم من ${stock.nameAr} افتراضياً بقيمة ${formatCurrency(totalCost)}` : `Sold ${tradeSharesCount} shares of ${stock.symbol} for ${formatCurrency(totalCost)}`);
    }
  };

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
        <p className="text-sm font-black text-sky-700">LocalStorage · Local-First Data</p>
        <h1 className="mt-2 text-2xl font-black text-slate-950 md:text-3xl">{t("portfolioTitle")}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
          {t("portfolioSubtitle")}
        </p>
      </header>

      {/* Metrics Row (De-duplicated with MiniCard) */}
      <section className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <MiniCard label={language === "ar" ? "القيمة السوقية للمحفظة" : "Portfolio Market Value"} value={formatCurrencyFull(metrics.marketValue)} />
        <MiniCard label={language === "ar" ? "إجمالي تكلفة الشراء" : "Total Capital Cost"} value={formatCurrencyFull(metrics.totalCost)} />
        <MiniCard label={language === "ar" ? "الأرباح/الخسائر غير المحققة" : "Unrealized P&L"} value={formatCurrencyFull(metrics.unrealizedPnL)} className={percentClass(metrics.unrealizedPnL)} />
        <MiniCard label={language === "ar" ? "العائد السنوي المتوقع" : "Expected Annual Yield"} value={formatCurrencyFull(metrics.annualIncome)} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        {/* Panel 1: Manual Asset Manager */}
        <div className="glass-panel rounded-lg p-4 flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-950 flex items-center gap-2 mb-4">
              <Pencil size={18} className="text-sky-500" />
              {language === "ar" ? "إدارة الأصول اليدوية" : "Manual Asset Manager"}
            </h2>
            <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-1">
              <label className="grid gap-1 text-sm font-black text-slate-600">
                {language === "ar" ? "اختر السهم" : "Select Stock"}
                <select value={symbol} onChange={(event) => setSymbol(event.target.value as StockSymbol)} className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 font-bold">
                  {stocksData.map((stock) => (
                    <option key={stock.symbol} value={stock.symbol}>
                      {stock.symbol} - {language === "ar" ? stock.nameAr : stock.nameEn}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-sm font-black text-slate-600">
                {language === "ar" ? "عدد الأسهم المملوكة" : "Shares Owned"}
                <input value={shares} onChange={(event) => setShares(event.target.value)} className="number min-h-11 rounded-lg border border-slate-200 bg-white px-3 font-bold" inputMode="decimal" />
              </label>
              <label className="grid gap-1 text-sm font-black text-slate-600">
                {language === "ar" ? "متوسط تكلفة الشراء (درهم)" : "Average Cost (AED)"}
                <input value={averageCost} onChange={(event) => setAverageCost(event.target.value)} className="number min-h-11 rounded-lg border border-slate-200 bg-white px-3 font-bold" inputMode="decimal" />
              </label>
            </div>
          </div>
          <div className="mt-5">
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={addHolding} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-sky-700 px-4 font-black text-white hover:bg-sky-800 transition-all">
                {editingId ? <Pencil size={18} aria-hidden /> : <Plus size={18} aria-hidden />}
                {editingId ? (language === "ar" ? "حفظ التعديل" : "Save Changes") : (language === "ar" ? "إضافة السهم" : "Add Asset")}
              </button>
              {editingId ? (
                <button type="button" onClick={cancelEdit} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 font-black text-slate-700 hover:bg-slate-50 transition-all">
                  <X size={18} aria-hidden />
                  {language === "ar" ? "إلغاء التعديل" : "Cancel"}
                </button>
              ) : null}
            </div>
            {message ? <p className="mt-3 rounded-lg bg-sky-50 p-3 text-xs font-bold text-sky-900">{message}</p> : null}
          </div>
        </div>

        {/* Panel 2: Virtual Paper Trading Terminal */}
        <div className="glass-panel rounded-lg p-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-xl font-black text-slate-950 flex items-center gap-2">
                <ShoppingCart size={18} className="text-emerald-500" />
                {t("virtualTradingDesk")}
              </h2>
              <div className="rounded-lg bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-600">
                💳 {t("tradingBalance")}: {formatCurrency(virtualCash)}
              </div>
            </div>
            
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1 text-sm font-black text-slate-600">
                {language === "ar" ? "اختر السهم للتداول" : "Select Stock to Trade"}
                <select value={symbol} onChange={(event) => setSymbol(event.target.value as StockSymbol)} className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 font-bold">
                  {stocksData.map((stock) => (
                    <option key={stock.symbol} value={stock.symbol}>
                      {stock.symbol} ({formatCurrency(stock.prices.last)} AED)
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-sm font-black text-slate-600">
                {t("sharesAmount")}
                <input value={shares} onChange={(event) => setShares(event.target.value)} className="number min-h-11 rounded-lg border border-slate-200 bg-white px-3 font-bold" inputMode="decimal" />
              </label>
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <button 
              type="button" 
              onClick={() => executePaperTrade("BUY", symbol, Number(shares) || 0)} 
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 font-black text-white hover:bg-emerald-700 transition-all"
            >
              {t("buyAction")}
            </button>
            <button 
              type="button" 
              onClick={() => executePaperTrade("SELL", symbol, Number(shares) || 0)} 
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 font-black text-white hover:bg-rose-700 transition-all"
            >
              {t("sellAction")}
            </button>
          </div>
        </div>
      </section>

      {/* Backup and Restore Utilities */}
      <section className="glass-panel rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h3 className="font-black text-slate-950 text-base">{language === "ar" ? "أدوات النسخ الاحتياطي" : "Data Backup Utilities"}</h3>
          <p className="text-xs text-slate-500">{language === "ar" ? "قم بحفظ محفظتك خارجياً أو استعادتها بنقرة زر واحدة" : "Export or restore holdings to localized JSON backup file"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={exportBackup} className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 hover:bg-sky-50 transition-all">
            <Download size={15} aria-hidden />
            {language === "ar" ? "تصدير محلي JSON" : "Export JSON"}
          </button>
          <button type="button" onClick={() => fileInput.current?.click()} className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 hover:bg-sky-50 transition-all">
            <Upload size={15} aria-hidden />
            {language === "ar" ? "استيراد محفظة JSON" : "Import JSON"}
          </button>
          <button type="button" onClick={() => { if(confirm("Are you sure?")) { setHoldings([]); setTransactions([]); setVirtualCash(100000); } }} className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 text-xs font-black text-rose-700 hover:bg-rose-100 transition-all">
            <RotateCcw size={15} aria-hidden />
            {language === "ar" ? "تصفير المحفظة" : "Reset Data"}
          </button>
          <input ref={fileInput} type="file" accept="application/json" className="hidden" onChange={(event) => void importBackup(event.target.files?.[0])} />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        {/* Panel 3: Holdings details */}
        <div className="glass-panel rounded-lg p-4">
          <h2 className="text-xl font-black text-slate-950 mb-4">{t("holdingsList")}</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-slate-500">
                <tr>
                  {[t("thCompany"), language === "ar" ? "الأسهم" : "Shares", language === "ar" ? "متوسط التكلفة" : "Avg Cost", language === "ar" ? "السعر الحالي" : "Current Price", language === "ar" ? "القيمة السوقية" : "Market Value", language === "ar" ? "التوزيع السنوي" : "Annual Dividend", language === "ar" ? "خيارات" : "Actions"].map((heading) => (
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
                      <td className="px-3 py-3 font-black text-slate-900">{stock.symbol}<div className="text-xs text-slate-500">{language === "ar" ? stock.nameAr : stock.nameEn}</div></td>
                      <td className="number px-3 py-3">{formatNumber(holding.shares)}</td>
                      <td className="number px-3 py-3">{formatCurrency(holding.averageCost)}</td>
                      <td className="number px-3 py-3">{formatCurrency(stock.prices.last)}</td>
                      <td className="number px-3 py-3 font-black">{formatCurrencyFull(holding.shares * stock.prices.last)}</td>
                      <td className="number px-3 py-3">{formatCurrencyFull(holding.shares * stock.dividend.annualDividend)}</td>
                      <td className="px-3 py-3">
                        <div className="flex gap-2">
                          <button type="button" onClick={() => startEdit(holding)} className="grid h-8 w-8 place-items-center rounded-lg border border-sky-200 text-sky-700 hover:bg-sky-50 transition-all" aria-label="Edit">
                            <Pencil size={14} aria-hidden />
                          </button>
                          <button type="button" onClick={() => removeHolding(holding.id)} className="grid h-8 w-8 place-items-center rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 transition-all" aria-label="Delete">
                            <Trash2 size={14} aria-hidden />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!holdings.length ? <p className="py-8 text-center text-sm font-bold text-slate-500">{t("noHoldings")}</p> : null}
          </div>
        </div>

        {/* Panel 4: Allocation charts */}
        <div className="glass-panel rounded-lg p-4 flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-950 mb-4">{language === "ar" ? "توزيع ونسب تركيز المحفظة" : "Portfolio Weight Allocations"}</h2>
            <div className="flex justify-center">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={metrics.allocation} dataKey="value" nameKey="symbol" innerRadius={42} outerRadius={68} paddingAngle={3}>
                    {metrics.allocation.map((entry, index) => (
                      <Cell key={entry.symbol} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrencyFull(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-1.5 mt-2 max-h-[140px] overflow-y-auto pr-1">
              {metrics.allocation.map((item, index) => (
                <div key={item.symbol} className="flex items-center justify-between rounded-lg bg-white/70 px-3 py-1.5 text-xs border border-slate-100">
                  <span className="flex items-center gap-2 font-black text-slate-800">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: colors[index % colors.length] }} />
                    {item.symbol}
                  </span>
                  <span className="number font-black text-slate-900">{item.weight.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
          {metrics.concentrationAlerts.map((alert) => (
            <p key={alert.id} className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs font-bold text-amber-900 flex items-center gap-2">
              <AlertTriangle className="text-amber-600 shrink-0" size={16} />
              {alert.message}
            </p>
          ))}
        </div>
      </section>

      {/* Transaction Ledger Section */}
      <section className="glass-panel rounded-lg p-4">
        <h2 className="text-xl font-black text-slate-950 mb-3 flex items-center gap-2">
          <RefreshCw size={18} className="text-sky-500" />
          {t("transactionLedger")}
        </h2>
        <div className="overflow-x-auto max-h-[250px] overflow-y-auto pr-1">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-slate-500 sticky top-0 bg-white">
              <tr>
                {[t("thCompany"), t("thType"), t("thPrice"), t("thShares"), t("thTotal"), t("thTime")].map((heading) => (
                  <th key={heading} className="border-b border-slate-200 px-3 py-2 text-right font-black">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                  <td className="px-3 py-2.5 font-black text-slate-900">{tx.symbol}</td>
                  <td className="px-3 py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-black border ${
                      tx.type === "BUY" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-rose-50 border-rose-200 text-rose-700"
                    }`}>
                      {tx.type === "BUY" ? t("buyAction") : t("sellAction")}
                    </span>
                  </td>
                  <td className="number px-3 py-2.5">{formatCurrency(tx.price)}</td>
                  <td className="number px-3 py-2.5 font-bold">{formatNumber(tx.shares)}</td>
                  <td className="number px-3 py-2.5 font-black">{formatCurrencyFull(tx.totalValue)}</td>
                  <td className="px-3 py-2.5 text-xs font-bold text-slate-400">{new Date(tx.timestamp).toLocaleString(language === "ar" ? "ar-AE" : "en-US")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!transactions.length ? (
            <p className="py-8 text-center text-sm font-bold text-slate-500">
              {language === "ar" ? "سجل الصفقات خالٍ تماماً حتى الآن." : "No transactions have been recorded yet."}
            </p>
          ) : null}
        </div>
      </section>

      {/* Dynamic Compounding DRIP Simulator & Monthly Cashflow */}
      <section className="grid gap-4 xl:grid-cols-2">
        <div className="glass-panel rounded-lg p-4">
          <h2 className="text-xl font-black text-slate-950">
            {language === "ar" ? "التدفق النقدي المتوقع للتوزيعات (شهرياً)" : "Expected Monthly Cashflow Schedule"}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {language === "ar" ? "توقع توزيعات السيولة النقدية المستلمة مقسمة على شهور السنة المالية." : "Projected cash payouts mapped out across the months of the calendar year."}
          </p>
          <div className="mt-4">
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={cashflow}>
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(value) => formatCurrencyFull(Number(value))} />
                <Bar dataKey="income" name={language === "ar" ? "مبلغ التوزيع المستحق" : "Dividends Receivable"} fill="#0f6aa8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel rounded-lg p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between border-b border-slate-100 pb-3 mb-4">
            <div>
              <h2 className="text-xl font-black text-slate-950 flex items-center gap-2">
                <Coins className="text-sky-500" size={20} />
                {t("dripPlanner")}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {language === "ar" ? "محاكاة أثر الفائدة المركبة وإعادة استثمار الأرباح النقدية لشراء أسهم جديدة." : "Model dynamic compound wealth growth over years of reinvesting payouts."}
              </p>
            </div>
            
            <label className="grid gap-1 text-[11px] font-black text-slate-600 shrink-0">
              {language === "ar" ? "سهم المحاكاة" : "Simulated Stock"}
              <select value={dripSymbol} onChange={(event) => setDripSymbol(event.target.value as StockSymbol)} className="min-h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold">
                {stocksData.map((stock) => (
                  <option key={stock.symbol} value={stock.symbol}>{stock.symbol} - {language === "ar" ? stock.nameAr : stock.nameEn}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-3 grid-cols-1 sm:grid-cols-3 bg-slate-50 rounded-xl p-3.5 mb-4">
            <label className="grid gap-1 text-xs font-black text-slate-600">
              {t("dripHorizon")}
              <select 
                value={dripYears} 
                onChange={(event) => setDripYears(Number(event.target.value))} 
                className="min-h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold"
              >
                {[5, 10, 15, 20, 25, 30].map((yr) => (
                  <option key={yr} value={yr}>{yr} {language === "ar" ? "سنة" : "Years"}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-1 text-xs font-black text-slate-600">
              {t("dripAnnualContrib")}
              <input 
                value={dripContribution} 
                onChange={(event) => setDripContribution(event.target.value)} 
                className="number min-h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold" 
                inputMode="decimal"
                placeholder="0"
              />
            </label>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-black text-slate-600">{language === "ar" ? "طريقة التوزيع" : "Distribution Mode"}</span>
              <button
                type="button"
                onClick={() => setDripReinvest(!dripReinvest)}
                className={`min-h-9 rounded-lg px-3 text-xs font-black transition-all ${
                  dripReinvest 
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/10" 
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {dripReinvest ? t("dripReinvest") : t("dripCashOut")}
              </button>
            </div>
          </div>

          <div className="w-full">
            <ResponsiveContainer width="100%" height={218}>
              <LineChart data={drip} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <XAxis dataKey="year" tick={{ fontSize: 10 }} label={{ value: language === "ar" ? "السنوات" : "Years", position: "insideBottom", offset: -5, fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(value) => formatCurrencyFull(Number(value))} />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="portfolioValue" name={language === "ar" ? "إجمالي قيمة المحفظة (درهم)" : "Total Portfolio NAV (AED)"} stroke="#10b981" strokeWidth={3} dot={{ r: 3 }} isAnimationActive={false} />
                {!dripReinvest && (
                  <Line type="monotone" dataKey="accumulatedDividendsCash" name={language === "ar" ? "الكاش المتراكم الموزع (درهم)" : "Accumulated Cash Payouts"} stroke="#0ea5e9" strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 2 }} isAnimationActive={false} />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3.5 rounded-lg border border-sky-500/15 bg-sky-500/5 p-3 text-xs leading-6 text-slate-600 flex items-start gap-2">
            <Info className="text-sky-500 shrink-0 mt-0.5" size={16} />
            <p>
              {dripReinvest 
                ? (language === "ar" 
                  ? `محاكاة إعادة استثمار الأرباح لشراء أسهم جديدة في ${selectedDripStock.nameAr} تنشط قوة الفائدة المركبة! قيمة المحفظة النهائية المتوقعة بعد ${dripYears} سنة تبلغ ${formatCurrencyFull(drip[drip.length - 1]?.portfolioValue)} درهم بعدد أسهم قدره ${formatNumber(drip[drip.length - 1]?.shares)} سهم.`
                  : `Simulating reinvestment of cash payouts to acquire more shares in ${selectedDripStock.nameEn} triggers compound growth! Final portfolio NAV is projected at ${formatCurrencyFull(drip[drip.length - 1]?.portfolioValue)} AED after ${dripYears} years with total shares compounding to ${formatNumber(drip[drip.length - 1]?.shares)}.`)
                : (language === "ar"
                  ? `عند سحب التوزيعات كاش بدلاً من إعادة استثمارها، يفقد المستثمر أثر النمو المتضاعف للأصول. إجمالي الكاش التراكمي المستلم في نهاية ${dripYears} سنة يبلغ ${formatCurrencyFull(drip[drip.length - 1]?.accumulatedDividendsCash)} درهم.`
                  : `By withdrawing cash dividends instead of reinvesting them, the compounding effect is lost. Cumulative cash collected in the ledger by year ${dripYears} sums up to ${formatCurrencyFull(drip[drip.length - 1]?.accumulatedDividendsCash)} AED.`)
              }
            </p>
          </div>
        </div>
      </section>

      {/* Portfolio Stress Testing */}
      <section className="glass-panel rounded-lg p-4">
        <h2 className="text-xl font-black text-slate-950 flex items-center gap-2">
          <TrendingUp className="text-rose-500" size={20} />
          {language === "ar" ? "اختبارات ضغط وهبوط الأسواق" : "Portfolio Stress Testing & Shock Scenarios"}
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          {language === "ar" ? "محاكاة افتراضية لأثر الأزمات المالية وهبوط أسعار الأسهم بمعدل 10%، 20%، و30% على قيمة محفظتك الحالية." : "Simulated balance P&L drops of 10%, 20%, and 30% to review potential portfolio drawdowns."}
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {stress.map((scenario) => (
            <div key={scenario.dropPercent} className="rounded-xl border border-rose-100 bg-rose-50/70 p-4 transition-all hover:bg-rose-50 animate-fade-in">
              <p className="text-sm font-black text-rose-700">{language === "ar" ? `سيناريو هبوط ${scenario.dropPercent}%` : `${scenario.dropPercent}% Market Drop Scenario`}</p>
              <p className="number mt-2 text-xl font-black text-slate-950">{formatCurrencyFull(scenario.portfolioValue)}</p>
              <p className="mt-1 text-sm font-bold text-rose-700">{language === "ar" ? "الخسارة الدفترية:" : "Book Loss:"} {formatCurrencyFull(scenario.lossValue)}</p>
              <p className="mt-3 border-t border-rose-200/50 pt-2 text-xs font-bold text-slate-500 leading-6">{language === "ar" ? "الدخل السنوي المتوقع للتوزيعات بعد الضغط:" : "Post-shock projected annual income:"} {formatCurrencyFull(scenario.annualIncomeAfterDrop)}</p>
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
