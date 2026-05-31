"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Bell, Plus, Trash2, Volume2 } from "lucide-react";
import { stocksData } from "@/data/stocksData";
import { formatCurrency } from "@/lib/format";
import { useLanguage } from "@/context/languageContext";
import type { StockSymbol } from "@/types";

export interface PriceAlert {
  id: string;
  symbol: StockSymbol;
  condition: "ABOVE" | "BELOW";
  targetPrice: number;
  active: boolean;
  createdAt: string;
  triggeredAt?: string;
}

export function playChime() {
  if (typeof window === "undefined" || !window.AudioContext) return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    
    // Create synthesizer node chains
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = "sine";
    // Standard high-fidelity chime slide: 880Hz (A5) -> 1320Hz (E6)
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.7);
  } catch {}
}

export function AlertManager() {
  const { t, language } = useLanguage();
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [symbol, setSymbol] = useState<StockSymbol>("DEWA");
  const [condition, setCondition] = useState<"ABOVE" | "BELOW">("ABOVE");
  const [targetPrice, setTargetPrice] = useState("2.60");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("emirati-capital:price-alerts");
    if (saved) {
      try {
        setAlerts(JSON.parse(saved));
      } catch {}
    }
  }, []);

  const saveAlerts = (updatedAlerts: PriceAlert[]) => {
    setAlerts(updatedAlerts);
    localStorage.setItem("emirati-capital:price-alerts", JSON.stringify(updatedAlerts));
  };

  const addAlert = () => {
    const priceNum = Number(targetPrice);
    if (!priceNum || priceNum <= 0) {
      setMessage(language === "ar" ? "أدخل سعراً مستهدفاً صحيحاً." : "Enter a valid target price.");
      return;
    }
    const newAlert: PriceAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      symbol,
      condition,
      targetPrice: priceNum,
      active: true,
      createdAt: new Date().toISOString(),
    };
    const updated = [newAlert, ...alerts];
    saveAlerts(updated);
    setMessage(language === "ar" ? "تمت إضافة التنبيه السعري بنجاح." : "Price alert added successfully.");
    
    // Quick test play chime to let the user hear it
    playChime();
    
    setTimeout(() => setMessage(""), 3000);
  };

  const deleteAlert = (id: string) => {
    const updated = alerts.filter((alert) => alert.id !== id);
    saveAlerts(updated);
  };

  return (
    <div className="glass-panel rounded-lg p-5">
      <div className="flex justify-between items-center gap-2 border-b border-slate-100 pb-3 mb-4">
        <h2 className="text-xl font-black text-slate-950 flex items-center gap-2">
          <Bell className="text-sky-500 animate-bounce" size={20} />
          {t("alertManager")}
        </h2>
        <button 
          onClick={playChime} 
          className="text-xs font-black bg-sky-500/10 text-sky-600 rounded-lg px-2.5 py-1 flex items-center gap-1 hover:bg-sky-500/20"
          title={language === "ar" ? "اختبر نغمة التنبيه" : "Test Alarm Chime"}
        >
          <Volume2 size={14} />
          {language === "ar" ? "تجربة الصوت" : "Test Sound"}
        </button>
      </div>
      <p className="text-xs text-slate-500 mb-4">{t("alertSubtitle")}</p>

      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-1 mb-4 bg-slate-50 rounded-xl p-4 border border-slate-100">
        <label className="grid gap-1 text-xs font-black text-slate-600">
          {t("alertSymbol")}
          <select value={symbol} onChange={(event) => setSymbol(event.target.value as StockSymbol)} className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 font-bold text-sm">
            {stocksData.map((stock) => (
              <option key={stock.symbol} value={stock.symbol}>
                {stock.symbol} - {language === "ar" ? stock.nameAr : stock.nameEn}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-xs font-black text-slate-600">
          {t("alertDirection")}
          <select value={condition} onChange={(event) => setCondition(event.target.value as "ABOVE" | "BELOW")} className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 font-bold text-sm">
            <option value="ABOVE">{t("alertTriggerAbove")}</option>
            <option value="BELOW">{t("alertTriggerBelow")}</option>
          </select>
        </label>

        <label className="grid gap-1 text-xs font-black text-slate-600">
          {t("alertPrice")}
          <input value={targetPrice} onChange={(event) => setTargetPrice(event.target.value)} className="number min-h-10 rounded-lg border border-slate-200 bg-white px-3 font-bold text-sm" inputMode="decimal" />
        </label>
      </div>

      <button 
        type="button" 
        onClick={addAlert} 
        className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-sky-700 px-4 font-black text-white hover:bg-sky-800 transition-all text-xs"
      >
        <Plus size={16} />
        {t("alertAddBtn")}
      </button>
      {message ? <p className="mt-3 rounded-lg bg-emerald-50 p-2.5 text-xs font-bold text-emerald-800 border border-emerald-100">{message}</p> : null}

      <div className="mt-5">
        <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-2 mb-3">{t("activeAlerts")}</h3>
        <div className="grid gap-2 max-h-[220px] overflow-y-auto pr-1">
          {alerts.filter(a => a.active).map((alert) => (
            <div key={alert.id} className="flex justify-between items-center rounded-xl bg-white/70 border border-slate-100 px-3 py-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-black text-slate-900">{alert.symbol}</span>
                <span className={`rounded-full px-2 py-0.5 text-[9px] font-black ${
                  alert.condition === "ABOVE" ? "bg-amber-50 text-amber-600 border border-amber-200" : "bg-sky-50 text-sky-600 border border-sky-200"
                }`}>
                  {alert.condition === "ABOVE" ? ">= " : "<= "} {formatCurrency(alert.targetPrice)} AED
                </span>
              </div>
              <button 
                type="button" 
                onClick={() => deleteAlert(alert.id)} 
                className="text-rose-600 hover:text-rose-800 p-1.5 rounded-lg hover:bg-rose-50"
                title={language === "ar" ? "حذف التنبيه" : "Remove Alert"}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {!alerts.filter(a => a.active).length ? (
            <p className="text-center py-6 text-xs text-slate-400 font-bold">{t("noActiveAlerts")}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
