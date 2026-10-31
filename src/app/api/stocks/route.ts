import { NextResponse } from "next/server";
import { getUnifiedMarketDataset } from "@/lib/data/unified-market-data";
import { isGstMarketOpen } from "@/utils/marketSimulator";

export const dynamic = "force-dynamic";

export function GET() {
  try {
    const market = getUnifiedMarketDataset();

    return NextResponse.json({
      dataset: market.dataset,
      count: market.counts.total,
      counts: market.counts,
      stocks: market.stocks,
      isMarketOpen: isGstMarketOpen(),
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
