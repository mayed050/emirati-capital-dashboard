"use client";

import { useLiveMarket } from "@/hooks/useLiveMarket";
import { useLanguage } from "@/context/languageContext";
import { RefreshCw, Radio, Timer, Activity, Wifi, WifiOff } from "lucide-react";
import { useState } from "react";

const translations = {
  ar: {
    title: "مزامنة البث المباشر",
    modeLabel: "معدل التحديث:",
    mode_sim: "بث فائق السرعة (محاكاة)",
    mode_5m: "كل 5 دقائق (بث حي)",
    mode_10m: "كل 10 دقائق (بث حي)",
    mode_manual: "تحديث يدوي فقط",
    mode_disabled: "تعطيل البث بالكامل",
    status_live: "بث مباشر نشط",
    status_scheduled: "تحديث مجدول",
    status_manual: "تحديث يدوي",
    status_disabled: "مغلق",
    last_sync: "آخر مزامنة",
    sync_now: "مزامنة الآن",
    syncing: "جاري الاستعلام...",
    next_sync_in: "التحديث القادم",
    not_available: "غير نشط",
    never: "لم يتم بعد"
  },
  en: {
    title: "Live Feed Sync",
    modeLabel: "Refresh Rate:",
    mode_sim: "Super-fast Stream (Sim)",
    mode_5m: "Every 5 Minutes (Live)",
    mode_10m: "Every 10 Minutes (Live)",
    mode_manual: "Manual Refresh Only",
    mode_disabled: "Disable Feed Fully",
    status_live: "Active Live Stream",
    status_scheduled: "Scheduled Update",
    status_manual: "Manual Sync Only",
    status_disabled: "Feed Offline",
    last_sync: "Last Synced",
    sync_now: "Sync Now",
    syncing: "Querying...",
    next_sync_in: "Next update in",
    not_available: "N/A",
    never: "Never"
  }
};

export function LiveSyncControl() {
  const { language } = useLanguage();
  const {
    syncMode,
    setSyncMode,
    isSyncing,
    lastSyncedAt,
    secondsToNextSync,
    triggerSync
  } = useLiveMarket();

  const [spin, setSpin] = useState(false);
  const t = translations[language === "ar" ? "ar" : "en"];

  const handleManualSync = async () => {
    setSpin(true);
    await triggerSync();
    setTimeout(() => setSpin(false), 800);
  };

  // Calculate SVG Countdown Ring metrics
  const radius = 16;
  const circumference = 2 * Math.PI * radius; // ~100.53
  let maxSeconds = 300;
  if (syncMode === "10m") maxSeconds = 600;

  const percentage = syncMode === "5m" || syncMode === "10m"
    ? Math.max(0, Math.min(100, (secondsToNextSync / maxSeconds) * 100))
    : 100;

  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Format countdown string MM:SS
  const formatTime = (secs: number) => {
    if (syncMode !== "5m" && syncMode !== "10m") return t.not_available;
    const minutes = Math.floor(secs / 60);
    const remainingSeconds = secs % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Determine indicator colors
  const getBadgeStyle = () => {
    switch (syncMode) {
      case "sim":
        return {
          bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
          dot: "bg-emerald-400 animate-pulse",
          text: t.status_live,
          icon: Radio
        };
      case "5m":
      case "10m":
        return {
          bg: "bg-sky-500/10 border-sky-500/30 text-sky-400",
          dot: "bg-sky-400 animate-pulse",
          text: t.status_scheduled,
          icon: Timer
        };
      case "manual":
        return {
          bg: "bg-amber-500/10 border-amber-500/30 text-amber-400",
          dot: "bg-amber-400",
          text: t.status_manual,
          icon: Activity
        };
      default:
        return {
          bg: "bg-rose-500/10 border-rose-500/30 text-rose-400",
          dot: "bg-rose-400",
          text: t.status_disabled,
          icon: WifiOff
        };
    }
  };

  const badge = getBadgeStyle();
  const IconComponent = badge.icon;

  return (
    <div className="rounded-xl border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-4 text-sm leading-7 shadow-lg backdrop-blur-md transition-all hover:border-[color:var(--primary)]/30">
      {/* Title & Connection Dot */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="font-black text-[color:var(--foreground)] flex items-center gap-2">
          <Wifi size={16} className={syncMode !== "disabled" ? "text-emerald-400" : "text-rose-400"} />
          {t.title}
        </span>
        <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-bold ${badge.bg}`}>
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${badge.dot}`} />
          <span>{badge.text}</span>
        </div>
      </div>

      {/* Interval Mode Dropdown */}
      <div className="mb-4">
        <label className="text-xs font-bold text-[color:var(--muted)] mb-1 block">
          {t.modeLabel}
        </label>
        <select
          value={syncMode}
          onChange={(e) => setSyncMode(e.target.value as any)}
          className="w-full rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] text-[color:var(--foreground)] px-2.5 py-1.5 text-xs font-black focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)] focus:border-[color:var(--primary)] transition"
        >
          <option value="sim">{t.mode_sim}</option>
          <option value="5m">{t.mode_5m}</option>
          <option value="10m">{t.mode_10m}</option>
          <option value="manual">{t.mode_manual}</option>
          <option value="disabled">{t.mode_disabled}</option>
        </select>
      </div>

      {/* Timer / Progress Countdown Indicator */}
      <div className="flex items-center gap-4 bg-[color:var(--surface)]/50 rounded-lg p-3 border border-[color:var(--line)] mb-4">
        {/* SVG Progress Circle */}
        <div className="relative flex items-center justify-center shrink-0 w-10 h-10">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="20"
              cy="20"
              r={radius}
              className="stroke-[color:var(--line)] fill-none"
              strokeWidth="2.5"
            />
            <circle
              cx="20"
              cy="20"
              r={radius}
              className={`fill-none stroke-current transition-all duration-1000 ${
                syncMode === "sim"
                  ? "text-emerald-400 animate-spin origin-center stroke-dashed"
                  : syncMode === "disabled"
                  ? "text-rose-500"
                  : "text-sky-400"
              }`}
              strokeWidth="2.5"
              strokeDasharray={circumference}
              strokeDashoffset={syncMode === "sim" || syncMode === "disabled" || syncMode === "manual" ? 0 : strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <IconComponent size={14} className="absolute text-[color:var(--muted)]" />
        </div>

        {/* Text Countdown values */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-[color:var(--muted)] leading-4">{t.next_sync_in}</p>
          <p className="text-sm font-black text-[color:var(--foreground)] leading-5 truncate mt-0.5">
            {syncMode === "sim" ? (
              <span className="text-emerald-400 animate-pulse">{t.mode_sim.split(" ")[0]}</span>
            ) : syncMode === "disabled" || syncMode === "manual" ? (
              <span className="text-[color:var(--muted)]">{t.not_available}</span>
            ) : (
              <span className="font-mono text-sky-400 font-bold">{formatTime(secondsToNextSync)}</span>
            )}
          </p>
        </div>
      </div>

      {/* Action Sync Button & Status Info */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleManualSync}
          disabled={isSyncing || syncMode === "disabled"}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-black transition shadow-sm ${
            isSyncing || syncMode === "disabled"
              ? "bg-[color:var(--chip)] text-[color:var(--muted)] cursor-not-allowed border border-[color:var(--line)]"
              : "bg-[color:var(--chip)] hover:bg-[color:var(--line)] text-[color:var(--foreground)] border border-[color:var(--line)] active:scale-[0.98]"
          }`}
        >
          <RefreshCw
            size={13}
            className={`${spin || isSyncing ? "animate-spin text-sky-400" : ""}`}
          />
          {isSyncing ? t.syncing : t.sync_now}
        </button>
      </div>

      {/* Last Synced details */}
      <div className="mt-2.5 pt-2 border-t border-[color:var(--line)]/50 flex justify-between items-center text-[10px] font-bold text-[color:var(--muted)]">
        <span>{t.last_sync}:</span>
        <span className="font-mono text-[color:var(--foreground)]">
          {lastSyncedAt || t.never}
        </span>
      </div>
    </div>
  );
}
