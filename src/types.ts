export type MarketCode = "DFM" | "ADX";

export type StockSymbol = string;

export type Sector = string;

export type HealthBand = "ممتاز" | "جيد" | "متوازن" | "تحت المراقبة";

export type TrendDirection = "صاعد" | "مستقر إيجابي" | "محايد" | "ضاغط" | "متذبذب";

export type HistoricalPoint = {
  date: string;
  label: string;
  price: number;
  volume: number;
};

export type DividendPoint = {
  fiscalYear: number;
  amount: number;
  yield: number;
  exDate: string;
  paymentDate: string;
  source: "رسمي" | "نموذج داخلي";
};

export type Swot = {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
};

export type AnalystTarget = {
  low: number;
  base: number;
  high: number;
  upsidePercent: number;
  label: "نطاق قيمة داخلي" | "محايد" | "حذر";
  sourceNote: string;
};

export type StockRecord = {
  symbol: StockSymbol;
  nameAr: string;
  nameEn: string;
  market: MarketCode;
  sector: Sector;
  profile: string;
  officialUrls: {
    marketProfile: string;
    disclosures: string;
    dividends: string;
    investorRelations?: string;
  };
  prices: {
    last: number;
    previousClose: number;
    change: number;
    changePercent: number;
    high: number;
    low: number;
    high52: number;
    low52: number;
    volume: number;
    tradeValue: number;
    trades: number;
    marketCap: number;
    lastUpdated: string;
  };
  fundamentals: {
    pe: number;
    eps: number;
    epsGrowth: number;
    roe: number;
    netMargin: number;
    revenueAED: number;
    revenueDisplay: string;
    revenueGrowth: number;
    netProfitAED: number;
    netProfitDisplay: string;
    netProfitGrowth: number;
    operatingCashFlowAED: number;
    freeCashFlowAED: number;
    debtToEquity: number;
    payoutRatio: number;
    dividendYield: number;
  };
  dividend: {
    lastAmount: number;
    annualDividend: number;
    yieldPercent: number;
    entitlementDate: string;
    exDate: string;
    paymentDate: string;
    payoutRatio: number;
  };
  historicalPrices: HistoricalPoint[];
  historicalDividends: DividendPoint[];
  swot: Swot;
  modelTarget: AnalystTarget;
  sourceLabels: string[];
  marketLeader?: {
    combinedRank?: number;
    marketCapRank?: number;
    tradeValueRank?: number;
    selection: string;
    source: string;
  };
};

export type PortfolioHolding = {
  id: string;
  symbol: StockSymbol;
  shares: number;
  averageCost: number;
  addedAt: string;
};

export type StressScenario = {
  dropPercent: 10 | 20 | 30;
  portfolioValue: number;
  lossValue: number;
  annualIncomeAfterDrop: number;
};

export type SmartAlert = {
  id: string;
  symbol?: StockSymbol;
  title: string;
  message: string;
  severity: "info" | "success" | "warning" | "danger";
  type: "dividend" | "volume" | "health" | "portfolio" | "data";
};

export type DripPoint = {
  year: number;
  shares: number;
  portfolioValue: number;
  dividendsReceived: number;
  reinvestedShares: number;
  accumulatedDividendsCash?: number;
};
