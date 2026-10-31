"use client";

import { isStaleQuote } from "@/data/stocksData";
import { useLanguage } from "@/context/languageContext";
import type { StockRecord } from "@/types";

export function StaleQuoteNote({ stock }: { stock: StockRecord }) {
  const { language } = useLanguage();
  if (!isStaleQuote(stock)) return null;

  return (
    <span className="mt-1 block whitespace-nowrap text-xs font-bold text-amber-500">
      {language === "ar" ? "آخر سعر متاح:" : "Last available:"} {stock.prices.lastUpdated}
    </span>
  );
}
