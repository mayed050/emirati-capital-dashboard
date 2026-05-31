import { useEffect, useState, useRef } from "react";
import { getUnifiedMarketDataset } from "@/lib/data/unified-market-data";
import { tickDataset, isGstMarketOpen } from "@/utils/marketSimulator";
import type { StockRecord } from "@/types";

export type MarketState = {
  stocks: StockRecord[];
  directions: Record<string, "up" | "down" | "none">;
  isMarketOpen: boolean;
  forceSim: boolean;
  toggleForceSim: () => void;
};

// إنشاء متغير عالمي منفرد (Global Singleton State) للحفاظ على تيار أسعار موحد
// عبر شتى الصفحات والمكونات لتفادي إعادة التوليد والتضارب.
let globalStocks: StockRecord[] = [];
const globalListeners = new Set<(state: { stocks: StockRecord[]; directions: Record<string, "up" | "down" | "none"> }) => void>();
let globalForceSim = false;
let globalTickInterval: NodeJS.Timeout | null = null;
let globalFlashTimeout: NodeJS.Timeout | null = null;

function initializeGlobalState() {
  if (globalStocks.length === 0) {
    const dataset = getUnifiedMarketDataset();
    globalStocks = dataset.stocks;
    
    // شحن تفضيل المستخدم لوضع المحاكاة
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("emirati-capital:force-sim:v1");
      globalForceSim = saved === "true";
    }
    
    startGlobalInterval();
  }
}

function startGlobalInterval() {
  if (globalTickInterval) clearInterval(globalTickInterval);

  globalTickInterval = setInterval(async () => {
    if (globalListeners.size === 0) return;

    let updatedStocks = [...globalStocks];
    let directions: Record<string, "up" | "down" | "none"> = {};

    try {
      // Fetch prices from our unified Next.js API route
      const res = await fetch("/api/market/live-prices");
      if (!res.ok) throw new Error("API failed");
      const data = await res.json();
      const livePrices = data.prices as Record<string, number>;

      if (livePrices && Object.keys(livePrices).length > 0) {
        updatedStocks = globalStocks.map((stock) => {
          const livePrice = livePrices[stock.symbol];
          if (livePrice === undefined || livePrice === stock.prices.last) {
            directions[stock.symbol] = "none";
            return stock;
          }

          const previousClose = stock.prices.previousClose || stock.prices.last;
          const change = Number((livePrice - previousClose).toFixed(4));
          const changePercent = Number(((change / previousClose) * 100).toFixed(4));
          const direction = livePrice > stock.prices.last ? "up" : "down";
          directions[stock.symbol] = direction;

          const additionalVolume = Math.floor(Math.random() * 4000) + 200;
          const additionalValue = additionalVolume * livePrice;

          return {
            ...stock,
            prices: {
              ...stock.prices,
              last: livePrice,
              change,
              changePercent,
              high: Math.max(stock.prices.high, livePrice),
              low: Math.min(stock.prices.low, livePrice),
              volume: stock.prices.volume + additionalVolume,
              tradeValue: Number((stock.prices.tradeValue + additionalValue).toFixed(2)),
              lastUpdated: new Date().toLocaleTimeString("ar-AE", { hour12: false }),
            },
            fundamentals: {
              ...stock.fundamentals,
              dividendYield: stock.dividend.annualDividend > 0
                ? Number(((stock.dividend.annualDividend / livePrice) * 100).toFixed(2))
                : 0,
            }
          };
        });
      }
    } catch (e) {
      // Fallback seamlessly to client-side simulator if API is offline or during SSR build
      const result = tickDataset(globalStocks, globalForceSim);
      updatedStocks = result.stocks;
      directions = result.directions;
    }

    globalStocks = updatedStocks;

    // Check and trigger active price alerts
    if (typeof window !== "undefined") {
      const savedAlerts = localStorage.getItem("emirati-capital:price-alerts");
      if (savedAlerts) {
        try {
          const alerts = JSON.parse(savedAlerts) as any[];
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

    // إرسال الإشارة لكافة المكونات المسجلة للأسعار
    globalListeners.forEach((listener) => listener({ stocks: globalStocks, directions }));

    // تنظيف خلايا الوميض بعد ثانية واحدة لإتاحة إضاءتها من جديد عند النبضة التالية
    if (globalFlashTimeout) clearTimeout(globalFlashTimeout);
    globalFlashTimeout = setTimeout(() => {
      globalListeners.forEach((listener) => listener({ stocks: globalStocks, directions: {} }));
    }, 1000);
  }, 4000); // تحديث حي كل 4 ثوانٍ
}

export function useLiveMarket(): MarketState {
  const [stocks, setStocks] = useState<StockRecord[]>([]);
  const [directions, setDirections] = useState<Record<string, "up" | "down" | "none">>({});
  const [forceSim, setForceSim] = useState(false);
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  
  // تهيئة الحالة عند البدء
  useEffect(() => {
    initializeGlobalState();
    setStocks(globalStocks);
    setForceSim(globalForceSim);
    setIsMarketOpen(isGstMarketOpen());

    const handleUpdate = (update: { stocks: StockRecord[]; directions: Record<string, "up" | "down" | "none"> }) => {
      setStocks(update.stocks);
      setDirections(update.directions);
      setIsMarketOpen(isGstMarketOpen());
    };

    globalListeners.add(handleUpdate);
    
    // تحديث فوري عند التسجيل
    setIsMarketOpen(isGstMarketOpen());

    return () => {
      globalListeners.delete(handleUpdate);
    };
  }, []);

  const toggleForceSim = () => {
    const newValue = !globalForceSim;
    globalForceSim = newValue;
    setForceSim(newValue);
    
    if (typeof window !== "undefined") {
      localStorage.setItem("emirati-capital:force-sim:v1", String(newValue));
    }

    // إرسال وميض فوري عند النقر لتأكيد حيوية الإجراء
    const result = tickDataset(globalStocks, newValue);
    globalStocks = result.stocks;
    globalListeners.forEach((listener) => listener({ stocks: globalStocks, directions: result.directions }));
  };

  return {
    stocks,
    directions,
    isMarketOpen,
    forceSim,
    toggleForceSim,
  };
}
