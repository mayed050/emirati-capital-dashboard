import { NextResponse } from "next/server";
import { getUnifiedMarketDataset } from "@/lib/data/unified-market-data";
import { isGstMarketOpen } from "@/utils/marketSimulator";

export function GET() {
  try {
    const market = getUnifiedMarketDataset();

    // دمج تذبذب سعري عديم الحالة (Stateless Ticking) معتمد على الدقيقة الحالية
    // لخدمة أي أطراف خارجية تستعلم من الواجهة بأسعار حية
    const now = new Date();
    const minute = now.getMinutes();
    const hour = now.getHours();
    const isMarketOpen = isGstMarketOpen(now);

    const tickedStocks = market.stocks.map((stock) => {
      // نقوم بتذبذب السعر فقط إذا كان السوق مفتوحاً رسمياً
      if (!isMarketOpen) return stock;

      // استخدام كامل الرمز (كل الحروف) والدقيقة الحالية لإنشاء معامل تذبذب متسق وغير متوقع
      // FIX: Previously used only first 2 chars, causing identical seeds for ADNOC stocks
      const symbolSeed = stock.symbol.split("").reduce((acc, ch, idx) => acc + ch.charCodeAt(0) * (idx + 1), 0);
      const seed = symbolSeed + minute * 7 + hour * 31;
      const shiftPercent = ((seed % 11) - 5) * 0.15; // تذبذب بين -0.75% إلى +0.75%
      const currentPrice = stock.prices.last;

      const newPrice = Math.max(Number((currentPrice * (1 + shiftPercent / 100)).toFixed(4)), 0.05);
      const change = Number((newPrice - stock.prices.previousClose).toFixed(4));
      const changePercent = Number(((change / stock.prices.previousClose) * 100).toFixed(4));

      return {
        ...stock,
        prices: {
          ...stock.prices,
          last: newPrice,
          change,
          changePercent,
          high: Math.max(stock.prices.high, newPrice),
          low: Math.min(stock.prices.low, newPrice),
          // Keep lastUpdated as ISO date format for consistency — use separate timeUpdated for time-only
          lastUpdated: now.toISOString().slice(0, 10),
          timeUpdated: now.toLocaleTimeString("ar-AE", { hour12: false }),
        },
        fundamentals: {
          ...stock.fundamentals,
          dividendYield: stock.dividend.annualDividend > 0
            ? Number(((stock.dividend.annualDividend / newPrice) * 100).toFixed(2))
            : 0,
        }
      };
    });

    return NextResponse.json({
      dataset: {
        ...market.dataset,
        mode: isMarketOpen ? "بث مباشر لحظي نشط" : market.dataset.mode,
        snapshotDate: now.toISOString().slice(0, 10),
      },
      count: market.counts.total,
      counts: market.counts,
      stocks: tickedStocks,
      isMarketOpen,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[/api/stocks] Failed to build market dataset:", message);
    return NextResponse.json(
      { success: false, error: "Failed to load market data", details: message },
      { status: 500 }
    );
  }
}
