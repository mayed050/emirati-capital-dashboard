"use client";

import { useMemo } from "react";
import { Printer } from "lucide-react";
import { DATASET_INFO, stocksData } from "@/data/stocksData";
import { formatCurrency, formatDate, formatNumber, formatPercent, formatPlainPercent } from "@/lib/format";
import { calculateDividendSustainability, calculateFinancialHealthScore, getExpectedTrend } from "@/utils/analyticsEngine";
import { useLanguage } from "@/context/languageContext";
import { useLiveMarket } from "@/hooks/useLiveMarket";

export function FinancialReport() {
  const { language, t } = useLanguage();
  const { stocks: liveStocks } = useLiveMarket();

  // Fallback to static seed data during server-side rendering (SSR) or initial hydration
  const stocks = useMemo(() => {
    return liveStocks.length > 0 ? liveStocks : stocksData;
  }, [liveStocks]);

  const leaderStocks = useMemo(() => stocks.filter((s) => s.marketLeader), [stocks]);

  const averageHealth = useMemo(() => {
    if (stocks.length === 0) return 0;
    return stocks.reduce((sum, stock) => sum + calculateFinancialHealthScore(stock).score, 0) / stocks.length;
  }, [stocks]);

  const totalMarketCap = useMemo(() => {
    return stocks.reduce((sum, stock) => sum + stock.prices.marketCap, 0);
  }, [stocks]);

  const topYield = useMemo(() => {
    return [...leaderStocks]
      .sort((a, b) => b.fundamentals.dividendYield - a.fundamentals.dividendYield)
      .slice(0, 5);
  }, [leaderStocks]);

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5">
      {/* Stylesheet specifically tailored for vector-grade PDF output */}
      <style jsx global>{`
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
      `}</style>

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

      <article className="print-page glass-panel rounded-lg bg-white p-6">
        <header className="border-b border-slate-200 pb-5">
          <p className="text-sm font-black text-sky-700">{DATASET_INFO.brandEn}</p>
          <h2 className="mt-2 text-4xl font-black text-slate-950">{DATASET_INFO.brandAr}</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            {language === "ar" 
              ? `تقرير لقطة ثابتة بتاريخ ${formatDate(DATASET_INFO.snapshotDate)}. الأسعار ليست حية، ونطاقات القيمة الداخلية ليست توصيات أو تغطية محللين.`
              : `Static market report snapshotted on ${formatDate(DATASET_INFO.snapshotDate)}. Prices are static and models do not constitute investment advice.`}
          </p>
        </header>

        <section className="mt-5 grid gap-3 grid-cols-2 md:grid-cols-4">
          <Metric label={t("repStockCount")} value={formatNumber(stocks.length)} />
          <Metric label={t("repMarketCap")} value={formatCurrency(totalMarketCap)} />
          <Metric label={t("repAvgHealth")} value={`${averageHealth.toFixed(0)}/100`} />
          <Metric 
            label={t("repTopYield")} 
            value={topYield[0] ? formatPlainPercent(topYield[0].fundamentals.dividendYield) : "0.00%"} 
            subtext={topYield[0] ? `${topYield[0].symbol} · ${language === "ar" ? topYield[0].nameAr : topYield[0].nameEn}` : ""}
          />
        </section>

        <section className="mt-6">
          <h3 className="mb-3 text-xl font-black text-slate-950">{t("repTopYieldTitle")}</h3>
          <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
            {topYield.map((stock) => (
              <div key={stock.symbol} className="rounded-lg border border-slate-200 p-3 bg-white">
                <p className="font-black text-slate-950">{stock.symbol}</p>
                <p className="mt-1 text-xs text-slate-500">{language === "ar" ? stock.nameAr : stock.nameEn}</p>
                <p className="number mt-2 text-lg font-black text-emerald-700">{formatPlainPercent(stock.fundamentals.dividendYield)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6">
          <h3 className="mb-3 text-xl font-black text-slate-950">{t("repTableTitle")}</h3>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[1060px] border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  {[
                    t("thStock"),
                    t("thMarket"),
                    t("thPrice"),
                    t("thChange"),
                    "P/E",
                    "ROE",
                    t("thYield"),
                    t("thDivRating"),
                    t("thHealth"),
                    t("th3MTrend"),
                    t("thIntTarget")
                  ].map((heading) => (
                    <th key={heading} className="border border-slate-200 px-2 py-2 text-start font-black">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stocks.map((stock) => {
                  const health = calculateFinancialHealthScore(stock);
                  const dividend = calculateDividendSustainability(stock);
                  const trend = getExpectedTrend(stock);
                  return (
                    <tr key={stock.symbol} className="hover:bg-slate-50">
                      <td className="border border-slate-200 px-2 py-2 font-black">
                        {stock.symbol}
                        <div className="font-normal text-slate-500">{language === "ar" ? stock.nameAr : stock.nameEn}</div>
                      </td>
                      <td className="border border-slate-200 px-2 py-2">{stock.market}</td>
                      <td className="number border border-slate-200 px-2 py-2">{formatCurrency(stock.prices.last)}</td>
                      <td className="number border border-slate-200 px-2 py-2">{formatPercent(stock.prices.changePercent)}</td>
                      <td className="number border border-slate-200 px-2 py-2">{formatNumber(stock.fundamentals.pe)}</td>
                      <td className="number border border-slate-200 px-2 py-2">{formatPlainPercent(stock.fundamentals.roe)}</td>
                      <td className="number border border-slate-200 px-2 py-2">{formatPlainPercent(stock.fundamentals.dividendYield)}</td>
                      <td className="border border-slate-200 px-2 py-2">{t(dividend.rating)}</td>
                      <td className="border border-slate-200 px-2 py-2">{t(health.band)} · {health.score}</td>
                      <td className="border border-slate-200 px-2 py-2">{t(trend.direction)}</td>
                      <td className="number border border-slate-200 px-2 py-2">{formatCurrency(stock.modelTarget.base)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-bold leading-7 text-rose-900">
          <span className="font-black">{language === "ar" ? DATASET_INFO.disclaimer : "Disclaimer:"}</span> {t("repDisclaimer")}
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
