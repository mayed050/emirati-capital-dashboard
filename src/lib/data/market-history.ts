import "server-only";

import marketHistory from "@/data/generated/market-history.json";
import { marketLeaderStocks } from "@/data/stocksData";
import { monthsBefore } from "@/utils/analyticsEngine";
import type { HistoricalPoint, MarketCode, MarketHistoryFile, MarketIndexSeries, StockHistory, StockRecord } from "@/types";

// Server-only because this file holds a year of daily bars for every stock: pages hand each
// client component just the series it renders instead of bundling all of them into every page.
const history = marketHistory as unknown as MarketHistoryFile;

const INDEX_WINDOW_MONTHS = 12;
const STALE_SERIES_DAYS = 7;

export function getStockHistory(symbol: string): StockHistory {
  const entry = history.stocks[symbol];

  return {
    prices: (entry?.prices ?? []).map(([date, price, volume]) => ({ date, price, volume })),
    dividends: (entry?.dividends ?? []).map(([fiscalYear, amount]) => ({ fiscalYear, amount })),
    source: history.source,
  };
}

export function getMarketIndexes(): Record<MarketCode, MarketIndexSeries> {
  return {
    DFM: buildMarketIndex(marketLeaderStocks.filter((stock) => stock.market === "DFM")),
    ADX: buildMarketIndex(marketLeaderStocks.filter((stock) => stock.market === "ADX")),
  };
}

function buildMarketIndex(stocks: StockRecord[]): MarketIndexSeries {
  const series = stocks
    .map((stock) => ({ marketCap: stock.prices.marketCap, prices: getStockHistory(stock.symbol).prices }))
    .filter(({ prices }) => prices.length > 0);
  const lastDate = series.map(({ prices }) => prices[prices.length - 1].date).sort().at(-1);
  if (!lastDate) return { points: [], constituents: 0, total: stocks.length, source: history.source };

  // A constituent has to span the whole window, or its first close would rebase the index mid-series
  const startDate = monthsBefore(lastDate, INDEX_WINDOW_MONTHS);
  const constituents = series.filter(({ prices }) => {
    const ageDays = (Date.parse(lastDate) - Date.parse(prices[prices.length - 1].date)) / 86_400_000;
    return prices[0].date <= startDate && ageDays <= STALE_SERIES_DAYS;
  });

  const dates = [...new Set(constituents.flatMap(({ prices }) => prices.map((point) => point.date)))]
    .filter((date) => date >= startDate)
    .sort();
  const closes = constituents.map(({ prices }) => closesOn(prices, dates));
  const totalMarketCap = constituents.reduce((sum, { marketCap }) => sum + marketCap, 0) || 1;

  return {
    points: dates.map((date, index) => {
      const weighted = constituents.reduce((sum, { marketCap }, position) => {
        return sum + (closes[position][index] / closes[position][0]) * marketCap;
      }, 0);

      return { date, index: Number(((weighted / totalMarketCap) * 1000).toFixed(2)) };
    }),
    constituents: constituents.length,
    total: stocks.length,
    source: history.source,
  };
}

// A stock missing a session (a suspension, say) carries its previous close forward
function closesOn(prices: HistoricalPoint[], dates: string[]): number[] {
  let cursor = 0;

  return dates.map((date) => {
    while (cursor + 1 < prices.length && prices[cursor + 1].date <= date) cursor += 1;
    return prices[cursor].price;
  });
}
