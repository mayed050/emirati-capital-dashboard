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
  let sourceLabel = "Simulation Daemon (Stateful Feed)";
  let updatedQuotes: Record<string, QuoteOverride> = {};

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
        const prevQuote = existingQuotes[symbol];
        const previousClose = prevQuote?.previousClose ?? stock.prices.previousClose;
        
        let lastPrice = prevQuote?.last ?? stock.prices.last;
        let sourceUsed = "Simulation Fallback";

        if (result && result.price) {
          lastPrice = Number(Number(result.price).toFixed(4));
          sourceUsed = "Twelve Data API Live";
        } else {
          // Stateful simulation tick if symbol is missing from Twelve Data
          const changePct = (Math.random() * 0.4 - 0.18) / 100;
          lastPrice = Number((lastPrice * (1 + changePct)).toFixed(4));
        }

        const change = Number((lastPrice - previousClose).toFixed(4));
        const changePercent = Number(((change / previousClose) * 100).toFixed(4));
        
        const additionalVol = Math.floor(Math.random() * 20000) + 1000;
        const currentVol = (prevQuote?.volume ?? stock.prices.volume) + additionalVol;
        const currentVal = Number(((prevQuote?.tradeValue ?? stock.prices.tradeValue) + (additionalVol * lastPrice)).toFixed(2));

        updatedQuotes[symbol] = {
          last: lastPrice,
          previousClose,
          change,
          changePercent,
          high: Math.max(prevQuote?.high ?? lastPrice, lastPrice),
          low: Math.min(prevQuote?.low ?? lastPrice, lastPrice),
          high52: prevQuote?.high52 ?? stock.prices.high52,
          low52: prevQuote?.low52 ?? stock.prices.low52,
          volume: currentVol,
          tradeValue: currentVal,
          trades: (prevQuote?.trades ?? stock.prices.trades) + Math.floor(additionalVol / 120),
          marketCap: Number((stock.prices.marketCap * (lastPrice / stock.prices.last)).toFixed(2)),
          lastUpdated: now.toISOString().slice(0, 10),
          source: sourceUsed
        };
      });

      sourceLabel = "Twelve Data Background Sync";
      console.log(`${GREEN}✔ Live API sync successful!${RESET}`);

    } catch (e) {
      const err = e instanceof Error ? e.message : String(e);
      console.log(`${RED}✘ API Sync failed (${err}). Falling back to simulation...${RESET}`);
      updatedQuotes = generateSimulatedQuotes(existingQuotes, now);
    }
  } else {
    // ----------------------------------------------------
    // Option B: High-Fidelity Simulation Daemon
    // ----------------------------------------------------
    updatedQuotes = generateSimulatedQuotes(existingQuotes, now);
    console.log(`${GREEN}✔ Simulated quote tick computed statefully!${RESET}`);
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

function generateSimulatedQuotes(existing: Record<string, QuoteOverride>, now: Date): Record<string, QuoteOverride> {
  const updated: Record<string, QuoteOverride> = {};
  
  stocksData.forEach((stock) => {
    const symbol = stock.symbol;
    const prev = existing[symbol];
    
    const previousClose = prev?.previousClose ?? stock.prices.previousClose;
    let currentLast = prev?.last ?? stock.prices.last;

    // Apply high-fidelity session tracking
    // Stocks will fluctuate statefully
    const isUpDay = Math.random() > 0.46; // Slight bullish bias
    const percentChange = (Math.random() * 0.35 + 0.05) * (isUpDay ? 1 : -1) / 100;
    const nextPrice = Math.max(Number((currentLast * (1 + percentChange)).toFixed(4)), 0.05);

    const change = Number((nextPrice - previousClose).toFixed(4));
    const changePercent = Number(((change / previousClose) * 100).toFixed(4));

    const addedVol = Math.floor(Math.random() * 8000) + 500;
    const currentVol = (prev?.volume ?? stock.prices.volume) + addedVol;
    const currentVal = Number(((prev?.tradeValue ?? stock.prices.tradeValue) + (addedVol * nextPrice)).toFixed(2));

    updated[symbol] = {
      last: nextPrice,
      previousClose,
      change,
      changePercent,
      high: Math.max(prev?.high ?? nextPrice, nextPrice),
      low: Math.min(prev?.low ?? nextPrice, nextPrice),
      high52: prev?.high52 ?? stock.prices.high52,
      low52: prev?.low52 ?? stock.prices.low52,
      volume: currentVol,
      tradeValue: currentVal,
      trades: (prev?.trades ?? stock.prices.trades) + Math.floor(addedVol / 95),
      marketCap: Number((stock.prices.marketCap * (nextPrice / stock.prices.last)).toFixed(2)),
      lastUpdated: now.toISOString().slice(0, 10),
      source: "Simulation Daemon (5m Stateful Tick)"
    };
  });

  return updated;
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
