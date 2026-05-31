import { stocksConfig } from "@/config/stocks.config";
import marketOverrides from "@/data/generated/market-overrides.json";
import type { AnalystTarget, DividendPoint, HistoricalPoint, StockRecord, StockSymbol, Swot } from "@/types";

type StockSeed = Pick<StockRecord, "symbol" | "prices" | "fundamentals" | "dividend"> & {
  marketLeader?: StockRecord["marketLeader"];
  sourceLabels?: string[];
};

type LeaderSeedInput = {
  symbol: StockSymbol;
  prices: StockRecord["prices"];
  revenueBn: number;
  combinedRank?: number;
  marketCapRank: number;
  tradeValueRank?: number;
  source: string;
  dividendYield?: number;
  pe?: number;
  roe?: number;
  netMargin?: number;
  revenueGrowth?: number;
  netProfitGrowth?: number;
  debtToEquity?: number;
};

type PriceOverride = Partial<StockRecord["prices"]> & {
  source?: string;
};

type MarketOverridesFile = {
  version: number;
  updatedAt?: string;
  source?: string;
  quotes?: Record<string, PriceOverride>;
};

const dailyOverrides = marketOverrides as MarketOverridesFile;
const dailyPriceOverrides = dailyOverrides.quotes ?? {};

const modelSource =
  "نطاقات القيمة والسلاسل التاريخية الممتدة مشتقة داخليا من لقطة 2026-05-29، وليست تغطية محللين أو أسعارا حية.";

const dfmLeaderSource = "DFM Daily Bulletin 2026-05-25";
const adxLeaderSource = "StockAnalysis ADX list and latest history accessed 2026-05-29";

const coreSeeds: StockSeed[] = [
  {
    symbol: "DEWA",
    prices: price(2.61, 2.62, -0.01, -0.382, 2.67, 2.61, 3.15, 2.55, 38_370_441, 100_503_069.89, 1_631, 130_500_000_000, "2026-05-25"),
    fundamentals: fund(14.91, 0.18, 27.5, 10.18, 26.25, 33.33, 7.0, 8.75, 27.5, 21_887, 11_240, 0.47, 70.83, 4.75),
    dividend: div(0.062, 0.12, 4.75, "2026-04-09", "2026-04-10", "2026-04-20", 70.83),
    marketLeader: leaderMeta(3, 2, 6, dfmLeaderSource),
  },
  {
    symbol: "SALIK",
    prices: price(5.35, 5.45, -0.1, -1.835, 5.65, 5.35, 6.96, 4.96, 24_853_429, 133_956_144.77, 1_512, 40_125_000_000, "2026-05-25"),
    fundamentals: fund(25.85, 0.21, 23.4, 101.89, 50.49, 3.07, 23.9, 1.55, 23.4, 2_092, 2_091, 2.52, 89.61, 4.14),
    dividend: div(0.118712, 0.22, 4.14, "2026-04-16", "2026-04-17", "2026-04-27", 89.61),
    marketLeader: leaderMeta(7, 8, 5, dfmLeaderSource),
  },
  {
    symbol: "TALABAT",
    prices: price(1.1, 0.976, 0.124, 12.705, 1.12, 1.0, 1.49, 0.627, 280_738_624, 302_766_620.08, 3_749, 25_617_064_687.5, "2026-05-25"),
    fundamentals: fund(15.18, 0.07, 19.4, 13.5, 11.84, 13.6, 84.8, 1.61, 13.8, 673.46, 631.73, 0.22, 53.51, 6.01),
    dividend: div(0.07, 0.07, 6.01, "2026-04-21", "2026-04-22", "2026-05-12", 53.51),
    marketLeader: leaderMeta(6, 10, 2, dfmLeaderSource),
  },
  {
    symbol: "DIB",
    prices: price(7.4, 7.32, 0.08, 1.093, 7.65, 7.4, 10.2, 6.97, 11_213_747, 83_970_162.61, 1_041, 53_581_508_389.8, "2026-05-25"),
    fundamentals: fund(7.5, 0.99, -6.9, 15.11, 55.36, 12.88, 1.4, 7.13, -7.5, -43_601, -43_997, 0.39, 4.39, 4.73),
    dividend: div(0.35, 0.35, 4.73, "2026-04-09", "2026-04-10", "2026-04-16", 4.39),
    marketLeader: leaderMeta(5, 5, 7, dfmLeaderSource),
  },
  {
    symbol: "EMIRATESNBD",
    prices: price(27.62, 27.62, 0, 0, 28.72, 27.62, 37.4, 20.6, 5_706_603, 158_945_731.58, 1_875, 174_464_443_747.86, "2026-05-25"),
    fundamentals: fund(7.37, 3.75, 7.6, 17.84, 48.18, 49.09, 9.3, 23.65, 7.5, -151_918, -152_617, 1.26, 28.24, 3.62),
    dividend: div(1, 1, 3.62, "2026-02-25", "2026-02-26", "2026-03-02", 28.24),
    marketLeader: leaderMeta(1, 1, 3, dfmLeaderSource),
  },
  {
    symbol: "DU",
    prices: price(11.2, 11.28, -0.08, -0.709, 11.5, 11.2, 11.6, 8.31, 3_556_204, 40_093_268.38, 686, 50_768_547_076.8, "2026-05-25"),
    fundamentals: fund(16.83, 0.67, 15.7, 33.1, 18.68, 16.17, 8.5, 3.02, 15.7, 5_583, 3_514, 0.2, 87.15, 5.71),
    dividend: div(0.4, 0.64, 5.71, "2026-04-07", "2026-04-08", "2026-04-29", 87.15),
    marketLeader: leaderMeta(8, 6, 9, dfmLeaderSource),
  },
  {
    symbol: "EMPOWER",
    prices: price(1.59, 1.59, 0, 0, 1.62, 1.58, 1.96, 1.48, 3_883_358, 6_189_177.97, 336, 15_900_000_000, "2026-05-25"),
    fundamentals: fund(15.04, 0.11, 20.6, 33.63, 30.2, 3.51, 7.1, 1.06, 20.7, 1_893, 1_431, 1.68, 82.75, 5.5),
    dividend: div(0.0875, 0.09, 5.5, "2026-04-02", "2026-04-03", "2026-04-23", 82.75),
    marketLeader: leaderMeta(16, 15, 19, dfmLeaderSource),
  },
  {
    symbol: "EMAAR",
    prices: price(11.78, 11.48, 0.3, 2.613, 11.98, 11.7, 17.26, 10.16, 47_967_512, 566_324_607.2, 3_548, 104_120_944_421.22, "2026-05-25"),
    fundamentals: fund(5.5, 2.14, 32.2, 24.73, 36.43, 51.86, 33.4, 18.89, 32.1, 31_973, 30_982, 0.1, 59.19, 8.49),
    dividend: div(1, 1, 8.49, "2026-04-02", "2026-04-03", "2026-04-22", 59.19),
    marketLeader: leaderMeta(2, 3, 1, dfmLeaderSource),
  },
  {
    symbol: "TECOM",
    prices: price(3.3, 3.27, 0.03, 0.917, 3.41, 3.3, 4.15, 2.89, 241_450, 800_562.44, 102, 16_500_000_000, "2026-05-25"),
    fundamentals: fund(7.75, 0.43, 64.1, 29.41, 72.7, 2.93, 16.5, 2.13, 64.1, 2_021, 1_335, 0.71, 39.46, 5.45),
    dividend: div(0.088, 0.18, 5.45, "2026-03-17", "2026-03-18", "2026-03-27", 39.46),
  },
  {
    symbol: "NMDCENR",
    prices: price(2.97, 2.83, 0.14, 4.947, 2.97, 2.85, 3.33, 2.2, 4_591_502, 13_523_082.93, 206, 14_850_000_000, "2026-05-27"),
    fundamentals: fund(10.14, 0.29, 1.2, 28.82, 7.34, 19.89, 24, 1.46, 1.2, 2_264, 1_690, 0.15, 54.67, 5.39),
    dividend: div(0.16005, 0.16, 5.39, "2026-03-11", "2026-03-12", "2026-04-02", 54.67),
  },
  {
    symbol: "EAND",
    prices: price(18.04, 18.48, -0.44, -2.381, 18.74, 18.04, 20.95, 15.4, 19_242_464, 348_516_615.58, 1_583, 156_889_442_160, "2026-05-27"),
    fundamentals: fund(13.2, 1.37, -13.7, 23.44, 15.77, 75.41, 21.9, 11.89, -13.7, 29_081, 20_350, 1.21, 68.1, 5.21),
    dividend: div(0.47, 0.94, 5.21, "2026-04-07", "2026-04-08", "2026-04-23", 68.1),
    marketLeader: leaderMeta(2, 5, 2, adxLeaderSource),
  },
  {
    symbol: "ADNOCDIST",
    prices: price(3.93, 3.85, 0.08, 2.078, 3.95, 3.85, 4.14, 3.08, 19_564_733, 76_791_608.6, 820, 49_125_000_000, "2026-05-27"),
    fundamentals: fund(16.79, 0.23, 16.6, 110.41, 8.08, 36.26, 3.1, 2.93, 16.6, 3_931, 2_864, 2.42, 88.83, 5.23),
    dividend: div(0.051425, 0.21, 5.23, "2026-05-20", "2026-05-21", "2026-06-09", 88.83),
    marketLeader: leaderMeta(12, 13, 11, adxLeaderSource),
  },
  {
    symbol: "ADNOCGAS",
    prices: price(3.43, 3.35, 0.08, 2.388, 3.43, 3.32, 3.95, 2.85, 116_074_678, 397_138_890.1, 1_521, 263_257_377_501, "2026-05-27"),
    fundamentals: fund(14.4, 0.24, -2.1, 20.18, 27.84, 65.66, -6.8, 18.28, -2.1, 6_091, 2_568, 0, 88.31, 5.23),
    dividend: div(0.045, 0.18, 5.23, "2026-05-19", "2026-05-20", "2026-06-05", 88.31),
    marketLeader: leaderMeta(1, 3, 1, adxLeaderSource),
  },
  {
    symbol: "ADNOCDRILL",
    prices: price(5.96, 5.96, 0, 0, 6.03, 5.94, 6.35, 4.1, 50_237_200, 299_479_822.85, 1_366, 95_360_000_000, "2026-05-27"),
    fundamentals: fund(17.83, 0.33, 6.2, 35.49, 29.31, 18.22, 14.9, 5.34, 6, 2_145, 1_339, 0.47, 71.79, 4.04),
    dividend: div(0.060252, 0.24, 4.04, "2026-05-14", "2026-05-15", "2026-06-06", 71.79),
    marketLeader: leaderMeta(4, 7, 3, adxLeaderSource),
  },
  {
    symbol: "FAB",
    prices: price(16.8, 16.92, -0.12, -0.709, 17.24, 16.8, 17.76, 12.9, 15_570_599, 262_190_048.26, 1_147, 185_599_893_158, "2026-05-27"),
    fundamentals: fund(9.12, 1.84, 17.4, 15.75, 60.63, 33.55, 16.3, 20.34, 16.5, -20_112, -21_000, 1.82, 42.85, 4.76),
    dividend: div(0.8, 0.8, 4.76, "2026-03-17", "2026-03-18", "2026-04-10", 42.85),
    marketLeader: leaderMeta(3, 4, 4, adxLeaderSource),
  },
  {
    symbol: "ADCB",
    prices: price(13.7, 13.42, 0.28, 2.086, 13.88, 13.56, 14.35, 9.95, 15_693_492, 215_153_711.84, 1_429, 108_396_807_227, "2026-05-27"),
    fundamentals: fund(8.89, 1.54, 27.6, 15.48, 58.67, 20.01, 16.8, 11.74, 27.1, -56_460, -56_458, 1.66, 45.35, 4.6),
    dividend: div(0.63, 0.63, 4.6, "2026-03-11", "2026-03-12", "2026-04-02", 45.35),
    marketLeader: leaderMeta(5, 6, 5, adxLeaderSource),
  },
  {
    symbol: "ADIB",
    prices: price(20.46, 19.52, 0.94, 4.816, 20.46, 20.2, 21.3, 14.2, 7_177_811, 146_595_957.34, 1_427, 74_310_720_000, "2026-05-27"),
    fundamentals: fund(11.54, 1.77, 13.3, 25.21, 54.07, 11.91, 14.8, 6.44, 12.2, -43_131, -43_417, 0.21, 56.99, 4.74),
    dividend: div(0.9705, 0.97, 4.74, "2026-03-12", "2026-03-13", "2026-04-03", 56.99),
    marketLeader: leaderMeta(7, 9, 6, adxLeaderSource),
  },
  {
    symbol: "ADNIC",
    prices: price(7.4, 7.4, 0, 0, 7.41, 7.38, 8.1, 5.75, 4_438, 32_804.71, 7, 4_218_000_000, "2026-05-27"),
    fundamentals: fund(9.32, 0.79, 4.6, 12.99, 4.24, 10.66, -13.2, 0.45252, 4.6, 226.64, 199.15, 0.18, 59.2, 6.35),
    dividend: div(0.47, 0.47, 6.35, "2026-03-17", "2026-03-18", "2026-04-09", 59.2),
  },
];

const leaderSeeds: StockSeed[] = [
  leaderSeed({
    symbol: "EMAARDEV",
    prices: price(14.44, 13.86, 0.58, 4.185, 14.56, 14.14, 20.7, 11.6, 9_804_959, 141_470_450.92, 819, 57_760_000_000, "2026-05-25"),
    revenueBn: 29.32,
    combinedRank: 4,
    marketCapRank: 4,
    tradeValueRank: 4,
    source: dfmLeaderSource,
    dividendYield: 5.2,
    pe: 7.8,
    roe: 28.5,
    netMargin: 34,
    revenueGrowth: 20,
    netProfitGrowth: 22,
    debtToEquity: 0.35,
  }),
  leaderSeed({
    symbol: "MASQ",
    prices: price(244, 241.9, 2.1, 0.868, 244, 241.9, 298, 198.5, 980, 237_857.3, 24, 48_948_798_520, "2026-05-25"),
    revenueBn: 12.42,
    combinedRank: 19,
    marketCapRank: 7,
    tradeValueRank: 37,
    source: dfmLeaderSource,
    dividendYield: 5.1,
    pe: 8.2,
    roe: 18.8,
    netMargin: 39,
    revenueGrowth: 6.5,
    netProfitGrowth: 8,
    debtToEquity: 1.05,
  }),
  leaderSeed({
    symbol: "AIRARABIA",
    prices: price(4.88, 4.85, 0.03, 0.619, 5.08, 4.88, 5.66, 3.05, 14_462_452, 71_191_260.95, 905, 22_773_496_000, "2026-05-25"),
    revenueBn: 7.81,
    combinedRank: 9,
    marketCapRank: 11,
    tradeValueRank: 8,
    source: dfmLeaderSource,
    dividendYield: 4.6,
    pe: 10.8,
    roe: 23,
    netMargin: 17,
    revenueGrowth: 15,
    netProfitGrowth: 14,
    debtToEquity: 0.62,
  }),
  leaderSeed({
    symbol: "PARKIN",
    prices: price(5.75, 5.55, 0.2, 3.604, 5.78, 5.56, 6.79, 4.38, 2_520_721, 14_412_061.09, 733, 17_250_000_000, "2026-05-25"),
    revenueBn: 1.42,
    combinedRank: 10,
    marketCapRank: 12,
    tradeValueRank: 14,
    source: dfmLeaderSource,
    dividendYield: 4.4,
    pe: 24,
    roe: 31,
    netMargin: 34,
    revenueGrowth: 12,
    netProfitGrowth: 13,
    debtToEquity: 0.48,
  }),
  leaderSeed({
    symbol: "DUBAIRESI",
    prices: price(1.23, 1.16, 0.07, 6.034, 1.23, 1.17, 1.47, 1.09, 9_203_043, 11_117_109.07, 374, 15_990_000_000, "2026-05-25"),
    revenueBn: 1.95,
    combinedRank: 13,
    marketCapRank: 14,
    tradeValueRank: 17,
    source: dfmLeaderSource,
    dividendYield: 6.4,
    pe: 13.5,
    roe: 11.8,
    netMargin: 48,
    revenueGrowth: 8.5,
    netProfitGrowth: 7.8,
    debtToEquity: 0.72,
  }),
  leaderSeed({
    symbol: "DIC",
    prices: price(3.66, 3.69, -0.03, -0.813, 3.79, 3.66, 4.35, 2.2, 3_184_739, 11_800_857.29, 275, 15_562_391_681.1, "2026-05-25"),
    revenueBn: 3.74,
    combinedRank: 14,
    marketCapRank: 16,
    tradeValueRank: 15,
    source: dfmLeaderSource,
    dividendYield: 4.8,
    pe: 9.5,
    roe: 13.4,
    netMargin: 26,
    revenueGrowth: 9,
    netProfitGrowth: 8.5,
    debtToEquity: 0.8,
  }),
  leaderSeed({
    symbol: "DFM",
    prices: price(1.45, 1.44, 0.01, 0.694, 1.47, 1.45, 1.84, 1.31, 2_480_849, 3_608_796.23, 232, 11_600_000_000, "2026-05-25"),
    revenueBn: 0.884,
    combinedRank: 17,
    marketCapRank: 17,
    tradeValueRank: 24,
    source: dfmLeaderSource,
    dividendYield: 4.7,
    pe: 18.2,
    roe: 22,
    netMargin: 46,
    revenueGrowth: 17,
    netProfitGrowth: 18,
    debtToEquity: 0.05,
  }),
  leaderSeed({
    symbol: "GULFNAV",
    prices: price(2.89, 2.82, 0.07, 2.482, 2.94, 2.83, 10, 1.6, 7_096_479, 20_423_672.7, 545, 9_219_833_736.32, "2026-05-25"),
    revenueBn: 0.35,
    combinedRank: 11,
    marketCapRank: 18,
    tradeValueRank: 12,
    source: dfmLeaderSource,
    dividendYield: 0.6,
    pe: 22,
    roe: 8.5,
    netMargin: 14,
    revenueGrowth: 11,
    netProfitGrowth: 9,
    debtToEquity: 1.35,
  }),
  leaderSeed({
    symbol: "GFH",
    prices: price(2.16, 2.13, 0.03, 1.408, 2.19, 2.15, 2.34, 1.03, 15_278_959, 32_994_861.5, 354, 8_278_402_690.08, "2026-05-25"),
    revenueBn: 1.54,
    combinedRank: 12,
    marketCapRank: 20,
    tradeValueRank: 10,
    source: dfmLeaderSource,
    dividendYield: 4.1,
    pe: 11.8,
    roe: 14.4,
    netMargin: 28,
    revenueGrowth: 12,
    netProfitGrowth: 11,
    debtToEquity: 0.92,
  }),
  leaderSeed({
    symbol: "ALEC",
    prices: price(1.47, 1.35, 0.12, 8.889, 1.47, 1.4, 1.85, 1.24, 15_217_178, 22_018_544.99, 515, 7_350_000_000, "2026-05-25"),
    revenueBn: 14.75,
    combinedRank: 15,
    marketCapRank: 22,
    tradeValueRank: 11,
    source: dfmLeaderSource,
    dividendYield: 1.1,
    pe: 18.5,
    roe: 16.2,
    netMargin: 6.8,
    revenueGrowth: 17,
    netProfitGrowth: 12,
    debtToEquity: 0.78,
  }),
  leaderSeed({
    symbol: "DTC",
    prices: price(2.1, 2.04, 0.06, 2.941, 2.11, 2.04, 2.89, 1.97, 5_055_021, 10_559_539.03, 391, 5_250_000_000, "2026-05-25"),
    revenueBn: 2.44,
    combinedRank: 18,
    marketCapRank: 25,
    tradeValueRank: 18,
    source: dfmLeaderSource,
    dividendYield: 5.2,
    pe: 14.8,
    roe: 18.6,
    netMargin: 19,
    revenueGrowth: 8,
    netProfitGrowth: 9,
    debtToEquity: 0.52,
  }),
  leaderSeed({
    symbol: "TABREED",
    prices: price(2.68, 2.54, 0.14, 5.512, 2.68, 2.54, 3.33, 2.49, 1_583_529, 4_211_408.53, 109, 7_625_326_467.6, "2026-05-25"),
    revenueBn: 2.48,
    combinedRank: 20,
    marketCapRank: 21,
    tradeValueRank: 23,
    source: dfmLeaderSource,
    dividendYield: 4.9,
    pe: 12.8,
    roe: 10.8,
    netMargin: 23,
    revenueGrowth: 6,
    netProfitGrowth: 6.5,
    debtToEquity: 1.05,
  }),
  leaderSeed({
    symbol: "IHC",
    prices: price(389, 389, 0, 0, 390, 389, 404, 380.1, 183_791, 71_494_699, 15, 848_460_000_000, "2026-05-25"),
    revenueBn: 119.24,
    combinedRank: 6,
    marketCapRank: 1,
    tradeValueRank: 12,
    source: adxLeaderSource,
    dividendYield: 0.2,
    pe: 32,
    roe: 12,
    netMargin: 13,
    revenueGrowth: 18,
    netProfitGrowth: 12,
    debtToEquity: 0.85,
  }),
  leaderSeed({
    symbol: "TAQA",
    prices: price(2.37, 2.2699, 0.1001, 4.41, 2.38, 2.28, 3.9, 2.17, 1_148_852, 2_722_779.24, 96, 266_470_000_000, "2026-05-25"),
    revenueBn: 54.42,
    combinedRank: 14,
    marketCapRank: 2,
    tradeValueRank: 32,
    source: adxLeaderSource,
    dividendYield: 3.6,
    pe: 18,
    roe: 8.8,
    netMargin: 11,
    revenueGrowth: 4.5,
    netProfitGrowth: 4,
    debtToEquity: 1.85,
  }),
  leaderSeed({
    symbol: "BOROUGE",
    prices: price(2.53, 2.5099, 0.0201, 0.8, 2.53, 2.51, 2.68, 2.39, 11_521_490, 29_149_369.7, 960, 75_470_000_000, "2026-05-25"),
    revenueBn: 20.58,
    combinedRank: 11,
    marketCapRank: 8,
    tradeValueRank: 16,
    source: adxLeaderSource,
    dividendYield: 6.2,
    pe: 17.5,
    roe: 19,
    netMargin: 15,
    revenueGrowth: 5.5,
    netProfitGrowth: 6.5,
    debtToEquity: 0.55,
  }),
  leaderSeed({
    symbol: "ALPHADHABI",
    prices: price(7.33, 7.1997, 0.1303, 1.81, 7.43, 7.25, 12.74, 6.75, 13_812_130, 101_242_912.9, 1_151, 73_300_000_000, "2026-05-25"),
    revenueBn: 80.14,
    combinedRank: 9,
    marketCapRank: 10,
    tradeValueRank: 10,
    source: adxLeaderSource,
    dividendYield: 1.2,
    pe: 21,
    roe: 11.5,
    netMargin: 10,
    revenueGrowth: 14,
    netProfitGrowth: 10,
    debtToEquity: 0.7,
  }),
  leaderSeed({
    symbol: "ALDAR",
    prices: price(7.8, 7.7697, 0.0303, 0.39, 8.05, 7.8, 11.8, 7.03, 16_665_440, 129_990_432, 1_389, 61_330_000_000, "2026-05-25"),
    revenueBn: 34.76,
    combinedRank: 8,
    marketCapRank: 11,
    tradeValueRank: 8,
    source: adxLeaderSource,
    dividendYield: 2.6,
    pe: 10.2,
    roe: 16.5,
    netMargin: 24,
    revenueGrowth: 18,
    netProfitGrowth: 17,
    debtToEquity: 0.9,
  }),
  leaderSeed({
    symbol: "MODON",
    prices: price(3.04, 2.95, 0.09, 3.05, 3.04, 2.99, 3.99, 2.84, 1_784_407, 5_424_597.28, 149, 49_700_000_000, "2026-05-25"),
    revenueBn: 10.87,
    combinedRank: 16,
    marketCapRank: 12,
    tradeValueRank: 26,
    source: adxLeaderSource,
    dividendYield: 0.8,
    pe: 24,
    roe: 10.2,
    netMargin: 16,
    revenueGrowth: 22,
    netProfitGrowth: 18,
    debtToEquity: 0.95,
  }),
  leaderSeed({
    symbol: "ADNOCLS",
    prices: price(5.99, 5.7998, 0.1902, 3.28, 5.99, 5.81, 6.22, 4.12, 22_223_290, 133_117_507.1, 1_852, 44_280_000_000, "2026-05-25"),
    revenueBn: 18.06,
    combinedRank: 10,
    marketCapRank: 14,
    tradeValueRank: 7,
    source: adxLeaderSource,
    dividendYield: 3.8,
    pe: 18.8,
    roe: 22,
    netMargin: 18,
    revenueGrowth: 14,
    netProfitGrowth: 15,
    debtToEquity: 0.58,
  }),
  leaderSeed({
    symbol: "FERTIGLB",
    prices: price(3.35, 3.46, -0.11, -3.18, 3.47, 3.29, 3.85, 2.32, 9_146_575, 30_641_026.25, 762, 27_430_000_000, "2026-05-25"),
    revenueBn: 11.2,
    combinedRank: 13,
    marketCapRank: 17,
    tradeValueRank: 15,
    source: adxLeaderSource,
    dividendYield: 5.8,
    pe: 16.5,
    roe: 16,
    netMargin: 12,
    revenueGrowth: -3,
    netProfitGrowth: -5,
    debtToEquity: 0.6,
  }),
  leaderSeed({
    symbol: "2POINTZERO",
    prices: price(2.13, 2.1, 0.03, 1.43, 2.17, 2.12, 3.42, 1.63, 8_425_878, 17_947_120.14, 702, 23_860_000_000, "2026-05-25"),
    revenueBn: 16.43,
    combinedRank: 15,
    marketCapRank: 19,
    tradeValueRank: 18,
    source: adxLeaderSource,
    dividendYield: 0.2,
    pe: 28,
    roe: 10.5,
    netMargin: 11,
    revenueGrowth: 19,
    netProfitGrowth: 11,
    debtToEquity: 0.5,
  }),
  leaderSeed({
    symbol: "ADPORTS",
    prices: price(4.54, 4.5098, 0.0302, 0.67, 4.6, 4.48, 5.52, 3.49, 3_300_913, 14_986_145.02, 275, 23_100_000_000, "2026-05-25"),
    revenueBn: 21.92,
    combinedRank: 17,
    marketCapRank: 20,
    tradeValueRank: 20,
    source: adxLeaderSource,
    dividendYield: 0.8,
    pe: 22,
    roe: 9.5,
    netMargin: 11,
    revenueGrowth: 18,
    netProfitGrowth: 13,
    debtToEquity: 1.05,
  }),
  leaderSeed({
    symbol: "AMR",
    prices: price(1.97, 1.85, 0.12, 6.49, 1.98, 1.87, 2.37, 1.55, 8_623_820, 16_988_925.4, 719, 16_550_000_000, "2026-05-25"),
    revenueBn: 9.5,
    combinedRank: 18,
    marketCapRank: 24,
    tradeValueRank: 19,
    source: adxLeaderSource,
    dividendYield: 3.4,
    pe: 18.4,
    roe: 28,
    netMargin: 9.5,
    revenueGrowth: 7.8,
    netProfitGrowth: 8,
    debtToEquity: 0.82,
  }),
  leaderSeed({
    symbol: "SIB",
    prices: price(2.84, 2.85, -0.01, -0.35, 2.94, 2.83, 3.88, 2.48, 14_855_550, 42_189_762, 1_238, 9_190_000_000, "2026-05-25"),
    revenueBn: 4.2,
    combinedRank: 19,
    marketCapRank: 30,
    tradeValueRank: 13,
    source: adxLeaderSource,
    dividendYield: 5.0,
    pe: 8.9,
    roe: 13.6,
    netMargin: 38,
    revenueGrowth: 8.5,
    netProfitGrowth: 9.2,
    debtToEquity: 1.12,
  }),
  leaderSeed({
    symbol: "PRESIGHT",
    prices: price(3.42, 3.45, -0.03, -0.87, 3.52, 3.41, 4.1, 2.16, 2_752_834, 9_414_692.28, 229, 19_180_000_000, "2026-05-25"),
    revenueBn: 3.16,
    combinedRank: 20,
    marketCapRank: 21,
    tradeValueRank: 24,
    source: adxLeaderSource,
    dividendYield: 0.4,
    pe: 30,
    roe: 14,
    netMargin: 18,
    revenueGrowth: 25,
    netProfitGrowth: 18,
    debtToEquity: 0.22,
  }),
];

const seeds: StockSeed[] = [...coreSeeds, ...leaderSeeds];

export const stocksData: StockRecord[] = seeds.map(createStock);

export const marketLeaderStocks: StockRecord[] = stocksData
  .filter((stock) => stock.marketLeader)
  .sort((a, b) => {
    if (a.market !== b.market) {
      return a.market === "DFM" ? -1 : 1;
    }

    return (a.marketLeader?.combinedRank ?? 999) - (b.marketLeader?.combinedRank ?? 999);
  });

export const DATASET_INFO = {
  brandAr: "منصة الأسهم الإماراتية",
  brandEn: "UAE Stocks Platform",
  snapshotDate: "2026-05-29",
  dailyOverrideUpdatedAt: dailyOverrides.updatedAt ?? null,
  dailyOverrideSource: dailyOverrides.source ?? null,
  dfmSessionDate: "2026-05-25",
  adxSessionDate: "2026-05-25",
  mode: "لقطة ثابتة لقادة سوقي دبي وأبوظبي وليست أسعارا حية",
  coverageNote:
    "تغطي أفضل 20 سهما في DFM وأفضل 20 سهما في ADX وفق رتبة مركبة بين القيمة السوقية وقيمة التداول اليومية، مع إبقاء TECOM وNMDCENR وADNIC من قائمة المتابعة الأصلية.",
  disclaimer:
    "المعلومات المعروضة لأغراض المتابعة والتعليم فقط، ولا تعد توصية شراء أو بيع أو دعوة لاتخاذ قرار استثماري.",
};

export function getStockBySymbol(symbol: string): StockRecord | undefined {
  return stocksData.find((stock) => stock.symbol === symbol.toUpperCase());
}

export function getSectors() {
  return Array.from(new Set(stocksData.map((stock) => stock.sector)));
}

function price(
  last: number,
  previousClose: number,
  change: number,
  changePercent: number,
  high: number,
  low: number,
  high52: number,
  low52: number,
  volume: number,
  tradeValue: number,
  trades: number,
  marketCap: number,
  lastUpdated: string,
): StockRecord["prices"] {
  return { last, previousClose, change, changePercent, high, low, high52, low52, volume, tradeValue, trades, marketCap, lastUpdated };
}

function fund(
  pe: number,
  eps: number,
  epsGrowth: number,
  roe: number,
  netMargin: number,
  revenueBn: number,
  revenueGrowth: number,
  netProfitBn: number,
  netProfitGrowth: number,
  operatingCashFlowMn: number,
  freeCashFlowMn: number,
  debtToEquity: number,
  payoutRatio: number,
  dividendYield: number,
): StockRecord["fundamentals"] {
  return {
    pe,
    eps,
    epsGrowth,
    roe,
    netMargin,
    revenueAED: revenueBn * 1_000_000_000,
    revenueDisplay: `${revenueBn.toLocaleString("en-US", { maximumFractionDigits: 2 })}B AED`,
    revenueGrowth,
    netProfitAED: netProfitBn * 1_000_000_000,
    netProfitDisplay: `${netProfitBn.toLocaleString("en-US", { maximumFractionDigits: 2 })}B AED`,
    netProfitGrowth,
    operatingCashFlowAED: operatingCashFlowMn * 1_000_000,
    freeCashFlowAED: freeCashFlowMn * 1_000_000,
    debtToEquity,
    payoutRatio,
    dividendYield,
  };
}

function div(
  lastAmount: number,
  annualDividend: number,
  yieldPercent: number,
  entitlementDate: string,
  exDate: string,
  paymentDate: string,
  payoutRatio: number,
): StockRecord["dividend"] {
  return { lastAmount, annualDividend, yieldPercent, entitlementDate, exDate, paymentDate, payoutRatio };
}

function leaderMeta(
  combinedRank: number,
  marketCapRank?: number,
  tradeValueRank?: number,
  source?: string,
): StockRecord["marketLeader"] {
  return {
    combinedRank,
    marketCapRank,
    tradeValueRank,
    selection: "ضمن أفضل 20 سهما في السوق وفق رتبة مركبة تجمع القيمة السوقية وقيمة التداول اليومية في اللقطة.",
    source: source ?? "Internal composite market-leader ranking 2026-05-29",
  };
}

function leaderSeed(input: LeaderSeedInput): StockSeed {
  const seedValue = input.symbol.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const pe = input.pe ?? round(12 + (seedValue % 13) * 0.8, 2);
  const dividendYield = input.dividendYield ?? round(2.4 + (seedValue % 8) * 0.42, 2);
  const eps = round(Math.max(input.prices.last / Math.max(pe, 1), 0.001), 3);
  const payoutRatio = dividendYield <= 0 ? 0 : round(clamp(pe * dividendYield, 0, 95), 2);
  const annualDividend = round(input.prices.last * (dividendYield / 100), 4);
  const netMargin = input.netMargin ?? round(10 + (seedValue % 9) * 2.2, 2);
  const revenueGrowth = input.revenueGrowth ?? round(5 + (seedValue % 10) * 1.4, 2);
  const netProfitGrowth = input.netProfitGrowth ?? round(revenueGrowth * 0.9 + ((seedValue % 5) - 2), 2);
  const netProfitBn = round(input.revenueBn * Math.max(netMargin, 1) / 100, 4);
  const operatingCashFlowMn = round(netProfitBn * 1_000 * (1.05 + (seedValue % 5) * 0.03), 2);
  const freeCashFlowMn = round(operatingCashFlowMn * (0.68 + (seedValue % 4) * 0.04), 2);

  return {
    symbol: input.symbol,
    prices: input.prices,
    fundamentals: fund(
      pe,
      eps,
      round(netProfitGrowth * 0.9, 2),
      input.roe ?? round(10 + (seedValue % 11) * 1.25, 2),
      netMargin,
      input.revenueBn,
      revenueGrowth,
      netProfitBn,
      netProfitGrowth,
      operatingCashFlowMn,
      freeCashFlowMn,
      input.debtToEquity ?? round(0.35 + (seedValue % 9) * 0.13, 2),
      payoutRatio,
      dividendYield,
    ),
    dividend: div(
      round(annualDividend / 2, 4),
      annualDividend,
      dividendYield,
      "2026-04-15",
      "2026-04-16",
      "2026-05-06",
      payoutRatio,
    ),
    marketLeader: leaderMeta(input.combinedRank ?? input.marketCapRank, input.marketCapRank, input.tradeValueRank, input.source),
    sourceLabels: [
      input.source,
      "تقديرات أساسيات الأسهم المضافة مشتقة داخليا من القطاع والسعر والقيمة السوقية وليست إفصاحا ماليا مباشرا أو توصية.",
    ],
  };
}

function createStock(seed: StockSeed): StockRecord {
  const seedWithOverride = applyPriceOverride(seed);
  const config = stocksConfig.find((stock) => stock.symbol === seedWithOverride.symbol);
  if (!config) {
    throw new Error(`Missing stock config for ${seedWithOverride.symbol}`);
  }
  const normalizedDividendYield = deriveDividendYield(seedWithOverride);
  const normalizedFundamentals = {
    ...seedWithOverride.fundamentals,
    dividendYield: normalizedDividendYield,
  };
  const normalizedDividend = {
    ...seedWithOverride.dividend,
    yieldPercent: normalizedDividendYield,
  };
  const normalizedSeed = {
    ...seedWithOverride,
    fundamentals: normalizedFundamentals,
    dividend: normalizedDividend,
  };

  const base: Omit<StockRecord, "historicalPrices" | "historicalDividends" | "swot" | "modelTarget" | "sourceLabels"> = {
    ...config,
    prices: normalizedSeed.prices,
    fundamentals: normalizedSeed.fundamentals,
    dividend: normalizedSeed.dividend,
    marketLeader: normalizedSeed.marketLeader,
  };

  const withHistory = {
    ...base,
    historicalPrices: buildPriceHistory(normalizedSeed),
    historicalDividends: buildDividendHistory(normalizedSeed),
    sourceLabels: [
      `${config.market} snapshot ${normalizedSeed.prices.lastUpdated}`,
      "Fundamentals snapshot from local 2026-05-29 dataset",
      modelSource,
      ...(normalizedSeed.sourceLabels ?? []),
    ],
  };

  const modelTarget = buildModelTarget(withHistory);
  const swot = buildSwot(withHistory);

  return {
    ...withHistory,
    swot,
    modelTarget,
  };
}

function applyPriceOverride(seed: StockSeed): StockSeed {
  const override = dailyPriceOverrides[seed.symbol];
  if (!override) return seed;

  const previousClose = numberOr(override.previousClose, seed.prices.previousClose);
  const last = numberOr(override.last, seed.prices.last);
  const change = numberOr(override.change, last - previousClose);
  const changePercent = numberOr(
    override.changePercent,
    previousClose > 0 ? ((last - previousClose) / previousClose) * 100 : seed.prices.changePercent,
  );

  return {
    ...seed,
    prices: {
      ...seed.prices,
      ...override,
      last,
      previousClose,
      change: round(change, 4),
      changePercent: round(changePercent, 4),
      high: numberOr(override.high, Math.max(seed.prices.high, last)),
      low: numberOr(override.low, Math.min(seed.prices.low, last)),
      high52: numberOr(override.high52, Math.max(seed.prices.high52, last)),
      low52: numberOr(override.low52, Math.min(seed.prices.low52, last)),
      volume: numberOr(override.volume, seed.prices.volume),
      tradeValue: numberOr(override.tradeValue, seed.prices.tradeValue),
      trades: numberOr(override.trades, seed.prices.trades),
      marketCap: numberOr(override.marketCap, seed.prices.marketCap),
      lastUpdated: override.lastUpdated ?? dailyOverrides.updatedAt?.slice(0, 10) ?? seed.prices.lastUpdated,
    },
    sourceLabels: [
      `Daily market override: ${override.source ?? dailyOverrides.source ?? "configured update feed"}`,
      ...(seed.sourceLabels ?? []),
    ],
  };
}

function deriveDividendYield(seed: StockSeed): number {
  if (seed.prices.last <= 0 || seed.dividend.annualDividend <= 0) {
    return seed.fundamentals.dividendYield;
  }

  return round((seed.dividend.annualDividend / seed.prices.last) * 100, 2);
}

function numberOr(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function buildPriceHistory(seed: StockSeed): HistoricalPoint[] {
  const labels = ["يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر", "يناير", "فبراير", "مارس", "أبريل", "مايو"];
  const baseDate = new Date(Date.UTC(2025, 5, 1));
  const codeSeed = seed.symbol.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const trend = clamp((seed.fundamentals.revenueGrowth + seed.fundamentals.netProfitGrowth + seed.prices.changePercent) / 300, -0.12, 0.16);
  const range = Math.max(seed.prices.high52 - seed.prices.low52, seed.prices.last * 0.08);

  return labels.map((label, index) => {
    const wave = Math.sin((index + codeSeed % 7) * 0.9) * range * 0.12;
    const drift = (index - (labels.length - 1)) * seed.prices.last * trend * 0.08;
    const rawPrice = index === labels.length - 1 ? seed.prices.last : seed.prices.last + wave + drift;
    const priceValue = clamp(rawPrice, seed.prices.low52, seed.prices.high52);
    const volumeWave = 0.78 + ((codeSeed + index * 17) % 41) / 100;
    const date = new Date(Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth() + index, 1)).toISOString().slice(0, 10);

    return {
      date,
      label,
      price: round(priceValue, 3),
      volume: Math.max(1, Math.round(seed.prices.volume * volumeWave)),
    };
  });
}

function buildDividendHistory(seed: StockSeed): DividendPoint[] {
  const exDate = new Date(`${seed.dividend.exDate}T00:00:00Z`);
  const paymentDate = new Date(`${seed.dividend.paymentDate}T00:00:00Z`);
  const growthBias = clamp(seed.fundamentals.netProfitGrowth / 100, -0.12, 0.18);

  return [2023, 2024, 2025, 2026].map((year, index) => {
    const scale = 0.86 + index * 0.045 + growthBias * 0.25;
    const amount = index === 3 ? seed.dividend.annualDividend : round(seed.dividend.annualDividend * scale, 4);
    const ex = new Date(Date.UTC(year, exDate.getUTCMonth(), exDate.getUTCDate())).toISOString().slice(0, 10);
    const payment = new Date(Date.UTC(year, paymentDate.getUTCMonth(), paymentDate.getUTCDate())).toISOString().slice(0, 10);

    return {
      fiscalYear: year,
      amount,
      yield: round((amount / seed.prices.last) * 100, 2),
      exDate: ex,
      paymentDate: payment,
      source: year === 2026 ? "رسمي" : "نموذج داخلي",
    };
  });
}

function buildModelTarget(stock: Omit<StockRecord, "modelTarget" | "swot">): AnalystTarget {
  const quality =
    (stock.fundamentals.roe - 12) * 0.24 +
    stock.fundamentals.revenueGrowth * 0.11 +
    stock.fundamentals.netProfitGrowth * 0.14 +
    (stock.fundamentals.dividendYield - 4) * 0.9 -
    Math.max(stock.fundamentals.pe - 18, 0) * 0.42 -
    Math.max(stock.fundamentals.payoutRatio - 82, 0) * 0.13 -
    Math.max(stock.fundamentals.debtToEquity - 1.5, 0) * 2;
  const impliedUpside = clamp(quality / 100, -0.16, 0.26);
  const base = round(stock.prices.last * (1 + impliedUpside), 2);
  const low = round(base * 0.88, 2);
  const high = round(base * 1.14, 2);

  return {
    low,
    base,
    high,
    upsidePercent: round(((base / stock.prices.last) - 1) * 100, 2),
    label: impliedUpside > 0.08 ? "نطاق قيمة داخلي" : impliedUpside < -0.05 ? "حذر" : "محايد",
    sourceNote: modelSource,
  };
}

function buildSwot(stock: Omit<StockRecord, "modelTarget" | "swot">): Swot {
  const strengths = [
    `تمركز واضح في قطاع ${stock.sector} مع قيمة سوقية ${formatCompactEnglish(stock.prices.marketCap)} درهم.`,
    stock.fundamentals.roe >= 18
      ? `عائد على حقوق الملكية قوي عند ${stock.fundamentals.roe.toFixed(2)}%.`
      : `ربحية حقوق ملكية قابلة للمتابعة عند ${stock.fundamentals.roe.toFixed(2)}%.`,
    stock.fundamentals.dividendYield >= 5
      ? `عائد نقدي جذاب عند ${stock.fundamentals.dividendYield.toFixed(2)}%.`
      : `سياسة توزيع موجودة مع عائد ${stock.fundamentals.dividendYield.toFixed(2)}%.`,
  ];

  const weaknesses = [
    stock.fundamentals.payoutRatio >= 82
      ? `نسبة توزيع مرتفعة عند ${stock.fundamentals.payoutRatio.toFixed(2)}% تقلل هامش الأمان.`
      : `نسبة التوزيع عند ${stock.fundamentals.payoutRatio.toFixed(2)}% تحتاج مراقبة مع تغير الأرباح.`,
    stock.fundamentals.debtToEquity >= 1.5
      ? `الرافعة المالية مرتفعة نسبيا عند ${stock.fundamentals.debtToEquity.toFixed(2)} مرة.`
      : `الحساسية التشغيلية لا تزال مرتبطة بدورة القطاع رغم رافعة مالية منضبطة.`,
    stock.prices.tradeValue < 5_000_000
      ? "سيولة التداول اليومية منخفضة، ما قد يزيد فجوة التنفيذ للمستثمر الفردي."
      : `حركة السهم اليومية ${stock.prices.changePercent.toFixed(2)}% وقد تزيد التذبذب قصير الأجل.`,
  ];

  return {
    strengths,
    weaknesses,
    opportunities: [
      sectorOpportunity(stock.sector),
      stock.fundamentals.revenueGrowth > 10
        ? `نمو الإيرادات ${stock.fundamentals.revenueGrowth.toFixed(1)}% يدعم توسع المضاعفات إذا استمر.`
        : "تحسن الهوامش أو تخفيض الإنفاق الرأسمالي قد يدعم القراءة القادمة.",
      "إعادة استثمار التوزيعات يمكن أن ترفع العائد التراكمي للمستثمر طويل الأجل.",
    ],
    threats: [
      sectorThreat(stock.sector),
      stock.fundamentals.netProfitGrowth < 0
        ? `تراجع صافي الربح ${Math.abs(stock.fundamentals.netProfitGrowth).toFixed(1)}% يضغط على الزخم.`
        : "أي تباطؤ مفاجئ في نمو الأرباح قد يضغط على التقييم.",
      "البيانات هنا لقطة ثابتة، وأي إفصاح لاحق قد يغير قراءة المخاطر.",
    ],
  };
}

function sectorOpportunity(sector: string): string {
  if (sector.includes("البنوك")) return "ارتفاع جودة الأصول ونمو الودائع منخفضة التكلفة يمكن أن يدعم ربحية القطاع المصرفي.";
  if (sector.includes("الطاقة") || sector.includes("الغاز")) return "العقود طويلة الأجل ومشاريع الطاقة الإقليمية تمنح فرصة لتحسن الرؤية التشغيلية.";
  if (sector.includes("العقار") || sector.includes("مناطق")) return "استمرار الطلب العقاري والإشغال التجاري في دبي قد يدعم التدفقات المتكررة.";
  if (sector.includes("الاتصالات")) return "الخدمات الرقمية والبيانات والمؤسسات توفر مسارات نمو خارج الصوت التقليدي.";
  if (sector.includes("التجارة")) return "توسع الطلبات الرقمية وتحسن اقتصاديات التوصيل قد يرفع جودة الأرباح.";
  return "تحسن الطلب المحلي والتشغيل الكفء يمكن أن يدعم الإيرادات والتدفقات النقدية.";
}

function sectorThreat(sector: string): string {
  if (sector.includes("البنوك")) return "تغير أسعار الفائدة أو تكلفة المخاطر قد يضغط على الهوامش وجودة الأصول.";
  if (sector.includes("الطاقة") || sector.includes("الغاز")) return "هبوط أسعار الطاقة أو تأخر المشاريع قد يضغط على الإيرادات والتدفقات.";
  if (sector.includes("العقار") || sector.includes("مناطق")) return "تباطؤ العقار أو ارتفاع الفائدة قد يؤثر في المبيعات والتقييم.";
  if (sector.includes("الاتصالات")) return "المنافسة التنظيمية والتسعيرية قد تحد من توسع الهوامش.";
  if (sector.includes("التأمين")) return "ارتفاع المطالبات أو ضعف عوائد الاستثمار قد يضغط على نتائج الاكتتاب.";
  return "التقلبات الاقتصادية والسيولة المنخفضة قد تزيد حساسية السعر قصير الأجل.";
}

function formatCompactEnglish(value: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(value);
}

function round(value: number, digits = 2): number {
  return Number(value.toFixed(digits));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
