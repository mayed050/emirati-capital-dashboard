"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Language = "ar" | "en";

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  ar: {
    // Navigation
    overview: "نظرة عامة",
    screener: "مستكشف الأسهم",
    dividends: "التوزيعات",
    outlook: "الاتجاه",
    portfolio: "حاسبة المحفظة",
    calculator: "حاسبة الأمان",
    compare: "المقارنة",
    report: "التقرير",
    title: "منصة الأسهم الإماراتية",
    subtitle: "سوق دبي وأبوظبي بقراءة عربية",
    
    // Layout
    liveMarketFeed: "حالة البث اللحظي",
    marketOpen: "مفتوح",
    marketClosed: "مغلق",
    simActive: "محاكاة نشطة",
    startSim: "تفعيل محاكاة 24/7",
    stopSim: "إيقاف محاكاة 24/7",
    disclaimerTitle: "إخلاء مسؤولية",
    disclaimerText: "ليست هذه اللوحة توصية شراء أو بيع. القراءات مبنية على لقطة ثابتة ونماذج داخلية للمقارنة والمتابعة فقط.",
    liabilityText: "بيانات للمعلومات فقط ولا تعتبر نصيحة استثمارية.",
    themeLight: "الوضع الفاتح",
    themeDark: "الوضع الداكن",
    
    // Overview Screen
    marketOverview: "نظرة عامة على السوق",
    snapshotRef: "لقطة سوق مرتبة حسب مرجع الصورة",
    leadersAverageYield: "متوسط العائد لقادة السوق",
    leadersTotalMarketCap: "القيمة السوقية الإجمالية للقادة",
    smartAlertsCount: "تنبيهات ذكية نشطة",
    emiratesMarket: "الإمارات",
    marketDataTitle: "بيانات السوق في اللقطة",
    marketActivity: "حركة السوق",
    gulfIndicesTitle: "مؤشرات الخليج",
    globalIndicesTitle: "مؤشرات عالمية",
    
    // Screener Screen
    screenerTitle: "مستكشف الأسهم",
    screenerSubtitle: "أسعار الشركات والنسب المالية للقطاعين",
    searchPlaceholder: "رمز أو اسم أو قطاع...",
    allMarkets: "الكل",
    allSectors: "الكل",
    allHealth: "الكل",
    filterMarket: "السوق",
    filterSector: "القطاع",
    filterHealth: "الصحة المالية",
    filterSort: "الفرز",
    filterDirection: "الاتجاه",
    quickHealthMap: "خريطة الصحة السريعة",
    
    // Table Headers
    thCompany: "الشركة",
    thPrice: "السعر",
    thChange: "التغير",
    thYield: "العائد",
    thHealth: "الصحة",
    thVolume: "قيمة التداول",
    thPE: "P/E",
    thEPS: "EPS",
    thROE: "ROE",
    thTrend: "الاتجاه",
    thSector: "القطاع",
    thMarket: "السوق",
    
    // Alert Manager
    alertManager: "مدير التنبيهات السعرية",
    alertSubtitle: "اضبط أهداف الأسعار للحصول على تنبيهات صوتية وبصرية فورية",
    alertCreate: "إنشاء تنبيه جديد",
    alertSymbol: "رمز السهم",
    alertDirection: "نوع التنبيه",
    alertPrice: "السعر المستهدف (درهم)",
    alertTriggerAbove: "إذا ارتفع فوق 📈",
    alertTriggerBelow: "إذا انخفض تحت 📉",
    alertAddBtn: "أضف التنبيه النشط",
    activeAlerts: "التنبيهات السعرية النشطة",
    noActiveAlerts: "لا توجد تنبيهات سعرية نشطة حالياً.",
    alertTriggeredToast: "🔔 تنبيه سعر: سهم {symbol} وصل إلى {price} درهم!",
    
    // Compare Screen
    compareTitle: "مقارنة الأسهم الاستراتيجية",
    compareSubtitle: "مقارنة ثنائية جنباً إلى جنب بين القراءات الرقمية ومصفوفة الـ SWOT",
    metricsMode: "المؤشرات الرقمية",
    swotMode: "مصفوفة الـ SWOT",
    selectStockLeft: "اختر السهم الأيمن",
    selectStockRight: "اختر السهم الأيسر",
    winnerResult: "نتيجة النموذج",
    winnerTie: "متوازن",
    winnerLeader: "يتفوق {symbol} في {count} من {total} معايير مقارنة.",
    winnerTieText: "السهمان متقاربان في القراءة المركبة، راقب القطاع والسيولة.",
    swotStrengths: "نقاط القوة (Strengths)",
    swotWeaknesses: "نقاط الضعف (Weaknesses)",
    swotOpportunities: "الفرص المتاحة (Opportunities)",
    swotThreats: "المخاطر الخارجية (Threats)",
    
    // Portfolio Screen
    portfolioTitle: "متتبع المحفظة الاستثمارية الذكي",
    portfolioSubtitle: "LocalStorage · أضف أصولك محلياً بشكل آمن وتابع تدفقات الأرباح محلياً",
    virtualTradingDesk: "منصة التداول الافتراضي (Paper Trading)",
    tradingSubtitle: "قم بمحاكاة عمليات شراء وبيع حية بأموال افتراضية",
    tradingBalance: "رصيد الكاش الافتراضي",
    buyAction: "شراء أسهم 🟢",
    sellAction: "بيع أسهم 🔴",
    sharesAmount: "عدد الأسهم",
    executeTrade: "تنفيذ العملية الافتراضية",
    transactionLedger: "سجل العمليات التاريخي (Ledger)",
    thType: "العملية",
    thShares: "الأسهم",
    thTotal: "الإجمالي",
    thTime: "الوقت",
    realizedGains: "الأرباح المحققة",
    unrealizedGains: "الأرباح غير المحققة",
    netAssetValue: "إجمالي قيمة الأصول",
    holdingsList: "أصول المحفظة النشطة",
    noHoldings: "المحفظة فارغة حالياً. أضف أو اشترِ أسهماً للبدء.",
    dripPlanner: "مخطط تراكم وتضاعف الأرباح (DRIP Planner)",
    dripReinvest: "إعادة استثمار الأرباح تلقائياً (DRIP)",
    dripCashOut: "سحب الأرباح نقداً كاش",
    dripHorizon: "أفق الاستثمار (سنوات)",
    dripAnnualContrib: "المساهمة السنوية الإضافية (درهم)",
    
    // Safety Calculator Screen
    safetyTitle: "حاسبة الأمان الاستثماري",
    safetySubtitle: "احسب رأس المال المطلوب لتحقيق دخل سنوي مستهدف مع مراعاة مخاطر التركيز",
    targetIncome: "الدخل السنوي المستهدف",
    maxConcentration: "حد التركيز الأقصى (%)",
    sharesNeeded: "الأسهم المطلوبة",
    capitalRequired: "رأس المال المطلوب",
    suggestedPortfolio: "حجم محفظة مقترح",
    calculatedYield: "العائد الفعلي المحسوب",
    safetyResult: "قراءة الأمان التشخيصية",
    payoutRiskTitle: "مخاطر التوزيع المرتفعة",
    concentrationRiskTitle: "مخاطر التركيز المرتفعة",
    
    // Financial Report Screen
    reportTitle: "التقرير المالي المتكامل",
    reportSubtitle: "تنسيق طباعة صديق للبيئة لجميع الأسهم المدرجة في قاعدة منصة الأسهم الإماراتية",
    printBtn: "طباعة / حفظ تقرير PDF فاخر",
    repStockCount: "عدد الأسهم",
    repMarketCap: "القيمة السوقية الإجمالية",
    repAvgHealth: "متوسط الصحة المالية",
    repTopYield: "أعلى عائد للقادة",
    repTopYieldTitle: "أعلى العوائد النقدية بين قادة السوق",
    repTableTitle: "جدول الأسهم الشامل لأسواق المال الإماراتية",
    repDisclaimer: "تعتمد بعض الحقول التاريخية ونطاقات القيمة على نموذج داخلي مشتق من اللقطة، ويجب الرجوع للمصادر الرسمية قبل أي قرار استثماري.",
    thStock: "السهم",
    thDivRating: "التوزيع",
    th3MTrend: "اتجاه 3 أشهر",
    thIntTarget: "هدف داخلي",
    
    // Health bands
    "ممتاز": "ممتاز",
    "جيد": "جيد",
    "متوازن": "متوازن",
    "تحت المراقبة": "تحت المراقبة",
    
    // Dividend ratings
    "مستدام": "مستدام",
    "مقبول": "مقبول",
    "مرتفع المخاطر": "مرتفع المخاطر",
    
    // Trend directions
    "صاعد": "صاعد 📈",
    "مستقر إيجابي": "مستقر إيجابي ↗️",
    "محايد": "محايد ➡️",
    "ضاغط": "ضاغط 📉",
    "متذبذب": "متذبذب ⚠️",
  },
  en: {
    // Navigation
    overview: "Overview",
    screener: "Stock Explorer",
    dividends: "Dividends",
    outlook: "Market Outlook",
    portfolio: "Portfolio Tracker",
    calculator: "Safety Calculator",
    compare: "Comparison",
    report: "Financial Report",
    title: "Emirati Capital",
    subtitle: "Dubai & Abu Dhabi Stock Analytics Panel",
    
    // Layout
    liveMarketFeed: "Live Market Feed",
    marketOpen: "Market Open",
    marketClosed: "Market Closed",
    simActive: "Simulation Active",
    startSim: "Enable 24/7 Simulator",
    stopSim: "Disable 24/7 Simulator",
    disclaimerTitle: "Disclaimer",
    disclaimerText: "This panel is for informational and educational purposes only. It is not financial or investment advice.",
    liabilityText: "Data for informational tracking only.",
    themeLight: "Light Mode",
    themeDark: "Dark Mode",
    
    // Overview Screen
    marketOverview: "Market Overview",
    snapshotRef: "Market snapshot sorted by visual references",
    leadersAverageYield: "Average Leader Yield",
    leadersTotalMarketCap: "Leaders Market Capitalization",
    smartAlertsCount: "Active Smart Alerts",
    emiratesMarket: "Emirati Markets",
    marketDataTitle: "Market Snapshot Data",
    marketActivity: "Market Activity",
    gulfIndicesTitle: "GCC Indices",
    globalIndicesTitle: "Global Indices",
    
    // Screener Screen
    screenerTitle: "Stock Explorer",
    screenerSubtitle: "Company prices and financial ratios across DFM & ADX",
    searchPlaceholder: "Search symbol, name, or sector...",
    allMarkets: "All Markets",
    allSectors: "All Sectors",
    allHealth: "All Health Bands",
    filterMarket: "Market",
    filterSector: "Sector",
    filterHealth: "Financial Health",
    filterSort: "Sort By",
    filterDirection: "Direction",
    quickHealthMap: "Quick Health Heatmap",
    
    // Table Headers
    thCompany: "Company",
    thPrice: "Price",
    thChange: "Change",
    thYield: "Yield",
    thHealth: "Health",
    thVolume: "Trade Value",
    thPE: "P/E",
    thEPS: "EPS",
    thROE: "ROE",
    thTrend: "Expected Trend",
    thSector: "Sector",
    thMarket: "Market",
    
    // Alert Manager
    alertManager: "Live Target Price Alerts",
    alertSubtitle: "Set price targets to trigger high-fidelity audio/visual alerts in real time",
    alertCreate: "Create Target Alert",
    alertSymbol: "Stock Symbol",
    alertDirection: "Trigger Condition",
    alertPrice: "Target Price (AED)",
    alertTriggerAbove: "When price goes ABOVE 📈",
    alertTriggerBelow: "When price drops BELOW 📉",
    alertAddBtn: "Add Active Alert",
    activeAlerts: "Active Target Alerts",
    noActiveAlerts: "No active price alerts currently.",
    alertTriggeredToast: "🔔 Price Alert: {symbol} reached {price} AED!",
    
    // Compare Screen
    compareTitle: "Strategic Stock Comparison",
    compareSubtitle: "Head-to-head comparison between numerical values and strategic SWOT matrix",
    metricsMode: "Numerical Metrics",
    swotMode: "SWOT Matrix Analysis",
    selectStockLeft: "Select Right Stock",
    selectStockRight: "Select Left Stock",
    winnerResult: "Model Faceoff Result",
    winnerTie: "Perfect Balance",
    winnerLeader: "{symbol} outperforms in {count} out of {total} metrics.",
    winnerTieText: "Both stocks are closely matched. Track sector momentum and volume.",
    swotStrengths: "Strengths (S)",
    swotWeaknesses: "Weaknesses (W)",
    swotOpportunities: "Opportunities (O)",
    swotThreats: "Threats (T)",
    
    // Portfolio Screen
    portfolioTitle: "Smart Investment Portfolio",
    portfolioSubtitle: "LocalStorage secured. Track holdings, stress testing and dividends local-first",
    virtualTradingDesk: "Virtual Paper Trading Terminal",
    tradingSubtitle: "Simulate real-time buying and selling with paper money",
    tradingBalance: "Virtual Cash Balance",
    buyAction: "Buy Stock 🟢",
    sellAction: "Sell Stock 🔴",
    sharesAmount: "Shares Quantity",
    executeTrade: "Execute Virtual Trade",
    transactionLedger: "Historical Transaction Ledger",
    thType: "Action",
    thShares: "Shares",
    thTotal: "Total Cost",
    thTime: "Timestamp",
    realizedGains: "Realized P&L",
    unrealizedGains: "Unrealized P&L",
    netAssetValue: "Net Asset Value (NAV)",
    holdingsList: "Active Portfolio Holdings",
    noHoldings: "Your portfolio is empty. Buy or add shares to start tracking.",
    dripPlanner: "Dividend Compounding (DRIP Planner)",
    dripReinvest: "Reinvest Dividends Automatically (DRIP)",
    dripCashOut: "Accumulate Cash Dividends",
    dripHorizon: "Investment Horizon (Years)",
    dripAnnualContrib: "Annual Cash Contribution (AED)",
    
    // Safety Calculator Screen
    safetyTitle: "Safety & Target Income Calculator",
    safetySubtitle: "Calculate shares and capital required to generate stable dividend cash flow",
    targetIncome: "Target Annual Income",
    maxConcentration: "Max Portfolio Cap (%)",
    sharesNeeded: "Shares Required",
    capitalRequired: "Capital Required",
    suggestedPortfolio: "Suggested Portfolio NAV",
    calculatedYield: "Effective Net Yield",
    safetyResult: "Financial Safety Diagnosis",
    payoutRiskTitle: "Elevated Payout Risk",
    concentrationRiskTitle: "High Concentration Risk",
    
    // Financial Report Screen
    reportTitle: "Full Financial Disclosure Report",
    reportSubtitle: "Print-optimized standard snapshot report of all stock leaders in UAE Markets",
    printBtn: "Print / Save Premium PDF Report",
    repStockCount: "Number of Stocks",
    repMarketCap: "Total Market Capitalization",
    repAvgHealth: "Average Financial Health",
    repTopYield: "Highest Leader Yield",
    repTopYieldTitle: "Top Dividend Yields among Market Leaders",
    repTableTitle: "Comprehensive UAE Stock Analytics Sheet",
    repDisclaimer: "Some historical values and ranges depend on an internal snapshot model. Consult official market sources before making investment decisions.",
    thStock: "Stock",
    thDivRating: "Dividend Rating",
    th3MTrend: "3M Trend",
    thIntTarget: "Internal Target",
    
    // Health bands
    "ممتاز": "Excellent",
    "جيد": "Good",
    "متوازن": "Balanced",
    "تحت المراقبة": "Under Watch",
    
    // Dividend ratings
    "مستدام": "Sustainable",
    "مقبول": "Acceptable",
    "مرتفع المخاطر": "High Risk",
    
    // Trend directions
    "صاعد": "Bullish 📈",
    "مستقر إيجابي": "Stable Bullish ↗️",
    "محايد": "Neutral ➡️",
    "ضاغط": "Bearish 📉",
    "متذبذب": "Volatile ⚠️",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === "undefined") return "ar";
    const saved = window.localStorage.getItem("emirati-capital:lang");
    return saved === "en" || saved === "ar" ? saved : "ar";
  });

  useEffect(() => {
    window.localStorage.setItem("emirati-capital:lang", language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "ar" ? "en" : "ar"));
  };

  const t = (key: string): string => {
    return translations[language][key] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
