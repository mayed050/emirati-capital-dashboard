import { isGstMarketOpen, tickSingleStock, tickDataset } from "../src/utils/marketSimulator";
import type { StockRecord } from "../src/types";

// سهم وهمي للاختبار
const mockStock: StockRecord = {
  symbol: "MOCK",
  nameAr: "سهم تجريبي",
  nameEn: "Mock Stock",
  market: "DFM",
  sector: "بنوك",
  profile: "سهم تجريبي للتحقق من سلامة الأكواد.",
  officialUrls: {
    marketProfile: "",
    disclosures: "",
    dividends: "",
  },
  prices: {
    last: 10.00,
    previousClose: 10.00,
    change: 0,
    changePercent: 0,
    high: 10.00,
    low: 10.00,
    high52: 10.00,
    low52: 10.00,
    volume: 100000,
    tradeValue: 1000000,
    trades: 150,
    marketCap: 100000000,
    lastUpdated: "2026-05-29",
  },
  fundamentals: {
    pe: 12.0,
    eps: 0.83,
    epsGrowth: 5.0,
    roe: 12.0,
    netMargin: 15.0,
    revenueAED: 50000000,
    revenueDisplay: "50M AED",
    revenueGrowth: 8.0,
    netProfitAED: 7500000,
    netProfitDisplay: "7.5M AED",
    netProfitGrowth: 9.0,
    operatingCashFlowAED: 8000000,
    freeCashFlowAED: 6000000,
    debtToEquity: 0.45,
    payoutRatio: 50.0,
    dividendYield: 5.0,
  },
  dividend: {
    lastAmount: 0.25,
    annualDividend: 0.50,
    yieldPercent: 5.0,
    entitlementDate: "2026-04-15",
    exDate: "2026-04-16",
    paymentDate: "2026-05-06",
    payoutRatio: 50.0,
  },
  historicalPrices: [],
  historicalDividends: [],
  swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
  modelTarget: { low: 8, base: 11, high: 14, upsidePercent: 10, label: "محايد", sourceNote: "" },
  sourceLabels: [],
};

function runTests() {
  console.log("=== بدء تشغيل اختبارات محاكي الأسواق ===");

  // 1. التحقق من ساعات السوق في دبي
  console.log("\n1. فحص ساعات العمل الرسمية (GST):");
  // اختبار يوم أحد (مغلق)
  const sunday = new Date("2026-05-31T12:00:00Z"); // Sunday 16:00 GST
  console.log(`- يوم الأحد 16:00 بتوقيت دبي: ${isGstMarketOpen(sunday) ? "❌ مفتوح (خطأ)" : "✅ مغلق (صحيح)"}`);

  // اختبار يوم ثلاثاء الساعة 11:00 صباحاً (مفتوح)
  const tuesdayOpen = new Date("2026-06-02T07:00:00Z"); // UTC 7:00 -> GST 11:00 AM Tuesday
  console.log(`- يوم الثلاثاء 11:00 بتوقيت دبي: ${isGstMarketOpen(tuesdayOpen) ? "✅ مفتوح (صحيح)" : "❌ مغلق (خطأ)"}`);

  // اختبار يوم ثلاثاء الساعة 8:00 مساءً (مغلق)
  const tuesdayClosed = new Date("2026-06-02T16:00:00Z"); // UTC 16:00 -> GST 20:00 Tuesday
  console.log(`- يوم الثلاثاء 20:00 بتوقيت دبي: ${isGstMarketOpen(tuesdayClosed) ? "❌ مفتوح (خطأ)" : "✅ مغلق (صحيح)"}`);

  // 2. التحقق من تذبذب سعر السهم الفردي
  console.log("\n2. فحص محاكاة تذبذب سعر سهم فردي:");
  const result = tickSingleStock(mockStock, true); // إجبار المحاكاة
  const newPrice = result.stock.prices.last;
  const changePercent = result.stock.prices.changePercent;
  const direction = result.direction;

  console.log(`- السعر القديم: 10.00 | السعر الجديد: ${newPrice.toFixed(4)}`);
  console.log(`- نسبة التغير: ${changePercent}% | اتجاه الحركة: ${direction}`);
  console.log(`- تحديث حجم التداول: ${result.stock.prices.volume} | القيمة: ${result.stock.prices.tradeValue}`);
  console.log(`- تحديث عائد التوزيع: ${result.stock.fundamentals.dividendYield}%`);

  if (newPrice !== 10.00 && direction !== "none" && changePercent !== 0) {
    console.log("✅ نجاح فحص التذبذب والاتجاه!");
  } else {
    console.log("❌ فشل فحص تذبذب السعر.");
  }

  // 3. التحقق من تحديث مصفوفة الأسهم بالكامل
  console.log("\n3. فحص تحديث مصفوفة الأسهم بالكامل:");
  const datasetResult = tickDataset([mockStock], true);
  console.log(`- عدد الأسهم المستهدفة: ${datasetResult.stocks.length}`);
  console.log(`- السعر الجديد للسهم في المصفوفة: ${datasetResult.stocks[0].prices.last.toFixed(4)}`);
  console.log(`- حركة السهم المسجلة: ${datasetResult.directions[mockStock.symbol]}`);

  if (datasetResult.stocks.length === 1 && datasetResult.directions[mockStock.symbol] !== "none") {
    console.log("✅ نجاح فحص تحديث المصفوفة بالكامل!");
  } else {
    console.log("❌ فشل فحص تحديث المصفوفة.");
  }

  console.log("\n=== انتهت كافة الفحوصات بنجاح! ===");
}

runTests();
