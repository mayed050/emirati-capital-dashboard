import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { DataBanner } from "@/components/ui/DataBanner";
import { Panel, Section } from "@/components/ui/Section";
import { getUnifiedMarketDataset } from "@/lib/data/unified-market-data";
import { formatCurrency, formatPercent } from "@/lib/format";

export default function AnalystsPage() {
  const market = getUnifiedMarketDataset();
  const lastOfficialSession = `DFM ${market.dataset.dfmSessionDate} / ADX ${market.dataset.adxSessionDate}`;

  return (
    <div>
      <header className="fusion-panel mb-5 rounded-2xl p-5">
        <p className="text-sm font-black text-sky-500">نطاقات نموذجية موحدة</p>
        <h1 className="mt-2 text-3xl font-black text-[color:var(--foreground)]">آراء المحللين والأسعار المستهدفة</h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-[color:var(--muted)]">
          هذه الصفحة أصبحت تقرأ من طبقة البيانات الموحدة نفسها المستخدمة في النظرة العامة والتقرير وواجهة API. الحقول المعروضة هنا نطاقات
          داخلية مشتقة من نموذج المنصة وليست تغطية محللين خارجية أو توصية شراء وبيع.
        </p>
      </header>

      <DataBanner
        generatedAt={market.dataset.snapshotDate}
        lastOfficialSession={lastOfficialSession}
        warning={`${market.dataset.mode}. ${market.dataset.coverageNote}`}
      />

      <Panel className="mb-5 border-blue-200 bg-blue-50">
        <p className="text-sm leading-7 text-blue-950">
          تم توحيد مصدر هذه الصفحة مع <strong>/api/stocks</strong> وباقي صفحات المشروع. أي تحديث يومي في ملف الأسعار الموحد سينعكس هنا
          تلقائيا بعد نجاح فحص البيانات.
        </p>
      </Panel>

      <Section
        title="جدول النطاقات المستهدفة"
        subtitle="السعر الأساسي، النطاق الأدنى والأعلى، العائد المتوقع، درجة الصحة، ومصدر النطاق الداخلي."
      >
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm scrollbar-thin">
          <table className="w-full min-w-[1060px] border-collapse text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                {[
                  "السهم",
                  "السوق",
                  "السعر الحالي",
                  "الهدف الأساسي",
                  "النطاق الأدنى",
                  "النطاق الأعلى",
                  "العائد المتوقع",
                  "درجة الصحة",
                  "الاتجاه",
                  "الموثوقية",
                ].map((heading) => (
                  <th key={heading} className="border-b border-slate-200 px-3 py-3 text-right font-bold">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {market.stocks.map((stock) => (
                <tr key={stock.symbol} className="border-b border-slate-100 hover:bg-blue-50/50">
                  <td className="px-3 py-3">
                    <Link href={`/stocks/${stock.symbol}`} className="font-bold text-blue-800 hover:underline">
                      {stock.symbol}
                    </Link>
                    <div className="mt-1 text-xs text-slate-500">{stock.nameAr}</div>
                  </td>
                  <td className="px-3 py-3">{stock.market}</td>
                  <td className="number px-3 py-3">{formatCurrency(stock.prices.last)}</td>
                  <td className="number px-3 py-3 font-black">{formatCurrency(stock.modelTarget.base)}</td>
                  <td className="number px-3 py-3">{formatCurrency(stock.modelTarget.low)}</td>
                  <td className="number px-3 py-3">{formatCurrency(stock.modelTarget.high)}</td>
                  <td className="number px-3 py-3">{formatPercent(stock.modelTarget.upsidePercent)}</td>
                  <td className="px-3 py-3">
                    {stock.analytics.health.band} · {stock.analytics.health.score}/100
                  </td>
                  <td className="px-3 py-3">{stock.analytics.trend.direction}</td>
                  <td className="px-3 py-3">
                    <Badge tone="orange">{stock.modelTarget.label}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}
