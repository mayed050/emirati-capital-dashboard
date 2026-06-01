"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Activity,
  Calculator,
  CalendarDays,
  FileText,
  GitCompare,
  Home,
  Menu,
  Moon,
  PieChart,
  ShieldAlert,
  Sun,
  Table2,
  X,
  Globe,
  Bell,
} from "lucide-react";
import { TickerTape } from "@/components/TickerTape";

import { LiveSyncControl } from "@/components/dashboard/LiveSyncControl";
import { useLanguage } from "@/context/languageContext";
import { playChime } from "@/components/AlertManager";
import { formatCurrency } from "@/lib/format";

const navItems = [
  { href: "/", labelKey: "overview", icon: Home },
  { href: "/stocks", labelKey: "screener", icon: Table2 },
  { href: "/dividends", labelKey: "dividends", icon: CalendarDays },
  { href: "/outlook", labelKey: "outlook", icon: Activity },
  { href: "/portfolio", labelKey: "portfolio", icon: PieChart },
  { href: "/calculator", labelKey: "calculator", icon: Calculator },
  { href: "/compare", labelKey: "compare", icon: GitCompare },
  { href: "/report", labelKey: "report", icon: FileText },
];

type Theme = "light" | "dark";

export function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { language, toggleLanguage, t } = useLanguage();
  const [toastAlert, setToastAlert] = useState<{ symbol: string; price: number; target: number } | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "dark";
    const saved = window.localStorage.getItem("emirati-capital:theme");
    return saved === "light" || saved === "dark" ? saved : "dark";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("emirati-capital:theme", theme);
  }, [theme]);

  useEffect(() => {
    const handleAlert = (e: Event) => {
      const customEvent = e as CustomEvent;
      playChime();
      setToastAlert(customEvent.detail);
      // Clear any existing timer before starting a new one (prevents race on multiple alerts)
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => setToastAlert(null), 4500);
    };
    window.addEventListener("emirati-capital:alert-triggered", handleAlert);
    return () => {
      window.removeEventListener("emirati-capital:alert-triggered", handleAlert);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const toggleTheme = () => setTheme((value) => (value === "dark" ? "light" : "dark"));

  return (
    <div className="min-h-screen" dir={language === "ar" ? "rtl" : "ltr"}>
      {toastAlert && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4 no-print animate-bounce">
          <div className="rounded-xl border border-emerald-400 bg-emerald-600 text-white p-4 shadow-2xl flex items-start gap-3 shadow-emerald-500/20">
            <div className="bg-white/20 rounded-lg p-2 shrink-0">
              <Bell className="animate-pulse" size={20} />
            </div>
            <div className="flex-1">
              <h4 className="font-black text-sm">
                {language === "ar" ? "🔔 تنبيه سعر متجاوز!" : "🔔 Live Price Alert Triggered!"}
              </h4>
              <p className="mt-1 text-xs font-bold leading-5 opacity-90">
                {language === "ar" 
                  ? `السهم ${toastAlert.symbol} تداول الآن بسعر ${formatCurrency(toastAlert.price)} درهم (الهدف كان ${formatCurrency(toastAlert.target)} AED)!`
                  : `Stock ${toastAlert.symbol} is currently trading at ${formatCurrency(toastAlert.price)} AED (Target was ${formatCurrency(toastAlert.target)} AED)!`}
              </p>
            </div>
            <button
              onClick={() => setToastAlert(null)}
              aria-label="Close alert"
              className="text-white/80 hover:text-white font-bold"
            >✕</button>
          </div>
        </div>
      )}
      <TickerTape />

      <header className="app-header no-print sticky top-0 z-40 border-b backdrop-blur-2xl lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <BrandMark />
            <BrandText />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeButton theme={theme} onClick={toggleTheme} compact />
            <LangButton language={language} onClick={toggleLanguage} compact />
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              className="icon-button"
              aria-label="Toggle Menu"
            >
              {open ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
            </button>
          </div>
        </div>
      </header>

      <div className="layout-grid mx-auto grid w-full max-w-[1560px] lg:grid-cols-[1fr_290px]">
        <aside
          dir={language === "ar" ? "rtl" : "ltr"}
          className={`app-sidebar no-print fixed inset-y-0 right-0 z-50 w-[290px] p-4 shadow-2xl transition lg:sticky lg:top-0 lg:col-start-2 lg:row-start-1 lg:block lg:h-screen lg:translate-x-0 lg:shadow-none ${
            open ? "block translate-x-0" : "hidden translate-x-full"
          }`}
        >
          <div className="mb-7 flex items-center justify-between gap-3">
            <Link href="/" className="flex min-w-0 items-center gap-3" onClick={() => setOpen(false)}>
              <BrandMark />
              <BrandText />
            </Link>
            <button type="button" onClick={() => setOpen(false)} className="icon-button lg:hidden" aria-label="Close Menu">
              <X size={18} aria-hidden />
            </button>
          </div>

          <nav className="grid gap-2" aria-label="Main Navigation">
            {navItems.map((item) => {
              const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`sidebar-link ${active ? "sidebar-link-active" : ""}`}
                >
                  <item.icon size={19} aria-hidden />
                  {t(item.labelKey)}
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 flex gap-2">
            <ThemeButton theme={theme} onClick={toggleTheme} />
            <LangButton language={language} onClick={toggleLanguage} />
          </div>

          <div className="mt-6">
            <LiveSyncControl />
          </div>

          <div className="liability-box mt-6 rounded-lg p-4 text-sm leading-7">
            <div className="mb-2 flex items-center gap-2 font-black">
              <ShieldAlert size={18} aria-hidden />
              {t("disclaimerTitle")}
            </div>
            <p>
              {t("disclaimerText")}
            </p>
          </div>

          <p className="mt-auto px-2 pt-5 text-xs font-bold text-[color:var(--muted)]">
            {t("liabilityText")}
          </p>
        </aside>

        <main dir={language === "ar" ? "rtl" : "ltr"} className="min-w-0 px-4 py-5 md:px-6 lg:col-start-1 lg:row-start-1 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function ThemeButton({ theme, onClick, compact = false }: { theme: Theme; onClick: () => void; compact?: boolean }) {
  const { t } = useLanguage();
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={onClick}
      className={compact ? "icon-button" : "sidebar-link flex-1"}
      aria-label={isDark ? t("themeLight") : t("themeDark")}
    >
      {isDark ? <Sun size={18} aria-hidden /> : <Moon size={18} aria-hidden />}
      {compact ? null : <span>{isDark ? t("themeLight") : t("themeDark")}</span>}
    </button>
  );
}

function LangButton({ language, onClick, compact = false }: { language: string; onClick: () => void; compact?: boolean }) {
  const isEn = language === "en";
  return (
    <button
      type="button"
      onClick={onClick}
      className={compact ? "icon-button" : "sidebar-link flex-1"}
      aria-label={isEn ? "العربية" : "English"}
    >
      <Globe size={18} aria-hidden />
      {compact ? null : <span>{isEn ? "العربية" : "English"}</span>}
    </button>
  );
}

function BrandMark() {
  return (
    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-sky-500 to-violet-500 text-sm font-black text-white shadow-lg shadow-sky-800/20">
      UAE
    </span>
  );
}

function BrandText() {
  const { t } = useLanguage();
  return (
    <span className="min-w-0 w-44 max-w-[calc(100vw-8rem)] text-right md:w-auto md:max-w-none">
      <span className="block truncate text-sm font-black text-[color:var(--foreground)] sm:text-base md:text-lg">
        {t("title")}
      </span>
      <span className="block truncate text-xs font-bold text-[color:var(--muted)]">{t("subtitle")}</span>
    </span>
  );
}
