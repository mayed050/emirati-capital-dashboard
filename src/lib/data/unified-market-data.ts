import { DATASET_INFO, getStockBySymbol, marketLeaderStocks, stocksData } from "@/data/stocksData";
import {
  calculateDividendSustainability,
  calculateFinancialHealthScore,
  getExpectedTrend,
} from "@/utils/analyticsEngine";
import type { MarketCode, StockRecord, StockSymbol } from "@/types";
import fs from "node:fs";
import path from "node:path";

export type UnifiedStockAnalytics = {
  health: ReturnType<typeof calculateFinancialHealthScore>;
  trend: ReturnType<typeof getExpectedTrend>;
  dividendSustainability: ReturnType<typeof calculateDividendSustainability>;
};

export type StockWithAnalytics = StockRecord & {
  analytics: UnifiedStockAnalytics;
};

export type UnifiedMarketDataset = {
  dataset: typeof DATASET_INFO;
  stocks: StockWithAnalytics[];
  marketLeaders: StockWithAnalytics[];
  counts: {
    total: number;
    leaders: number;
    dfmLeaders: number;
    adxLeaders: number;
    extraWatchlist: number;
  };
};

export function getUnifiedMarketDataset(): UnifiedMarketDataset {
  // 1. Read overrides from disk dynamically to bypass Node module cache
  let overrides: Record<string, any> = {};
  try {
    const filePath = path.resolve(process.cwd(), "src", "data", "generated", "market-overrides.json");
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf8");
      overrides = JSON.parse(raw).quotes || {};
    }
  } catch (e) {
    console.warn("[unified-market-data] Failed to read overrides dynamically:", e);
  }

  // 2. Merge overrides with static stocksData
  const mergedStocks: StockRecord[] = stocksData.map((stock) => {
    const override = overrides[stock.symbol];
    if (!override) return stock;

    const previousClose = override.previousClose ?? stock.prices.previousClose;
    const last = override.last ?? stock.prices.last;
    const change = override.change ?? (last - previousClose);
    const changePercent = override.changePercent ?? (previousClose > 0 ? ((last - previousClose) / previousClose) * 100 : stock.prices.changePercent);

    return {
      ...stock,
      prices: {
        ...stock.prices,
        ...override,
        last,
        previousClose,
        change: Number(change.toFixed(4)),
        changePercent: Number(changePercent.toFixed(4)),
        high: override.high ?? Math.max(stock.prices.high, last),
        low: override.low ?? Math.min(stock.prices.low, last),
        high52: override.high52 ?? Math.max(stock.prices.high52, last),
        low52: override.low52 ?? Math.min(stock.prices.low52, last),
        volume: override.volume ?? stock.prices.volume,
        tradeValue: override.tradeValue ?? stock.prices.tradeValue,
        trades: override.trades ?? stock.prices.trades,
        marketCap: override.marketCap ?? stock.prices.marketCap,
        lastUpdated: override.lastUpdated ?? stock.prices.lastUpdated,
      },
      fundamentals: {
        ...stock.fundamentals,
        dividendYield: stock.dividend.annualDividend > 0
          ? Number(((stock.dividend.annualDividend / last) * 100).toFixed(2))
          : 0,
      }
    };
  });

  // 3. Compute dynamic analytics
  const stocksWithAnalytics: StockWithAnalytics[] = mergedStocks.map((stock) => ({
    ...stock,
    analytics: {
      health: calculateFinancialHealthScore(stock),
      trend: getExpectedTrend(stock),
      dividendSustainability: calculateDividendSustainability(stock),
    },
  }));

  // 4. Derive leaders list dynamically from the merged dataset
  const leaderSymbols = new Set(marketLeaderStocks.map((s) => s.symbol));
  const leadersWithAnalytics = stocksWithAnalytics.filter((stock) => leaderSymbols.has(stock.symbol));

  const dfmLeaders = leadersWithAnalytics.filter((stock) => stock.market === "DFM").length;
  const adxLeaders = leadersWithAnalytics.filter((stock) => stock.market === "ADX").length;

  return {
    dataset: DATASET_INFO,
    stocks: stocksWithAnalytics,
    marketLeaders: leadersWithAnalytics,
    counts: {
      total: stocksWithAnalytics.length,
      leaders: leadersWithAnalytics.length,
      dfmLeaders,
      adxLeaders,
      extraWatchlist: stocksWithAnalytics.length - leadersWithAnalytics.length,
    },
  };
}

export function getUnifiedStocks(): StockWithAnalytics[] {
  return getUnifiedMarketDataset().stocks;
}

export function getUnifiedMarketLeaders(): StockWithAnalytics[] {
  return getUnifiedMarketDataset().marketLeaders;
}

export function getUnifiedStockBySymbol(symbol: string): StockWithAnalytics | undefined {
  const normalized = symbol.toUpperCase();
  return getUnifiedStocks().find((stock) => stock.symbol === normalized);
}

export function getUnifiedRawStockBySymbol(symbol: string): StockRecord | undefined {
  return getStockBySymbol(symbol);
}

export function getUnifiedSectors(market?: MarketCode): string[] {
  const stocks = getUnifiedStocks();
  const source = market ? stocks.filter((stock) => stock.market === market) : stocks;
  return Array.from(new Set(source.map((stock) => stock.sector))).sort((a, b) => a.localeCompare(b, "ar"));
}
