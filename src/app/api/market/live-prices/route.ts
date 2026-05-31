import { NextResponse } from "next/server";
import { stocksData } from "@/data/stocksData";

// Twelve Data API accepts comma-separated symbols
// UAE DFM & ADX symbols are queried directly
const SYMBOLS = stocksData.map((s) => s.symbol).join(",");

export async function GET() {
  const apiKey = process.env.TWELVE_DATA_API_KEY;

  // Fallback if no API Key is provided in environment variables
  if (!apiKey) {
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
      } else {
        // Fallback for individual symbols if not found in API response
        prices[symbol] = generateSingleSimulatedPrice(stock);
      }
    });

    return NextResponse.json({
      success: true,
      source: "twelvedata",
      timestamp: new Date().toISOString(),
      prices,
    });
  } catch (error: any) {
    console.error("Live Market API Error, falling back to simulation:", error.message);
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

function generateSingleSimulatedPrice(stock: any): number {
  const current = stock.prices.last;
  // Subtle fluctuation between -0.2% and +0.25%
  const percentChange = (Math.random() * 0.45 - 0.2) / 100;
  return Number(Math.max(current + current * percentChange, 0.05).toFixed(4));
}
