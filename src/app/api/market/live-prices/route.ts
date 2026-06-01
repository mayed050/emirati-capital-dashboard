import { NextResponse } from "next/server";
import { stocksData } from "@/data/stocksData";
import type { StockRecord } from "@/types";
import fs from "node:fs";
import path from "node:path";

export const dynamic = "force-dynamic";

// Twelve Data API accepts comma-separated symbols
const SYMBOLS = stocksData.map((s) => s.symbol).join(",");

export async function GET() {
  const apiKey = process.env.TWELVE_DATA_API_KEY;

  // 1. Read overrides from disk dynamically to bypass Node module cache
  let overrides: Record<string, any> = {};
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
    // If local daemon overrides are available, serve them directly!
    if (Object.keys(overrides).length > 0) {
      const prices: Record<string, number> = {};
      stocksData.forEach((stock) => {
        const symbol = stock.symbol;
        prices[symbol] = overrides[symbol]?.last ?? stock.prices.last;
      });

      return NextResponse.json({
        success: true,
        source: "local_daemon_overrides",
        timestamp: new Date().toISOString(),
        prices,
      });
    }

    // Default simulation fallback
    return NextResponse.json({
      success: true,
      source: "simulation",
      timestamp: new Date().toISOString(),
      prices: generateSimulatedPrices(),
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
    const prices: Record<string, number> = {};
    
    stocksData.forEach((stock) => {
      const symbol = stock.symbol;
      const result = data[symbol];
      if (result && result.price) {
        prices[symbol] = Number(Number(result.price).toFixed(4));
      } else if (overrides[symbol]?.last !== undefined) {
        prices[symbol] = overrides[symbol].last;
      } else {
        prices[symbol] = generateSingleSimulatedPrice(stock);
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
    console.error("Live Market API Error, falling back to disk overrides or simulation:", message);
    
    // Fallback to disk overrides on API fetch error
    if (Object.keys(overrides).length > 0) {
      const prices: Record<string, number> = {};
      stocksData.forEach((stock) => {
        const symbol = stock.symbol;
        prices[symbol] = overrides[symbol]?.last ?? stock.prices.last;
      });

      return NextResponse.json({
        success: true,
        source: "local_daemon_overrides_fallback",
        timestamp: new Date().toISOString(),
        prices,
      });
    }

    return NextResponse.json({
      success: true,
      source: "simulation_fallback",
      timestamp: new Date().toISOString(),
      prices: generateSimulatedPrices(),
    });
  }
}

function generateSimulatedPrices(): Record<string, number> {
  const prices: Record<string, number> = {};
  stocksData.forEach((stock) => {
    prices[stock.symbol] = generateSingleSimulatedPrice(stock);
  });
  return prices;
}

function generateSingleSimulatedPrice(stock: StockRecord): number {
  const current = stock.prices.last;
  // Subtle fluctuation between -0.2% and +0.25%
  const percentChange = (Math.random() * 0.45 - 0.2) / 100;
  return Number(Math.max(current + current * percentChange, 0.05).toFixed(4));
}
