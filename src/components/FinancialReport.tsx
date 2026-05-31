"use client";

import { useMemo, useState } from "react";
import { Printer, Eye, EyeOff, LayoutGrid, CheckSquare, Square } from "lucide-react";
import { DATASET_INFO, stocksData } from "@/data/stocksData";
import { formatCurrency, formatDate, formatNumber, formatPercent, formatPlainPercent } from "@/lib/format";
import { calculateDividendSustainability, calculateFinancialHealthScore, getExpectedTrend } from "@/utils/analyticsEngine";
import { useLanguage } from "@/context/languageContext";
import { useLiveMarket } from "@/hooks/useLiveMarket";

type ColumnKey = "pe" | "roe" | "divRating" | "health" | "trend" | "target";

export function FinancialReport() {
  const { language, t } = useLanguage();
  const { stocks: liveStocks } = useLiveMarket();
  const isAr = language === "ar";

  // Fallback to static seed data during server-side rendering (SSR) or initial hydration
  const rawStocks = useMemo(() => {
    return liveStocks.length > 0 ? liveStocks : stocksData;
  }, [liveStocks]);

  // Client States for customization (hidden in print)
  const [selectedMarket, setSelectedMarket] = useState<"ALL" | "DFM" | "ADX">("ALL");
  const [selectedSector, setSelectedSector] = useState<string>("ALL");
  const [visibleColumns, setVisibleColumns] = useState<Record<ColumnKey, boolean>>({
    pe: true,
    roe: true,
    divRating: true,
    health: true,
    trend: true,
    target: true,
  });

  // Filter Stocks based on customization
  const filteredStocks = useMemo(() => {
    return rawStocks
      .filter((s) => selectedMarket === "ALL" || s.market === selectedMarket)
      .filter((s) => selectedSector === "ALL" || s.sector === selectedSector);
  }, [rawStocks, selectedMarket, selectedSector]);

  const leaderStocks = useMemo(() => filteredStocks.filter((s) => s.marketLeader), [filteredStocks]);

  // Extract unique sectors based on selected market
  const availableSectors = useMemo(() => {
    const marketStocks = selectedMarket === "ALL" ? rawStocks : rawStocks.filter((s) => s.market === selectedMarket);
    return Array.from(new Set(marketStocks.map((s) => s.sector))).sort((a, b) => a.localeCompare(b, isAr ? "ar" : "en"));
  }, [rawStocks, selectedMarket, isAr]);

  const averageHealth = useMemo(() => {
    if (filteredStocks.length === 0) return 0;
    return filteredStocks.reduce((sum, stock) => sum + calculateFinancialHealthScore(stock).score, 0) / filteredStocks.length;
  }, [filteredStocks]);

  const totalMarketCap = useMemo(() => {
    return filteredStocks.reduce((sum, stock) => sum + stock.prices.marketCap, 0);
  }, [filteredStocks]);

  const averageYield = useMemo(() => {
    if (filteredStocks.length === 0) return 0;
    return filteredStocks.reduce((sum, stock) => sum + stock.fundamentals.dividendYield, 0) / filteredStocks.length;
  }, [filteredStocks]);

  const topYield = useMemo(() => {
    return [...leaderStocks]
      .sort((a, b) => b.fundamentals.dividendYield - a.fundamentals.dividendYield)
      .slice(0, 5);
  }, [leaderStocks]);

  // Dynamically group sectors to find the leading sector for the summary memo
  const topSector = useMemo(() => {
    if (filteredStocks.length === 0) return isAr ? "غير متوفر" : "N/A";
    const counts = new Map<string, number>();
    filteredStocks.forEach((s) => counts.set(s.sector, (counts.get(s.sector) ?? 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? (isAr ? "غير متوفر" : "N/A");
  }, [filteredStocks, isAr]);

  // Generate Executive Analysis Commentary Memo
  const executiveMemo = useMemo(() => {
    if (filteredStocks.length === 0) {
      return isAr ? "لا توجد أسهم مطابقة للتصفية المختارة." : "No stocks matching the selected filter criteria.";
    }
    const marketText = selectedMarket === "ALL" ? (isAr ? "سوق دبي وأبوظبي المالي الموحد" : "Combined DFM & ADX Markets") : (selectedMarket === "DFM" ? (isAr ? "سوق دبي المالي" : "Dubai Financial Market") : (isAr ? "سوق أبوظبي للأوراق المالية" : "Abu Dhabi Securities Exchange"));
    
    if (isAr) {
      return `يمثل هذا المستند تحليلاً استثمارياً وتدقيقاً شاملاً لـ ${filteredStocks.length} شركة مدرجة في ${marketText}. ويبلغ متوسط العائد النقدي الإجمالي للمجموعة المحددة ${averageYield.toFixed(2)}%، مدعوماً بقيمة سوقية مجمعة هائلة تصل إلى ${formatCurrency(totalMarketCap)}. وتتميز لوحة المتابعة التشغيلية بوجود قطاع "${topSector}" كأكثر القطاعات تأثيراً ونشاطاً في اللقطة الحالية.`;
    } else {
      return `This document provides a comprehensive investment analysis and financial audit of ${filteredStocks.length} companies listed on the ${marketText}. The average dividend yield of the selected basket stands at ${averageYield.toFixed(2)}%, backed by a substantial combined market capitalization of ${formatCurrency(totalMarketCap)}. Operationally, the "${topSector}" sector emerges as the most active and dominant sector in the current snapshot.`;
    }
  }, [filteredStocks, selectedMarket, averageYield, totalMarketCap, topSector, isAr]);

  const toggleColumn = (key: ColumnKey) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5">
      {/* Stylesheet specifically tailored for vector-grade PDF output */}
      {/* NOTE: <style jsx global> is unsupported in Next.js App Router — using dangerouslySetInnerHTML instead */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            margin: 1.5cm;
            size: A4 portrait;
          }

          body {
            background: #ffffff !important;
            color: #000000 !important;
            font-family: "Tajawal", "Segoe UI", Arial, sans-serif !important;
            font-size: 10pt !important;
          }

          .no-print {
            display: none !important;
          }

          .print-page {
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            color: #000000 !important;
            width: 100% !important;
          }

          .print-page table {
            border-collapse: collapse !important;
            width: 100% !important;
            font-size: 8pt !important;
          }

          .print-page th, 
          .print-page td {
            border: 1px solid #cbd5e1 !important;
            padding: 4px 6px !important;
            color: #000000 !important;
            text-align: inherit !important;
          }

          .print-page th {
            background-color: #f8fafc !important;
            font-weight: 800 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .print-page h2, 
          .print-page h3 {
            color: #0f172a !important;
          }

          /* Force vector colors and background fills in Chrome/Edge/Safari */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      ` }} />

      {/* Configuration & Filter Panel (HIDDEN IN PRINT) */}
      <section className="no-print fusion-panel rounded-2xl p-5 border-l-4 border-sky-500">
        <h2 className="text-lg font-black text-sky-500 flex items-center gap-2">
          <LayoutGrid size={18} />
          {isAr ? "لوحة تخصيص وإعداد التقرير المالي" : "Financial Report Customization Desk"}
        </h2>
        
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {/* Market Toggles */}
          <div>
            <span className="block text-xs font-black text-[color:var(--muted)] mb-2">
              {isAr ? "1. تصفية سوق المال" : "1. Filter by Market"}
            </span>
            <div className="flex gap-2">
              {(["ALL", "DFM", "ADX"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setSelectedMarket(m);
                    setSelectedSector("ALL");
                  }}
                  className={`min-h-9 px-3 rounded-lg text-xs font-black transition ${
                    selectedMarket === m ? "bg-sky-600 text-white" : "market-chip"
                  }`}
                >
                  {m === "ALL" ? (isAr ? "الكل" : "All") : m}
                </button>
              ))}
            </div>
          </div>

          {/* Sector Selector */}
          <div>
            <label className="block text-xs font-black text-[color:var(--muted)] mb-2">
              {isAr ? "2. تصفية القطاع النشط" : "2. Filter by Sector"}
            </label>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="min-h-9 w-full rounded-lg px-2 text-xs font-bold bg-[color:var(--chip)] border border-[color:var(--line)]"
            >
              <option value="ALL">{isAr ? "كل القطاعات" : "All Sectors"}</option>
              {availableSectors.map((sec) => (
                <option key={sec} value={sec}>{sec}</option>
              ))}
            </select>
          </div>

          {/* Column Customizer Checkboxes */}
          <div>
            <span className="block text-xs font-black text-[color:var(--muted)] mb-2">
              {isAr ? "3. تخصيص أعمدة الجدول المطبوع" : "3. Customize Table Columns"}
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              {(Object.keys(visibleColumns) as ColumnKey[]).map((colKey) => (
                <button
                  key={colKey}
                  onClick={() => toggleColumn(colKey)}
                  className="flex items-center gap-2 text-start p-1.5 rounded hover:bg-sky-500/10"
                >
                  {visibleColumns[colKey] ? (
                    <CheckSquare size={14} className="text-sky-500" />
                  ) : (
                    <Square size={14} className="text-[color:var(--muted)]" />
                  )}
                  <span>
                    {colKey === "pe" ? "P/E" : 
                     colKey === "roe" ? "ROE" : 
                     colKey === "divRating" ? (isAr ? "استدامة التوزيع" : "Div Rating") :
                     colKey === "health" ? t("thHealth") :
                     colKey === "trend" ? t("thTrend") : (isAr ? "الهدف السعري" : "Target Price")}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Header Buttons */}
      <div className="no-print flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-950">{t("reportTitle")}</h1>
          <p className="mt-1 text-sm text-slate-500">{t("reportSubtitle")}</p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-sky-700 px-4 font-black text-white hover:bg-sky-800"
        >
          <Printer size={18} aria-hidden />
          {t("printBtn")}
        </button>
      </div>

      {/* THE printable audit page */}
      <article className="print-page glass-panel rounded-lg bg-white p-6 shadow-sm border border-slate-200">
        <header className="border-b border-slate-200 pb-5">
          <p className="text-sm font-black text-sky-700">{DATASET_INFO.brandEn}</p>
          <h2 className="mt-2 text-4xl font-black text-slate-950">{DATASET_INFO.brandAr}</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            {isAr 
              ? `تقرير استثماري معتمد بتاريخ ${formatDate(DATASET_INFO.snapshotDate)}. تم تصديره وتخصيصه بناءً على اختيارات التصفية النشطة.`
              : `Certified financial report snapshot as of ${formatDate(DATASET_INFO.snapshotDate)}, customized dynamically per active selection.`}
          </p>
        </header>

        {/* Executive Memo Document Box */}
        <section className="mt-5 p-4 rounded-xl border border-sky-100 bg-sky-50/50 leading-8 text-sm text-slate-800 font-bold">
          <h3 className="text-sky-800 font-black mb-2 border-b border-sky-100 pb-1 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-sky-600 inline-block" />
            {isAr ? "مذكرة التحليل والملخص التنفيذي" : "Executive Analysis Commentary Memo"}
          </h3>
          <p className="text-justify font-semibold">{executiveMemo}</p>
        </section>

        {/* Top summary metrics */}
        <section className="mt-6 grid gap-3 grid-cols-2 md:grid-cols-4">
          <Metric label={t("repStockCount")} value={formatNumber(filteredStocks.length)} />
          <Metric label={t("repMarketCap")} value={formatCurrency(totalMarketCap)} />
          <Metric label={t("repAvgHealth")} value={`${averageHealth.toFixed(0)}/100`} />
          <Metric 
            label={t("repTopYield")} 
            value={topYield[0] ? formatPlainPercent(topYield[0].fundamentals.dividendYield) : "0.00%"} 
            subtext={topYield[0] ? `${topYield[0].symbol} · ${isAr ? topYield[0].nameAr : topYield[0].nameEn}` : ""}
          />
        </section>

        {/* Top Yield Leaders (if available in filtered selection) */}
        {topYield.length > 0 && (
          <section className="mt-6">
            <h3 className="mb-3 text-xl font-black text-slate-950">{t("repTopYieldTitle")}</h3>
            <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
              {topYield.map((stock) => (
                <div key={stock.symbol} className="rounded-lg border border-slate-200 p-3 bg-white">
                  <p className="font-black text-slate-950">{stock.symbol}</p>
                  <p className="mt-1 text-xs text-slate-500">{isAr ? stock.nameAr : stock.nameEn}</p>
                  <p className="number mt-2 text-lg font-black text-emerald-700">{formatPlainPercent(stock.fundamentals.dividendYield)}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Comprehensive Table */}
        <section className="mt-6">
          <h3 className="mb-3 text-xl font-black text-slate-950">{t("repTableTitle")}</h3>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[960px] border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="border border-slate-200 px-2 py-2 text-start font-black">{t("thStock")}</th>
                  <th className="border border-slate-200 px-2 py-2 text-start font-black">{t("thMarket")}</th>
                  <th className="border border-slate-200 px-2 py-2 text-start font-black">{t("thPrice")}</th>
                  <th className="border border-slate-200 px-2 py-2 text-start font-black">{t("thChange")}</th>
                  <th className="border border-slate-200 px-2 py-2 text-start font-black">{t("thYield")}</th>
                  {visibleColumns.pe && <th className="border border-slate-200 px-2 py-2 text-start font-black">P/E</th>}
                  {visibleColumns.roe && <th className="border border-slate-200 px-2 py-2 text-start font-black">ROE</th>}
                  {visibleColumns.divRating && <th className="border border-slate-200 px-2 py-2 text-start font-black">{t("thDivRating")}</th>}
                  {visibleColumns.health && <th className="border border-slate-200 px-2 py-2 text-start font-black">{t("thHealth")}</th>}
                  {visibleColumns.trend && <th className="border border-slate-200 px-2 py-2 text-start font-black">{t("thTrend")}</th>}
                  {visibleColumns.target && <th className="border border-slate-200 px-2 py-2 text-start font-black">{t("thIntTarget")}</th>}
                </tr>
              </thead>
              <tbody>
                {filteredStocks.map((stock) => {
                  const health = calculateFinancialHealthScore(stock);
                  const dividend = calculateDividendSustainability(stock);
                  const trend = getExpectedTrend(stock);
                  return (
                    <tr key={stock.symbol} className="hover:bg-slate-50">
                      <td className="border border-slate-200 px-2 py-2 font-black">
                        {stock.symbol}
                        <div className="font-normal text-slate-500">{isAr ? stock.nameAr : stock.nameEn}</div>
                      </td>
                      <td className="border border-slate-200 px-2 py-2">{stock.market}</td>
                      <td className="number border border-slate-200 px-2 py-2">{formatCurrency(stock.prices.last)}</td>
                      <td className="number border border-slate-200 px-2 py-2">{formatPercent(stock.prices.changePercent)}</td>
                      <td className="number border border-slate-200 px-2 py-2">{formatPlainPercent(stock.fundamentals.dividendYield)}</td>
                      {visibleColumns.pe && <td className="number border border-slate-200 px-2 py-2">{formatNumber(stock.fundamentals.pe)}</td>}
                      {visibleColumns.roe && <td className="number border border-slate-200 px-2 py-2">{formatPlainPercent(stock.fundamentals.roe)}</td>}
                      {visibleColumns.divRating && <td className="border border-slate-200 px-2 py-2">{t(dividend.rating)}</td>}
                      {visibleColumns.health && <td className="border border-slate-200 px-2 py-2">{t(health.band)} · {health.score}</td>}
                      {visibleColumns.trend && <td className="border border-slate-200 px-2 py-2">{t(trend.direction)}</td>}
                      {visibleColumns.target && <td className="number border border-slate-200 px-2 py-2">{formatCurrency(stock.modelTarget.base)}</td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Corporate certified audit stamp and signature block */}
        <section className="mt-8 pt-6 border-t border-slate-200 grid gap-6 md:grid-cols-2 items-center">
          {/* Signature Field */}
          <div className="flex flex-col justify-end min-h-[90px] border border-dashed border-slate-200 rounded-lg p-4 bg-slate-50/50">
            <span className="text-[10px] font-black text-slate-400 mb-10 block uppercase tracking-wider">
              {isAr ? "توقيع المحلل المالي المعتمد" : "Certified Investment Analyst Signature"}
            </span>
            <div className="h-px bg-slate-400 w-48" />
            <span className="text-[10px] font-bold text-slate-500 mt-2">
              {isAr ? "منصة الأسهم الإماراتية - قسم التدقيق" : "UAE Stocks Platform - Audit Department"}
            </span>
          </div>

          {/* certified audit seal */}
          <div className="flex items-center gap-3 justify-start md:justify-end">
            <div className="h-16 w-16 rounded-full border-4 border-sky-600/35 flex items-center justify-center flex-shrink-0 bg-sky-50 relative overflow-hidden">
              <span className="text-[7px] font-black text-sky-800 text-center uppercase tracking-tighter leading-none px-1 block">
                {isAr ? "تدقيق\nرسمي" : "Verified\nAudit"}
              </span>
            </div>
            <div>
              <p className="text-xs font-black text-slate-800">{isAr ? "تقرير استثماري معتمد وموثق" : "Verified Corporate Audit Sheet"}</p>
              <p className="text-[10px] font-bold text-slate-500 mt-1">
                {isAr ? "معرف الوثيقة: US-AUD-2026" : "Doc ID: US-AUD-2026-F5"}
              </p>
              <p className="text-[9px] font-semibold text-slate-400">
                {isAr ? "محدث تلقائياً بالتزامن مع البث المالي" : "Auto-synced with live market stream feed"}
              </p>
            </div>
          </div>
        </section>

        {/* Disclaimer section */}
        <section className="mt-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-xs font-bold leading-6 text-rose-900">
          <span className="font-black">{isAr ? DATASET_INFO.disclaimer : "Disclaimer:"}</span> {t("repDisclaimer")}
        </section>
      </article>
    </div>
  );
}

function Metric({ label, value, subtext }: { label: string; value: string; subtext?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 flex flex-col justify-between min-h-[96px]">
      <div>
        <p className="text-xs font-black text-slate-500">{label}</p>
        <p className="number mt-2 text-xl font-black text-slate-950">{value}</p>
      </div>
      {subtext && <p className="mt-2 text-[10px] font-bold text-slate-400 truncate">{subtext}</p>}
    </div>
  );
}
