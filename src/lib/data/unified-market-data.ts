import { DATASET_INFO, getStockBySymbol, marketLeaderStocks, stocksData } from "@/data/stocksData";
import {
  calculateDividendSustainability,
  calculateFinancialHealthScore,
  getExpectedTrend,
} from "@/utils/analyticsEngine";
import type { MarketCode, StockRecord, StockSymbol } from "@/types";

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

const analyticsBySymbol = new Map<StockSymbol, UnifiedStockAnalytics>(
  stocksData.map((stock) => [
    stock.symbol,
    {
      health: calculateFinancialHealthScore(stock),
      trend: getExpectedTrend(stock),
      dividendSustainability: calculateDividendSustainability(stock),
    },
  ]),
);

const stocksWithAnalytics: StockWithAnalytics[] = stocksData.map((stock) => ({
  ...stock,
  analytics: analyticsBySymbol.get(stock.symbol) as UnifiedStockAnalytics,
}));

const leadersWithAnalytics: StockWithAnalytics[] = marketLeaderStocks.map((stock) => ({
  ...stock,
  analytics: analyticsBySymbol.get(stock.symbol) as UnifiedStockAnalytics,
}));

export function getUnifiedMarketDataset(): UnifiedMarketDataset {
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
  return stocksWithAnalytics;
}

export function getUnifiedMarketLeaders(): StockWithAnalytics[] {
  return leadersWithAnalytics;
}

export function getUnifiedStockBySymbol(symbol: string): StockWithAnalytics | undefined {
  const normalized = symbol.toUpperCase();
  return stocksWithAnalytics.find((stock) => stock.symbol === normalized);
}

export function getUnifiedRawStockBySymbol(symbol: string): StockRecord | undefined {
  return getStockBySymbol(symbol);
}

export function getUnifiedSectors(market?: MarketCode): string[] {
  const source = market ? stocksWithAnalytics.filter((stock) => stock.market === market) : stocksWithAnalytics;
  return Array.from(new Set(source.map((stock) => stock.sector))).sort((a, b) => a.localeCompare(b, "ar"));
}
