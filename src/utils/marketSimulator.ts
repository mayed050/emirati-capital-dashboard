import type { StockRecord } from "@/types";

/**
 * دالة للتحقق مما إذا كانت أوقات التداول الرسمية في الإمارات (GST - UTC+4) مفتوحة حالياً.
 * ساعات تداول أسواق DFM و ADX: من الاثنين إلى الجمعة، 10:00 صباحاً حتى 3:00 مساءً بتوقيت دبي.
 */
export function isGstMarketOpen(dateOverride?: Date): boolean {
  // استخدام التاريخ الحالي أو التاريخ الممرر للاختبار
  const now = dateOverride || new Date();
  
  // تحويل التوقيت الحالي لتوقيت دبي (GST / UTC+4)
  const gstString = now.toLocaleString("en-US", { timeZone: "Asia/Dubai" });
  const gstDate = new Date(gstString);
  
  const day = gstDate.getDay(); // 0: Sunday, 1: Monday, ..., 5: Friday, 6: Saturday
  const hour = gstDate.getHours();
  const minutes = gstDate.getMinutes();

  // الأسواق الإماراتية مغلقة يومي السبت والأحد (6 و 0)
  if (day === 0 || day === 6) {
    return false;
  }

  // التداول الرسمي يبدأ من 10:00 صباحاً وينتهي في 3:00 مساءً (15:00)
  const timeInMinutes = hour * 60 + minutes;
  const startInMinutes = 10 * 60; // 10:00 AM
  const endInMinutes = 15 * 60;   // 3:00 PM

  return timeInMinutes >= startInMinutes && timeInMinutes < endInMinutes;
}

/**
 * دالة لمحاكاة تأرجح عشوائي خاضع للتحكم (Random Walk) لسعر سهم فردي.
 * يحدد اتجاه الحركة السعرية ومقدار التأرجح (بين -0.5% إلى +0.5% عند كل نبضة).
 */
export function tickSingleStock(stock: StockRecord, forceSim = false): {
  stock: StockRecord;
  direction: "up" | "down" | "none";
} {
  // لا نقوم بالتحديث إذا كان السوق مغلقاً ولم يتم إجبار المحاكاة 24/7
  if (!isGstMarketOpen() && !forceSim) {
    return { stock, direction: "none" };
  }

  const currentPrice = stock.prices.last;
  const previousClose = stock.prices.previousClose || currentPrice;

  // نسبة تذبذب عشوائية بين -0.3% إلى +0.35% لضمان حيوية السوق
  const percentChange = (Math.random() * 0.65 - 0.3) / 100;
  const priceShift = currentPrice * percentChange;
  
  // تأمين ألا يقل السعر عن 0.05 درهم
  const newPrice = Math.max(Number((currentPrice + priceShift).toFixed(4)), 0.05);
  const change = Number((newPrice - previousClose).toFixed(4));
  const changePercent = Number(((change / previousClose) * 100).toFixed(4));
  
  // تحديد اتجاه التأرجح للمؤشر البصري
  const direction = newPrice > currentPrice ? "up" : newPrice < currentPrice ? "down" : "none";

  // محاكاة زيادة في حجم وقيمة التداول
  const additionalVolume = Math.floor(Math.random() * 8000) + 500;
  const additionalValue = additionalVolume * newPrice;

  const updatedRecord: StockRecord = {
    ...stock,
    prices: {
      ...stock.prices,
      last: newPrice,
      change,
      changePercent,
      high: Math.max(stock.prices.high, newPrice),
      low: Math.min(stock.prices.low, newPrice),
      // high52/low52 are historical annual ranges — never update via simulator
      high52: stock.prices.high52,
      low52: stock.prices.low52,
      volume: stock.prices.volume + additionalVolume,
      tradeValue: Number((stock.prices.tradeValue + additionalValue).toFixed(2)),
      trades: stock.prices.trades + (Math.random() > 0.6 ? 1 : 0),
      lastUpdated: new Date().toLocaleTimeString("ar-AE", { hour12: false }),
    },
    // مزامنة عائد التوزيع التلقائي مع السعر الجديد المتأرجح
    fundamentals: {
      ...stock.fundamentals,
      dividendYield: stock.dividend.annualDividend > 0
        ? Number(((stock.dividend.annualDividend / newPrice) * 100).toFixed(2))
        : 0,
    }
  };

  return { stock: updatedRecord, direction };
}

/**
 * دالة لتطبيق محاكي الأسعار على مصفوفة الأسهم بالكامل.
 */
export function tickDataset(stocks: StockRecord[], forceSim = false): {
  stocks: StockRecord[];
  directions: Record<string, "up" | "down" | "none">;
} {
  const directions: Record<string, "up" | "down" | "none"> = {};
  
  const updatedStocks = stocks.map((stock) => {
    // 82% فقط من الأسهم تتحرك عند كل ثانية للحفاظ على واقعية شاشة التداول
    if (Math.random() > 0.82 && !forceSim) {
      directions[stock.symbol] = "none";
      return stock;
    }
    
    const result = tickSingleStock(stock, forceSim);
    directions[stock.symbol] = result.direction;
    return result.stock;
  });

  return { stocks: updatedStocks, directions };
}
