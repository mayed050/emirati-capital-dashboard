import { NextResponse } from "next/server";
import { stocksData } from "@/data/stocksData";
import fs from "node:fs";
import path from "node:path";

export const dynamic = "force-dynamic";

// Twelve Data API accepts comma-separated symbols
const SYMBOLS = stocksData.map((s) => s.symbol).join(",");

type PriceOverrides = Record<string, { last?: number }>;

export async function GET() {
  const apiKey = process.env.TWELVE_DATA_API_KEY;

  // 1. Read overrides from disk dynamically to bypass Node module cache
  let overrides: PriceOverrides = {};
  try {
    const filePath = path.resolve(process.cwd(), "src", "data", "generated", "market-overrides.json");
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf8");
      overrides = JSON.parse(raw).quotes || {};
    }
  } catch (e) {
    console.warn("[live-prices] Failed to read overrides dynamically:", e);
  }

  // Fallback if no API Key is provided in environment variables
  if (!apiKey) {
    return NextResponse.json({
      success: true,
      source: "local_daemon_overrides",
      timestamp: new Date().toISOString(),
      prices: lastKnownPrices(overrides),
    });
  }

  try {
    const url = `https://api.twelvedata.com/price?symbol=${SYMBOLS}&apikey=${apiKey}`;
    const response = await fetch(url, {
      next: { revalidate: 10 }, // Cache prices for 10 seconds to stay within API rate limits
    });

    if (!response.ok) {
      throw new Error(`Twelve Data API returned status ${response.status}`);
    }

    const data = await response.json();

    // Map response back to a clean dictionary of { SYMBOL: price }
    const prices = lastKnownPrices(overrides);

    stocksData.forEach((stock) => {
      const result = data[stock.symbol];
      if (result && result.price) {
        prices[stock.symbol] = Number(Number(result.price).toFixed(4));
      }
    });

    return NextResponse.json({
      success: true,
      source: "twelvedata",
      timestamp: new Date().toISOString(),
      prices,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Live Market API Error, falling back to last known prices:", message);

    return NextResponse.json({
      success: true,
      source: "local_daemon_overrides_fallback",
      timestamp: new Date().toISOString(),
      prices: lastKnownPrices(overrides),
    });
  }
}

function lastKnownPrices(overrides: PriceOverrides): Record<string, number> {
  const prices: Record<string, number> = {};
  stocksData.forEach((stock) => {
    prices[stock.symbol] = overrides[stock.symbol]?.last ?? stock.prices.last;
  });
  return prices;
}
