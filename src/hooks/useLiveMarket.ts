import { useSyncExternalStore } from "react";
import { getUnifiedMarketDataset } from "@/lib/data/unified-market-data";
import { isGstMarketOpen } from "@/utils/marketSimulator";
import type { PriceAlert } from "@/components/AlertManager";
import type { StockRecord } from "@/types";

export type MarketState = {
  stocks: StockRecord[];
  directions: Record<string, "up" | "down" | "none">;
  isMarketOpen: boolean;
  syncMode: "5m" | "10m" | "manual" | "disabled";
  setSyncMode: (mode: "5m" | "10m" | "manual" | "disabled") => void;
  isSyncing: boolean;
  lastSyncedAt: string;
  secondsToNextSync: number;
  triggerSync: () => Promise<void>;
};

type MarketSnapshot = Omit<MarketState, "setSyncMode" | "triggerSync">;

// إنشاء متغير عالمي منفرد (Global Singleton State) للحفاظ على تيار أسعار موحد
// عبر شتى الصفحات والمكونات لتفادي إعادة التوليد والتضارب.
let globalStocks: StockRecord[] = [];
const globalListeners = new Set<() => void>();
let globalCountdownInterval: NodeJS.Timeout | null = null;
let globalFlashTimeout: NodeJS.Timeout | null = null;

let globalSyncMode: "5m" | "10m" | "manual" | "disabled" = "5m";
let globalIsSyncing = false;
let globalLastSyncedAt = "";
let globalSecondsToNextSync = 300;

// Rendered on the server and during hydration: the browser-only state is read once subscribed
const initialSnapshot: MarketSnapshot = {
  stocks: [],
  directions: {},
  isMarketOpen: false,
  syncMode: "5m",
  isSyncing: false,
  lastSyncedAt: "",
  secondsToNextSync: 300,
};
let globalSnapshot = initialSnapshot;

function initializeGlobalState() {
  if (globalStocks.length === 0) {
    const dataset = getUnifiedMarketDataset();
    globalStocks = dataset.stocks;
    
    // شحن تفضيل المستخدم لوضع المزامنة
    if (typeof window !== "undefined") {
      const savedSync = localStorage.getItem("emirati-capital:sync-mode:v1");
      if (savedSyncSyncCheck(savedSync)) {
        globalSyncMode = savedSync;
      } else {
        globalSyncMode = "5m";
      }

      if (globalSyncMode === "5m") globalSecondsToNextSync = 300;
      else if (globalSyncMode === "10m") globalSecondsToNextSync = 600;
      else globalSecondsToNextSync = 0;
    }
    
    if (globalSyncMode === "5m" || globalSyncMode === "10m") {
      fetchLivePrices();
    }
    
    startCountdownInterval();
  }
}

function savedSyncSyncCheck(val: string | null): val is typeof globalSyncMode {
  return val === "5m" || val === "10m" || val === "manual" || val === "disabled";
}

function notifySubscribers(directions: Record<string, "up" | "down" | "none"> = {}) {
  globalSnapshot = {
    stocks: globalStocks,
    directions,
    isMarketOpen: isGstMarketOpen(),
    syncMode: globalSyncMode,
    isSyncing: globalIsSyncing,
    lastSyncedAt: globalLastSyncedAt,
    secondsToNextSync: globalSecondsToNextSync,
  };
  globalListeners.forEach((listener) => listener());
}

async function fetchLivePrices() {
  if (globalIsSyncing) return;
  globalIsSyncing = true;
  notifySubscribers();

  try {
    const res = await fetch("/api/market/live-prices");
    if (!res.ok) throw new Error("API failed");
    const data = await res.json();
    const livePrices = data.prices as Record<string, number>;

    if (livePrices && Object.keys(livePrices).length > 0) {
      const directions: Record<string, "up" | "down" | "none"> = {};
      
      globalStocks = globalStocks.map((stock) => {
        const livePrice = livePrices[stock.symbol];
        if (livePrice === undefined) return stock;

        // السعر لم يتغير: لا توجد بيانات جديدة، فيبقى الاقتباس بتاريخه الفعلي
        if (livePrice === stock.prices.last) {
          directions[stock.symbol] = "none";
          return stock;
        }

        const previousClose = stock.prices.previousClose || stock.prices.last;
        const change = Number((livePrice - previousClose).toFixed(4));
        const changePercent = Number(((change / previousClose) * 100).toFixed(4));
        const direction = livePrice > stock.prices.last ? "up" : (livePrice < stock.prices.last ? "down" : "none");
        directions[stock.symbol] = direction;

        return {
          ...stock,
          prices: {
            ...stock.prices,
            last: livePrice,
            change,
            changePercent,
            high: Math.max(stock.prices.high, livePrice),
            low: Math.min(stock.prices.low, livePrice),
            lastUpdated: new Date().toLocaleDateString("en-CA"),
            // Store timeUpdated as formatted time
            timeUpdated: new Date().toLocaleTimeString("ar-AE", { hour12: false }),
          },
          fundamentals: {
            ...stock.fundamentals,
            dividendYield: stock.dividend.annualDividend > 0
              ? Number(((stock.dividend.annualDividend / livePrice) * 100).toFixed(2))
              : 0,
          }
        };
      });

      globalLastSyncedAt = new Date().toLocaleTimeString("ar-AE", { hour12: false });
      checkAlertsAndTrigger();
      notifySubscribers(directions);

      if (globalFlashTimeout) clearTimeout(globalFlashTimeout);
      globalFlashTimeout = setTimeout(() => {
        notifySubscribers();
      }, 1000);
    }
  } catch (e) {
    console.warn("[useLiveMarket] 5-min live refresh failed:", e);
  } finally {
    globalIsSyncing = false;
    notifySubscribers();
  }
}

function startCountdownInterval() {
  if (globalCountdownInterval) clearInterval(globalCountdownInterval);

  globalCountdownInterval = setInterval(() => {
    if (globalListeners.size === 0) return;
    
    if (globalSyncMode === "5m" || globalSyncMode === "10m") {
      if (globalSecondsToNextSync > 1) {
        globalSecondsToNextSync--;
        notifySubscribers();
      } else {
        globalSecondsToNextSync = globalSyncMode === "5m" ? 300 : 600;
        fetchLivePrices();
      }
    }
  }, 1000);
}

function checkAlertsAndTrigger() {
  if (typeof window !== "undefined") {
    const savedAlerts = localStorage.getItem("emirati-capital:price-alerts");
    if (savedAlerts) {
      try {
        const alerts = JSON.parse(savedAlerts) as PriceAlert[];
        let triggered = false;
        const updatedAlerts = alerts.map((alert) => {
          if (!alert.active) return alert;
          const stock = globalStocks.find((s) => s.symbol === alert.symbol);
          if (!stock) return alert;
          const currentPrice = stock.prices.last;
          let isTriggered = false;
          if (alert.condition === "ABOVE" && currentPrice >= alert.targetPrice) {
            isTriggered = true;
          } else if (alert.condition === "BELOW" && currentPrice <= alert.targetPrice) {
            isTriggered = true;
          }
          if (isTriggered) {
            triggered = true;
            const event = new CustomEvent("emirati-capital:alert-triggered", {
              detail: { symbol: alert.symbol, price: currentPrice, target: alert.targetPrice },
            });
            window.dispatchEvent(event);
            return { ...alert, active: false, triggeredAt: new Date().toISOString() };
          }
          return alert;
        });
        if (triggered) {
          localStorage.setItem("emirati-capital:price-alerts", JSON.stringify(updatedAlerts));
        }
      } catch {}
    }
  }
}

function subscribeToMarket(listener: () => void) {
  initializeGlobalState();
  globalListeners.add(listener);

  if (!globalCountdownInterval) startCountdownInterval();
  notifySubscribers();

  return () => {
    globalListeners.delete(listener);
    if (globalListeners.size === 0) {
      if (globalCountdownInterval) {
        clearInterval(globalCountdownInterval);
        globalCountdownInterval = null;
      }
    }
  };
}

function getMarketSnapshot() {
  return globalSnapshot;
}

function getServerMarketSnapshot() {
  return initialSnapshot;
}

function setSyncMode(newMode: typeof globalSyncMode) {
  globalSyncMode = newMode;
  if (typeof window !== "undefined") {
    localStorage.setItem("emirati-capital:sync-mode:v1", newMode);
  }

  if (newMode === "5m") {
    globalSecondsToNextSync = 300;
  } else if (newMode === "10m") {
    globalSecondsToNextSync = 600;
  } else {
    globalSecondsToNextSync = 0;
  }

  if (newMode === "5m" || newMode === "10m") {
    fetchLivePrices();
  }

  startCountdownInterval();
  notifySubscribers();
}

async function triggerSync() {
  await fetchLivePrices();
  if (globalSyncMode === "5m") {
    globalSecondsToNextSync = 300;
  } else if (globalSyncMode === "10m") {
    globalSecondsToNextSync = 600;
  }
  notifySubscribers();
}

export function useLiveMarket(): MarketState {
  const snapshot = useSyncExternalStore(subscribeToMarket, getMarketSnapshot, getServerMarketSnapshot);
  return { ...snapshot, setSyncMode, triggerSync };
}
