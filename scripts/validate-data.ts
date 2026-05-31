import { DATASET_INFO, marketLeaderStocks, stocksData } from "../src/data/stocksData";
import {
  calculateDividendSustainability,
  calculateFinancialHealthScore,
  getExpectedTrend,
} from "../src/utils/analyticsEngine";
import type { StockRecord } from "../src/types";

const REQUIRED_LEADERS_PER_MARKET = 20;
const MIN_HISTORY_POINTS = 12;
const MIN_DIVIDEND_POINTS = 4;
const MIN_SWOT_ITEMS = 3;

const errors: string[] = [];
const warnings: string[] = [];

function main() {
  check(DATASET_INFO.brandAr.length > 0, "Dataset brandAr is missing.");
  check(DATASET_INFO.snapshotDate.length > 0, "Dataset snapshotDate is missing.");
  check(stocksData.length >= REQUIRED_LEADERS_PER_MARKET * 2, "Dataset must contain at least 40 stocks.");

  const dfmLeaders = marketLeaderStocks.filter((stock) => stock.market === "DFM");
  const adxLeaders = marketLeaderStocks.filter((stock) => stock.market === "ADX");
  check(dfmLeaders.length === REQUIRED_LEADERS_PER_MARKET, `Expected 20 DFM market leaders, found ${dfmLeaders.length}.`);
  check(adxLeaders.length === REQUIRED_LEADERS_PER_MARKET, `Expected 20 ADX market leaders, found ${adxLeaders.length}.`);

  const seenSymbols = new Set<string>();
  for (const stock of stocksData) {
    check(!seenSymbols.has(stock.symbol), `${stock.symbol}: duplicate symbol.`);
    seenSymbols.add(stock.symbol);
    validateStock(stock);
  }

  if (warnings.length) {
    console.warn(`Data validation warnings (${warnings.length}):`);
    for (const warning of warnings) console.warn(`- ${warning}`);
  }

  if (errors.length) {
    console.error(`Data validation failed (${errors.length}):`);
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }

  console.log(
    `Data validation passed: ${stocksData.length} stocks, ${dfmLeaders.length} DFM leaders, ${adxLeaders.length} ADX leaders.`,
  );
}

function validateStock(stock: StockRecord) {
  const prefix = stock.symbol;

  check(Boolean(stock.nameAr), `${prefix}: Arabic name is missing.`);
  check(Boolean(stock.nameEn), `${prefix}: English name is missing.`);
  check(stock.market === "DFM" || stock.market === "ADX", `${prefix}: invalid market ${stock.market}.`);
  check(Boolean(stock.sector), `${prefix}: sector is missing.`);
  check(Boolean(stock.profile), `${prefix}: profile is missing.`);
  check(Boolean(stock.officialUrls.marketProfile), `${prefix}: market profile URL is missing.`);

  validateNumbers(prefix, "prices", stock.prices, [
    "last",
    "previousClose",
    "change",
    "changePercent",
    "high",
    "low",
    "high52",
    "low52",
    "volume",
    "tradeValue",
    "trades",
    "marketCap",
  ]);
  validateNumbers(prefix, "fundamentals", stock.fundamentals, [
    "pe",
    "eps",
    "epsGrowth",
    "roe",
    "netMargin",
    "revenueAED",
    "revenueGrowth",
    "netProfitAED",
    "netProfitGrowth",
    "operatingCashFlowAED",
    "freeCashFlowAED",
    "debtToEquity",
    "payoutRatio",
    "dividendYield",
  ]);
  validateNumbers(prefix, "dividend", stock.dividend, ["lastAmount", "annualDividend", "yieldPercent", "payoutRatio"]);

  check(isIsoDate(stock.prices.lastUpdated), `${prefix}: lastUpdated is not YYYY-MM-DD.`);
  check(isIsoDate(stock.dividend.entitlementDate), `${prefix}: entitlementDate is not YYYY-MM-DD.`);
  check(isIsoDate(stock.dividend.exDate), `${prefix}: exDate is not YYYY-MM-DD.`);
  check(isIsoDate(stock.dividend.paymentDate), `${prefix}: paymentDate is not YYYY-MM-DD.`);

  check(stock.historicalPrices.length >= MIN_HISTORY_POINTS, `${prefix}: expected at least ${MIN_HISTORY_POINTS} historical price points.`);
  for (const point of stock.historicalPrices) {
    check(isIsoDate(point.date), `${prefix}: invalid historical price date ${point.date}.`);
    checkFinite(point.price, `${prefix}: invalid historical price.`);
    checkFinite(point.volume, `${prefix}: invalid historical volume.`);
  }

  check(stock.historicalDividends.length >= MIN_DIVIDEND_POINTS, `${prefix}: expected at least ${MIN_DIVIDEND_POINTS} dividend history points.`);
  for (const point of stock.historicalDividends) {
    checkFinite(point.amount, `${prefix}: invalid historical dividend amount.`);
    checkFinite(point.yield, `${prefix}: invalid historical dividend yield.`);
    check(isIsoDate(point.exDate), `${prefix}: invalid historical exDate ${point.exDate}.`);
    check(isIsoDate(point.paymentDate), `${prefix}: invalid historical paymentDate ${point.paymentDate}.`);
  }

  checkSwot(prefix, "strengths", stock.swot.strengths);
  checkSwot(prefix, "weaknesses", stock.swot.weaknesses);
  checkSwot(prefix, "opportunities", stock.swot.opportunities);
  checkSwot(prefix, "threats", stock.swot.threats);

  checkFinite(stock.modelTarget.low, `${prefix}: invalid model target low.`);
  checkFinite(stock.modelTarget.base, `${prefix}: invalid model target base.`);
  checkFinite(stock.modelTarget.high, `${prefix}: invalid model target high.`);
  check(stock.modelTarget.low <= stock.modelTarget.base, `${prefix}: model target low is above base.`);
  check(stock.modelTarget.base <= stock.modelTarget.high, `${prefix}: model target base is above high.`);

  const impliedYield = stock.prices.last > 0 ? (stock.dividend.annualDividend / stock.prices.last) * 100 : 0;
  if (Math.abs(impliedYield - stock.fundamentals.dividendYield) > 0.25) {
    warnings.push(`${prefix}: dividend yield differs from annualDividend / last price by more than 0.25%.`);
  }

  const health = calculateFinancialHealthScore(stock);
  check(health.score >= 1 && health.score <= 100, `${prefix}: health score is outside 1-100.`);
  check(Boolean(health.band), `${prefix}: health band is missing.`);
  check(Boolean(getExpectedTrend(stock).direction), `${prefix}: trend direction is missing.`);
  check(Boolean(calculateDividendSustainability(stock).rating), `${prefix}: dividend sustainability rating is missing.`);
}

function validateNumbers(prefix: string, group: string, record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) checkFinite(record[key], `${prefix}: invalid ${group}.${key}.`);
}

function checkSwot(prefix: string, name: string, items: string[]) {
  check(Array.isArray(items), `${prefix}: SWOT ${name} is not an array.`);
  check(items.length >= MIN_SWOT_ITEMS, `${prefix}: SWOT ${name} must contain at least ${MIN_SWOT_ITEMS} items.`);
  for (const item of items) check(Boolean(item.trim()), `${prefix}: SWOT ${name} contains an empty item.`);
}

function checkFinite(value: unknown, message: string) {
  check(typeof value === "number" && Number.isFinite(value), message);
}

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime());
}

function check(condition: boolean, message: string) {
  if (!condition) errors.push(message);
}

main();
