import type { MarketCode, StockSymbol } from "../src/types";

export const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// Listed on TradingView under a different ticker than our symbol
const TICKER_ALIASES: Record<StockSymbol, string> = { EAND: "ADX:ETISALAT" };

export function tradingViewTicker(symbol: StockSymbol, market: MarketCode): string {
  return TICKER_ALIASES[symbol] ?? `${market}:${symbol}`;
}
