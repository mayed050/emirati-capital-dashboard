import fs from "node:fs/promises";
import path from "node:path";
import { stocksData } from "../src/data/stocksData";

// ANSI escape codes for beautiful console formatting
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";
const MAGENTA = "\x1b[35m";

type QuoteOverride = {
  last?: number;
  previousClose?: number;
  change?: number;
  changePercent?: number;
  high?: number;
  low?: number;
  high52?: number;
  low52?: number;
  volume?: number;
  tradeValue?: number;
  trades?: number;
  marketCap?: number;
  lastUpdated?: string;
  source?: string;
};

type OverridesFile = {
  version: number;
  updatedAt: string;
  source: string;
  quotes: Record<string, QuoteOverride>;
};

const overridesPath = path.resolve(process.cwd(), "src", "data", "generated", "market-overrides.json");
const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const USD_AED = 3.6725; // TradingView reports traded value and market cap in USD for these markets
const TRADINGVIEW_COLUMNS = ["close", "change_abs", "high", "low", "volume", "Value.Traded", "market_cap_basic", "price_52_week_high", "price_52_week_low"];
// Listed on TradingView under a different ticker than our symbol
const TRADINGVIEW_TICKERS: Record<string, string> = { EAND: "ADX:ETISALAT" };

async function runDaemon() {
  const runOnce = process.argv.includes("--once");

  if (!runOnce) {
    console.clear();
    console.log(`${BOLD}${CYAN}====================================================${RESET}`);
    console.log(`${BOLD}${MAGENTA}   Emirati Capital Dashboard - Live Data Daemon 🔄   ${RESET}`);
    console.log(`${BOLD}${CYAN}====================================================${RESET}`);
    console.log(`${CYAN}Starting background scheduler... Interval: 5 minutes.${RESET}`);
    console.log(`${CYAN}Output file: ${path.relative(process.cwd(), overridesPath)}${RESET}\n`);
  }

  // Run immediate first sync
  await syncMarketData();

  if (runOnce) {
    console.log(`${GREEN}Run once completed. Exiting successfully.${RESET}`);
    process.exit(0);
  }

  // Schedule every 5 minutes
  setInterval(async () => {
    await syncMarketData();
  }, INTERVAL_MS);
}

async function syncMarketData() {
  const now = new Date();
  const timestamp = now.toLocaleTimeString("ar-AE", { hour12: false });
  console.log(`[${timestamp}] ${BOLD}Initiating background market synchronization...${RESET}`);

  let existingQuotes: Record<string, QuoteOverride> = {};
  
  // Load existing overrides if they exist
  try {
    const raw = await fs.readFile(overridesPath, "utf8");
    const json = JSON.parse(raw) as OverridesFile;
    existingQuotes = json.quotes || {};
  } catch {
    console.log(`${YELLOW}No previous market overrides file found. Creating new seed...${RESET}`);
  }

  const apiKey = process.env.TWELVE_DATA_API_KEY;
  let sourceLabel = "Last known quotes";
  // A stock without a fresh quote keeps its last real one, along with that quote's date and source
  const updatedQuotes: Record<string, QuoteOverride> = { ...existingQuotes };

  if (apiKey) {
    // ----------------------------------------------------
    // Option A: Active Twelve Data API Integration
    // ----------------------------------------------------
    try {
      console.log(`${CYAN}Twelve Data API Key detected! Querying live market prices...${RESET}`);
      const symbols = stocksData.map((s) => s.symbol).join(",");
      const url = `https://api.twelvedata.com/price?symbol=${symbols}&apikey=${apiKey}`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error(`API error code ${res.status}`);
      const apiData = await res.json() as Record<string, { price?: string; code?: number; message?: string }>;

      stocksData.forEach((stock) => {
        const symbol = stock.symbol;
        const result = apiData[symbol];
        if (!result?.price) return;

        const prevQuote = existingQuotes[symbol];
        const previousClose = prevQuote?.previousClose ?? stock.prices.previousClose;
        const lastPrice = Number(Number(result.price).toFixed(4));
        const change = Number((lastPrice - previousClose).toFixed(4));
        const changePercent = Number(((change / previousClose) * 100).toFixed(4));

        updatedQuotes[symbol] = {
          ...prevQuote,
          last: lastPrice,
          previousClose,
          change,
          changePercent,
          high: Math.max(prevQuote?.high ?? lastPrice, lastPrice),
          low: Math.min(prevQuote?.low ?? lastPrice, lastPrice),
          high52: prevQuote?.high52 ?? stock.prices.high52,
          low52: prevQuote?.low52 ?? stock.prices.low52,
          marketCap: Number((stock.prices.marketCap * (lastPrice / stock.prices.last)).toFixed(2)),
          lastUpdated: now.toISOString().slice(0, 10),
          source: "Twelve Data API Live"
        };
      });

      sourceLabel = "Twelve Data Background Sync";
      console.log(`${GREEN}✔ Live API sync successful!${RESET}`);

    } catch (e) {
      const err = e instanceof Error ? e.message : String(e);
      console.log(`${RED}✘ API Sync failed (${err}). Keeping last known quotes.${RESET}`);
    }
  } else {
    // ----------------------------------------------------
    // Option B: Free Yahoo Finance (DFM) + TradingView (ADX)
    // ----------------------------------------------------
    console.log(`${CYAN}No Twelve Data API Key. Initiating free Yahoo Finance and TradingView sync...${RESET}`);

    const dfmStocks = stocksData.filter((s) => s.market === "DFM");
    const adxStocks = stocksData.filter((s) => s.market === "ADX");
    let yahooMatchedCount = 0;

    for (const stock of dfmStocks) {
      const ticker = `${stock.symbol}.AE`;
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}`;

      try {
        const res = await fetch(url, {
          headers: { "User-Agent": USER_AGENT }
        });
        if (res.status === 200) {
          const data = await res.json() as any;
          const meta = data.chart?.result?.[0]?.meta || {};
          const livePrice = meta.regularMarketPrice;
          const prevClose = meta.previousClose ?? stock.prices.previousClose;

          if (livePrice !== undefined) {
            const prevQuote = existingQuotes[stock.symbol];
            const change = Number((livePrice - prevClose).toFixed(4));
            const changePercent = Number(((change / prevClose) * 100).toFixed(4));
            const currentVol = meta.regularMarketVolume ?? (prevQuote?.volume ?? stock.prices.volume);
            const currentVal = Number((currentVol * livePrice).toFixed(2));

            updatedQuotes[stock.symbol] = {
              last: livePrice,
              previousClose: prevClose,
              change,
              changePercent,
              high: meta.regularMarketDayHigh ?? Math.max(prevQuote?.high ?? livePrice, livePrice),
              low: meta.regularMarketDayLow ?? Math.min(prevQuote?.low ?? livePrice, livePrice),
              high52: meta.fiftyTwoWeekHigh ?? prevQuote?.high52 ?? stock.prices.high52,
              low52: meta.fiftyTwoWeekLow ?? prevQuote?.low52 ?? stock.prices.low52,
              volume: currentVol,
              tradeValue: currentVal,
              trades: prevQuote?.trades ?? stock.prices.trades,
              marketCap: Number((stock.prices.marketCap * (livePrice / stock.prices.last)).toFixed(2)),
              lastUpdated: now.toISOString().slice(0, 10),
              source: "Yahoo Finance Free Chart Live"
            };
            yahooMatchedCount++;
          }
        }
      } catch (e) {
        // This symbol keeps its last known quote
      }
    }

    let tradingViewMatchedCount = 0;
    try {
      const adxQuotes = await fetchTradingViewQuotes(adxStocks, existingQuotes, now);
      Object.assign(updatedQuotes, adxQuotes);
      tradingViewMatchedCount = Object.keys(adxQuotes).length;
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e);
      console.log(`${RED}✘ TradingView sync failed (${err}). Keeping last known ADX quotes.${RESET}`);
    }

    sourceLabel = `Yahoo Finance (DFM: ${yahooMatchedCount}/${dfmStocks.length}) + TradingView (ADX: ${tradingViewMatchedCount}/${adxStocks.length})`;
    console.log(`${GREEN}✔ Free sync completed! Synced ${yahooMatchedCount} DFM stocks from Yahoo Finance and ${tradingViewMatchedCount} ADX stocks from TradingView.${RESET}`);
  }

  // Write payload
  const payload: OverridesFile = {
    version: 2,
    updatedAt: now.toISOString(),
    source: sourceLabel,
    quotes: updatedQuotes
  };

  try {
    await fs.mkdir(path.dirname(overridesPath), { recursive: true });
    await fs.writeFile(overridesPath, JSON.stringify(payload, null, 2), "utf8");
    printTerminalReport(updatedQuotes);
  } catch (err) {
    console.error(`${RED}✘ Failed to write overrides file:${RESET}`, err);
  }
}

async function fetchTradingViewQuotes(
  stocks: typeof stocksData,
  existing: Record<string, QuoteOverride>,
  now: Date
): Promise<Record<string, QuoteOverride>> {
  const stockByTicker = new Map(stocks.map((stock) => [TRADINGVIEW_TICKERS[stock.symbol] ?? `ADX:${stock.symbol}`, stock]));

  const res = await fetch("https://scanner.tradingview.com/global/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": USER_AGENT },
    body: JSON.stringify({ symbols: { tickers: [...stockByTicker.keys()] }, columns: TRADINGVIEW_COLUMNS })
  });
  if (!res.ok) throw new Error(`API error code ${res.status}`);

  const json = await res.json() as { data?: { s: string; d: (number | null)[] }[] };
  const quotes: Record<string, QuoteOverride> = {};

  for (const { s: ticker, d: row } of json.data ?? []) {
    const stock = stockByTicker.get(ticker);
    const [close, changeAbs, high, low, volume, tradedUsd, marketCapUsd, high52, low52] = row;
    if (!stock || typeof close !== "number") continue;

    const prevQuote = existing[stock.symbol];
    const change = Number((changeAbs ?? 0).toFixed(4));
    const previousClose = Number((close - change).toFixed(4));

    quotes[stock.symbol] = {
      last: close,
      previousClose,
      change,
      changePercent: Number(((change / previousClose) * 100).toFixed(4)),
      high: high ?? close,
      low: low ?? close,
      high52: typeof high52 === "number" ? Number(high52.toFixed(4)) : prevQuote?.high52,
      low52: typeof low52 === "number" ? Number(low52.toFixed(4)) : prevQuote?.low52,
      volume: volume ?? prevQuote?.volume,
      tradeValue: typeof tradedUsd === "number" ? Number((tradedUsd * USD_AED).toFixed(2)) : prevQuote?.tradeValue,
      trades: prevQuote?.trades,
      marketCap: typeof marketCapUsd === "number" ? Number((marketCapUsd * USD_AED).toFixed(2)) : prevQuote?.marketCap,
      lastUpdated: now.toISOString().slice(0, 10),
      source: "TradingView Scanner (15-minute delay)"
    };
  }

  return quotes;
}

function printTerminalReport(quotes: Record<string, QuoteOverride>) {
  console.log(`\n${BOLD}--- MARKET OVERVIEW REPORT ---${RESET}`);
  console.log(`${"SYMBOL".padEnd(12)} | ${"PRICE".padStart(8)} | ${"CHANGE".padStart(8)} | ${"CHANGE %".padStart(10)} | ${"VOLUME".padStart(10)}`);
  console.log("-".repeat(55));

  // Show a few prominent stocks in the console output to avoid bloating
  const sampleSymbols = ["EMAAR", "DEWA", "SALIK", "FAB", "EAND", "ADCB"];
  
  sampleSymbols.forEach((sym) => {
    const quote = quotes[sym];
    if (!quote) return;
    
    const priceStr = quote.last?.toFixed(3) || "N/A";
    const changeStr = (quote.change !== undefined && quote.change >= 0 ? "+" : "") + (quote.change?.toFixed(3) || "0.000");
    const pctStr = (quote.changePercent !== undefined && quote.changePercent >= 0 ? "+" : "") + (quote.changePercent?.toFixed(2) || "0.00") + "%";
    const volStr = quote.volume?.toLocaleString() || "0";
    
    const color = (quote.changePercent ?? 0) > 0 ? GREEN : (quote.changePercent ?? 0) < 0 ? RED : RESET;
    
    console.log(`${BOLD}${sym.padEnd(12)}${RESET} | ${priceStr.padStart(8)} | ${color}${changeStr.padStart(8)}${RESET} | ${color}${pctStr.padStart(10)}${RESET} | ${volStr.padStart(10)}`);
  });

  const totalCount = Object.keys(quotes).length;
  console.log("-".repeat(55));
  console.log(`${GREEN}✔ Synchronized ${totalCount} UAE Stocks successfully! Next cycle in 5 minutes.${RESET}\n`);
}

// Start executing
runDaemon().catch((err) => {
  console.error("Daemon crashed:", err);
  process.exit(1);
});
