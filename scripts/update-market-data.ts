import fs from "node:fs/promises";
import path from "node:path";
import { stocksData } from "../src/data/stocksData";

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
  version: 1;
  updatedAt: string;
  source: string;
  quotes: Record<string, QuoteOverride>;
};

type RawObject = Record<string, unknown>;

const outputPath = path.resolve(process.cwd(), "src", "data", "generated", "market-overrides.json");
const defaultLocalSnapshot = path.resolve(process.cwd(), "..", "uae_dividend_watch_data_2026-05-27.json");
const symbolSet = new Set(stocksData.map((stock) => stock.symbol));

async function main() {
  const source = await loadSource();
  if (!source) {
    console.log("No MARKET_DATA_SNAPSHOT_URL or MARKET_DATA_SNAPSHOT_FILE configured; daily override file was left unchanged.");
    return;
  }

  const quotes = normalizeQuotes(source.data, source.label);
  const recognizedCount = Object.keys(quotes).length;

  if (!recognizedCount) {
    throw new Error(`No recognized stock quotes were found in ${source.label}.`);
  }

  const payload: OverridesFile = {
    version: 1,
    updatedAt: new Date().toISOString(),
    source: source.label,
    quotes,
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`Updated ${path.relative(process.cwd(), outputPath)} with ${recognizedCount} quote overrides from ${source.label}.`);
}

async function loadSource(): Promise<{ label: string; data: unknown } | null> {
  const url = process.env.MARKET_DATA_SNAPSHOT_URL?.trim();
  if (url) {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`Failed to fetch MARKET_DATA_SNAPSHOT_URL: ${response.status} ${response.statusText}`);
    return { label: url, data: await response.json() };
  }

  const configuredFile = process.env.MARKET_DATA_SNAPSHOT_FILE?.trim();
  const filePath = configuredFile ? path.resolve(process.cwd(), configuredFile) : defaultLocalSnapshot;
  if (await exists(filePath)) {
    return { label: `Local snapshot file: ${path.basename(filePath)}`, data: JSON.parse(await fs.readFile(filePath, "utf8")) };
  }

  return null;
}

function normalizeQuotes(data: unknown, source: string): Record<string, QuoteOverride> {
  const quotes: Record<string, QuoteOverride> = {};
  const root = asObject(data);
  if (!root) return quotes;

  for (const [symbol, quote] of Object.entries(asObject(root.quotes) ?? {})) {
    addQuote(quotes, symbol, quote, source);
  }

  for (const item of asArray(root.stocks)) {
    const record = asObject(item);
    const symbol = stringValue(record?.symbol);
    if (symbol) addQuote(quotes, symbol, record?.prices ?? record, source);
  }

  for (const item of asArray(root.data)) {
    const record = asObject(item);
    const symbol = stringValue(record?.symbol ?? record?.ticker);
    if (symbol) addQuote(quotes, symbol, record, source);
  }

  for (const [symbol, record] of Object.entries(asObject(root.dfm_market) ?? {})) {
    addQuote(quotes, symbol, normalizeDfmQuote(asObject(record), root), source);
  }

  for (const [symbol, record] of Object.entries(asObject(root.adx_market) ?? {})) {
    addQuote(quotes, symbol, normalizeAdxQuote(asObject(record), root), source);
  }

  return quotes;
}

function addQuote(target: Record<string, QuoteOverride>, rawSymbol: string, value: unknown, source: string) {
  const symbol = rawSymbol.toUpperCase();
  if (!symbolSet.has(symbol)) return;

  const record = asObject(value);
  if (!record) return;

  const quote = normalizeGenericQuote(record, source);
  if (quote.last === undefined && quote.changePercent === undefined && quote.tradeValue === undefined) return;

  target[symbol] = quote;
}

function normalizeGenericQuote(record: RawObject, source: string): QuoteOverride {
  const last = firstNumber(record.last, record.price, record.lastPrice, record.currentClose, record["Current Close"], record["Last Price"]);
  const previousClose = firstNumber(record.previousClose, record.previous_close, record.prevClose, record["Previous Close"]);
  const hasChangePrice = firstNumber(record.changePrice) !== undefined;
  const change = firstNumber(record.changePrice, record.dailyChange, record["Change (AED)"], record.change);
  const changePercent = firstNumber(
    record.changePercent,
    record.change_percent,
    record.dailyChangePercent,
    record["Change %"],
    hasChangePrice ? record.change : undefined,
  );

  return compactQuote({
    last,
    previousClose,
    change,
    changePercent,
    high: firstNumber(record.high, record.High),
    low: firstNumber(record.low, record.Low),
    high52: firstNumber(record.high52, record.yearHigh, record["52 Week High"]),
    low52: firstNumber(record.low52, record.yearLow, record["52 Week Low"]),
    volume: firstNumber(record.volume, record.tradeVolume, record["Trade Volume"]),
    tradeValue: firstNumber(record.tradeValue, record.value, record.trade_value, record["Trade Value"]),
    trades: firstNumber(record.trades, record.noOfTrades, record["No. of Trades"]),
    marketCap: firstNumber(record.marketCap, record.market_cap, record["Market Capitalization"]),
    lastUpdated: normalizeDate(record.lastUpdated ?? record.last_updated ?? record.date ?? record["Last Date"]),
    source,
  });
}

function normalizeDfmQuote(record: RawObject | null, root: RawObject): QuoteOverride {
  return normalizeGenericQuote(
    {
      ...(record ?? {}),
      lastUpdated: record?.["Last Date"] ?? root.dfm_date ?? root.today,
    },
    "DFM Daily Bulletin",
  );
}

function normalizeAdxQuote(record: RawObject | null, root: RawObject): QuoteOverride {
  return normalizeGenericQuote(
    {
      ...(record ?? {}),
      lastUpdated: asObject(root.adx_status)?.systemTimestamp ?? root.today,
    },
    "ADX Market Watch",
  );
}

function compactQuote(quote: QuoteOverride): QuoteOverride {
  return Object.fromEntries(
    Object.entries(quote)
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .map(([key, value]) => [key, typeof value === "number" ? roundQuoteNumber(key, value) : value]),
  ) as QuoteOverride;
}

function roundQuoteNumber(key: string, value: number): number {
  if (key === "volume" || key === "trades") return Math.round(value);
  if (key === "tradeValue" || key === "marketCap") return Number(value.toFixed(2));
  return Number(value.toFixed(4));
}

function firstNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    const parsed = parseNumber(value);
    if (parsed !== undefined) return parsed;
  }
  return undefined;
}

function parseNumber(value: unknown): number | undefined {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  const normalized = String(value ?? "").replace(/,/g, "").replace(/%/g, "").trim();
  if (!normalized || normalized === "-" || normalized.toLowerCase() === "n/a") return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeDate(value: unknown): string | undefined {
  const text = String(value ?? "").trim();
  if (!text) return undefined;
  const dmy = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
  const iso = text.match(/^(\d{4}-\d{2}-\d{2})/);
  if (iso) return iso[1];
  const parsed = new Date(text.replace(" ", "T"));
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString().slice(0, 10);
}

function asObject(value: unknown): RawObject | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as RawObject) : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

async function exists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
