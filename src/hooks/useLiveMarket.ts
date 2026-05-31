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

  globalTickInterval = setInterval(() => {
    if (globalListeners.size === 0) return;

    // استدعاء محاكي التذبذب السعري
    const result = tickDataset(globalStocks, globalForceSim);
    globalStocks = result.stocks;

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
    globalListeners.forEach((listener) => listener({ stocks: globalStocks, directions: result.directions }));

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
