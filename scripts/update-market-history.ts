import fs from "node:fs/promises";
import path from "node:path";
import { stocksConfig } from "../src/config/stocks.config";
import { USER_AGENT, tradingViewTicker } from "./tradingview";
import type { AverageVolumesFile, MarketHistoryFile, StockHistoryEntry } from "../src/types";

const historyPath = path.resolve(process.cwd(), "src", "data", "generated", "market-history.json");
const volumesPath = path.resolve(process.cwd(), "src", "data", "generated", "average-volumes.json");

const SOURCE = "TradingView";
const SOCKET_URL = "wss://data.tradingview.com/socket.io/websocket?from=chart%2F&type=chart";
const SOCKET_TIMEOUT_MS = 15_000;
const BARS_TO_FETCH = 290; // Twelve months of sessions, plus the warm-up for the 14-session indicators
const MIN_BARS = 20;
const DIVIDEND_YEARS = 6;
const AVERAGE_VOLUME_SESSIONS = 30;

// Node's WebSocket (22+) accepts headers, and TradingView refuses a connection without this Origin
const HeaderedWebSocket = WebSocket as unknown as new (url: string, options: { headers: Record<string, string> }) => WebSocket;

type Message = { m?: string; p?: [string, { sds_1?: { s?: { v: number[] }[] } }] };

function fetchDailyBars(ticker: string): Promise<StockHistoryEntry["prices"]> {
  return new Promise((resolve, reject) => {
    const socket = new HeaderedWebSocket(SOCKET_URL, { headers: { Origin: "https://www.tradingview.com" } });
    const session = `cs_${ticker.replace(/\W/g, "").toLowerCase()}`;
    const bars = new Map<string, StockHistoryEntry["prices"][number]>();

    const finish = (settle: () => void) => {
      clearTimeout(timer);
      socket.close();
      settle();
    };
    const timer = setTimeout(() => finish(() => reject(new Error("timed out"))), SOCKET_TIMEOUT_MS);
    const send = (method: string, params: unknown[]) => {
      const payload = JSON.stringify({ m: method, p: params });
      socket.send(`~m~${payload.length}~m~${payload}`);
    };

    socket.onerror = () => finish(() => reject(new Error("connection failed")));
    socket.onopen = () => {
      send("set_auth_token", ["unauthorized_user_token"]);
      send("chart_create_session", [session, ""]);
      send("resolve_symbol", [session, "sds_sym_1", `=${JSON.stringify({ adjustment: "splits", session: "regular", symbol: ticker })}`]);
      send("create_series", [session, "sds_1", "s1", "sds_sym_1", "1D", BARS_TO_FETCH, ""]);
    };
    socket.onmessage = (event) => {
      for (const frame of String(event.data).split(/~m~\d+~m~/).filter(Boolean)) {
        if (frame.startsWith("~h~")) {
          socket.send(`~m~${frame.length}~m~${frame}`);
          continue;
        }

        const message = JSON.parse(frame) as Message;
        if (message.m === "symbol_error" || message.m === "series_error") {
          finish(() => reject(new Error(message.m)));
        } else if (message.m === "timescale_update") {
          for (const { v } of message.p?.[1].sds_1?.s ?? []) {
            const [time, , , , close, volume] = v;
            const date = new Date(time * 1000).toISOString().slice(0, 10);
            bars.set(date, [date, Number(close.toFixed(4)), Math.round(volume ?? 0)]);
          }
        } else if (message.m === "series_completed") {
          finish(() => resolve([...bars.values()].sort((a, b) => a[0].localeCompare(b[0]))));
        }
      }
    };
  });
}

async function fetchDividendHistory(tickers: string[]): Promise<Map<string, StockHistoryEntry["dividends"]>> {
  const res = await fetch("https://scanner.tradingview.com/global/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": USER_AGENT },
    body: JSON.stringify({ symbols: { tickers }, columns: ["dps_common_stock_prim_issue_fy_h", "fiscal_period_fy_h"] }),
  });
  if (!res.ok) throw new Error(`API error code ${res.status}`);

  const json = (await res.json()) as { data?: { s: string; d: ((number | null)[] | null)[] }[] };
  const dividends = new Map<string, StockHistoryEntry["dividends"]>();

  for (const { s: ticker, d: [amounts, years] } of json.data ?? []) {
    const points: StockHistoryEntry["dividends"] = [];
    amounts?.forEach((amount, index) => {
      const year = years?.[index];
      if (typeof amount === "number" && typeof year === "number") points.push([year, Number(amount.toFixed(4))]);
    });
    dividends.set(ticker, points.sort((a, b) => a[0] - b[0]).slice(-DIVIDEND_YEARS));
  }

  return dividends;
}

async function readExistingHistory(): Promise<MarketHistoryFile["stocks"]> {
  try {
    return (JSON.parse(await fs.readFile(historyPath, "utf8")) as MarketHistoryFile).stocks;
  } catch {
    return {};
  }
}

function averageVolume(prices: StockHistoryEntry["prices"]): number | null {
  const recent = prices.slice(-AVERAGE_VOLUME_SESSIONS);
  if (recent.length < AVERAGE_VOLUME_SESSIONS) return null;
  return Math.round(recent.reduce((sum, [, , volume]) => sum + volume, 0) / recent.length);
}

// One line per stock keeps the daily diff readable
function serializeHistory(file: MarketHistoryFile): string {
  const rows = Object.entries(file.stocks).map(([symbol, entry]) => `    ${JSON.stringify(symbol)}: ${JSON.stringify(entry)}`);
  return `{\n  "version": ${file.version},\n  "source": ${JSON.stringify(file.source)},\n  "stocks": {\n${rows.join(",\n")}\n  }\n}\n`;
}

async function main() {
  const existing = await readExistingHistory();
  const tickers = stocksConfig.map((stock) => tradingViewTicker(stock.symbol, stock.market));

  let dividends = new Map<string, StockHistoryEntry["dividends"]>();
  try {
    dividends = await fetchDividendHistory(tickers);
  } catch (e) {
    console.warn(`Dividend history failed (${e instanceof Error ? e.message : e}). Keeping stored dividends.`);
  }

  // A stock without fresh bars keeps its last real series, along with that series' dates
  const stocks: MarketHistoryFile["stocks"] = {};
  const volumes: AverageVolumesFile["volumes"] = {};
  const failed: string[] = [];
  let fetchedCount = 0;

  for (const stock of stocksConfig) {
    const ticker = tradingViewTicker(stock.symbol, stock.market);
    const stored = existing[stock.symbol];
    let prices = stored?.prices ?? [];

    try {
      const bars = await fetchDailyBars(ticker);
      if (bars.length < MIN_BARS) throw new Error(`only ${bars.length} bars`);
      prices = bars;
      fetchedCount += 1;
    } catch (e) {
      failed.push(`${stock.symbol} (${e instanceof Error ? e.message : e})`);
    }

    const entry = { prices, dividends: dividends.get(ticker) ?? stored?.dividends ?? [] };
    if (entry.prices.length || entry.dividends.length) stocks[stock.symbol] = entry;

    const average = averageVolume(prices);
    if (average !== null) volumes[stock.symbol] = average;
  }

  console.log(`Fetched daily bars for ${fetchedCount}/${stocksConfig.length} stocks.`);
  if (failed.length) console.warn(`Without fresh bars: ${failed.join(", ")}`);
  if (fetchedCount === 0) throw new Error("TradingView returned no bars; leaving the stored history untouched.");

  await fs.writeFile(historyPath, serializeHistory({ version: 1, source: SOURCE, stocks }), "utf8");
  const volumesFile: AverageVolumesFile = { sessions: AVERAGE_VOLUME_SESSIONS, volumes };
  await fs.writeFile(volumesPath, `${JSON.stringify(volumesFile, null, 2)}\n`, "utf8");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("History update failed:", err);
    process.exit(1);
  });
