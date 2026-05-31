import type { MarketCode, Sector, StockSymbol } from "@/types";

export type { MarketCode };

export type StockConfig = {
  symbol: StockSymbol;
  nameAr: string;
  nameEn: string;
  market: MarketCode;
  sector: Sector;
  profile: string;
  officialUrls: {
    marketProfile: string;
    disclosures: string;
    dividends: string;
    investorRelations?: string;
  };
};

const DFM_DIVIDENDS = "https://www.dfm.ae/en/investing/services/dividends-distribution-summary";
const ADX_DIVIDENDS = "https://www.adx.ae/en/market-summary/cash-dividends";
const DFM_DISCLOSURES = "https://www.dfm.ae/en/the-exchange/news-and-disclosures/company-disclosures";

function dfmLeader(
  symbol: StockSymbol,
  nameAr: string,
  nameEn: string,
  sector: Sector,
  profile: string,
  investorRelations?: string,
): StockConfig {
  return {
    symbol,
    nameAr,
    nameEn,
    market: "DFM",
    sector,
    profile,
    officialUrls: {
      marketProfile: `https://www.dfm.ae/en/issuers/listed-securities/securities/company-profile-page?id=${symbol}`,
      disclosures: DFM_DISCLOSURES,
      dividends: DFM_DIVIDENDS,
      investorRelations,
    },
  };
}

function adxLeader(
  symbol: StockSymbol,
  nameAr: string,
  nameEn: string,
  sector: Sector,
  profile: string,
  investorRelations?: string,
): StockConfig {
  return {
    symbol,
    nameAr,
    nameEn,
    market: "ADX",
    sector,
    profile,
    officialUrls: {
      marketProfile: `https://www.adx.ae/en/main-market/company-profile/overview?symbols=${symbol}`,
      disclosures: `https://www.adx.ae/en/main-market/company-profile/disclosures?symbols=${symbol}`,
      dividends: ADX_DIVIDENDS,
      investorRelations,
    },
  };
}

const additionalStockConfigs: StockConfig[] = [
  dfmLeader("EMAARDEV", "إعمار للتطوير", "Emaar Development PJSC", "العقار", "ذراع تطوير عقاري تركز على مشاريع البيع على الخارطة والتسليمات السكنية في دبي، وتستفيد من قوة علامة إعمار ودورة الطلب العقاري.", "https://properties.emaar.com/en/investor-relations/"),
  dfmLeader("MASQ", "بنك المشرق", "Mashreqbank PSC", "البنوك", "بنك تجاري كبير ذو قاعدة رأسمالية قوية وربحية مرتبطة بهوامش الفائدة وجودة الائتمان والسيولة المؤسسية.", "https://www.mashreq.com/en/uae/about-us/investor-relations/"),
  dfmLeader("AIRARABIA", "العربية للطيران", "Air Arabia PJSC", "الطيران والنقل", "شركة طيران اقتصادي إقليمية تتأثر بالطلب على السفر وأسعار الوقود وتوسع الأسطول وكفاءة التشغيل.", "https://www.airarabia.com/en/investor-relations"),
  dfmLeader("PARKIN", "باركن", "Parkin Company PJSC", "النقل والخدمات المرورية", "مشغل مواقف دبي العامة والمدفوعة، يعتمد على نمو الحركة الحضرية والتسعير والتنظيمات البلدية.", "https://www.parkin.ae/investor-relations"),
  dfmLeader("DUBAIRESI", "دبي ريزيدنشال ريت", "Dubai Residential REIT", "العقار", "صندوق عقاري سكني يرتبط أداؤه بمعدلات الإشغال والإيجارات وتكلفة التمويل وقيمة الأصول العقارية."),
  dfmLeader("DIC", "دبي للاستثمار", "Dubai Investments PJSC", "الاستثمار والصناعة", "شركة قابضة متنوعة تجمع بين العقار والصناعة والاستثمارات، وتتحرك أرباحها مع التخارجات والتقييمات والدورة الاقتصادية.", "https://www.dubaiinvestments.com/investor-relations/"),
  dfmLeader("DFM", "سوق دبي المالي", "Dubai Financial Market PJSC", "الخدمات المالية", "مشغل السوق المالي في دبي، ترتبط إيراداته بأحجام التداول والإدراجات الجديدة ونشاط المستثمرين.", "https://www.dfm.ae/en/about-dfm/investor-relations"),
  dfmLeader("GULFNAV", "الخليج للملاحة", "Gulf Navigation Holding PJSC", "النقل البحري", "شركة نقل وخدمات بحرية ذات حساسية لدورات الشحن والتمويل وأسعار الأصول البحرية."),
  dfmLeader("GFH", "مجموعة جي إف إتش المالية", "GFH Financial Group B.S.C.", "الخدمات المالية", "مجموعة مالية واستثمارية خليجية تتأثر بدورات التخارج وإدارة الأصول والتمويل الإسلامي.", "https://www.gfh.com/investor-relations/"),
  dfmLeader("ALEC", "أليك القابضة", "ALEC Holdings PJSC", "الإنشاءات والخدمات الصناعية", "مجموعة إنشاءات وخدمات هندسية تستفيد من مشاريع البنية التحتية والعقار، وتحتاج متابعة هوامش التنفيذ وتدفقات العقود."),
  dfmLeader("DTC", "تاكسي دبي", "Dubai Taxi Company PJSC", "النقل والخدمات المرورية", "مشغل نقل حضري في دبي، ترتبط إيراداته بحركة السكان والسياحة وكفاءة الأسطول والتوسع في خدمات التنقل.", "https://www.dubaitaxi.ae/en/investor-relations"),
  dfmLeader("TABREED", "تبريد", "National Central Cooling Company PJSC", "التبريد المركزي", "شركة تبريد مركزي إقليمية، تعتمد على عقود طويلة الأجل ونمو الطلب على البنية التحتية العقارية وكفاءة التمويل.", "https://www.tabreed.ae/investor-relations/"),
  adxLeader("IHC", "الشركة العالمية القابضة", "International Holding Company PJSC", "الاستثمار المتنوع", "مجموعة قابضة كبرى متعددة القطاعات، ترتبط قراءتها بجودة الأرباح، التوسع الاستثماري، وتقييمات الشركات التابعة.", "https://ihcuae.com/investors/"),
  adxLeader("TAQA", "أبوظبي الوطنية للطاقة", "Abu Dhabi National Energy Company PJSC", "المرافق والطاقة", "شركة مرافق وطاقة دفاعية ذات أصول كهرباء ومياه ونفط وغاز، تتأثر بالتنظيم والرافعة المالية وتدفقات العقود طويلة الأجل.", "https://www.taqa.com/investors/"),
  adxLeader("BOROUGE", "بروج", "Borouge PLC", "البتروكيماويات", "شركة بتروكيماويات كبرى تعتمد على هوامش المنتجات، أسعار اللقيم، ودورات الطلب الصناعي العالمي.", "https://www.borouge.com/en/investors"),
  adxLeader("ALPHADHABI", "ألفا ظبي القابضة", "Alpha Dhabi Holding PJSC", "الاستثمار المتنوع", "شركة قابضة متنوعة ذات تعرض للعقار والضيافة والصناعة والاستثمار، وتتأثر بنتائج الشركات التابعة والتقييمات.", "https://alphadhabi.com/investors/"),
  adxLeader("ALDAR", "الدار العقارية", "Aldar Properties PJSC", "العقار", "مطوّر عقاري قيادي في أبوظبي، ترتبط قراءته بالمبيعات المسبقة والإيجارات والتوسع في إدارة الأصول.", "https://www.aldar.com/en/investors"),
  adxLeader("MODON", "مدن القابضة", "Modon Holding PSC", "العقار والتطوير", "شركة تطوير ومشاريع حضرية واسعة النطاق، يتأثر أداؤها بوتيرة التسليمات والعقود الحكومية ودورة العقار."),
  adxLeader("ADNOCLS", "أدنوك للإمداد والخدمات", "ADNOC Logistics & Services PLC", "الطاقة والخدمات البحرية", "مزود خدمات لوجستية وبحرية للطاقة، يستفيد من عقود طويلة الأجل وتوسع أدنوك في سلاسل الإمداد.", "https://www.adnocls.ae/en/investor-relations"),
  adxLeader("FERTIGLB", "فيرتيغلوب", "Fertiglobe PLC", "البتروكيماويات والأسمدة", "شركة أسمدة وكيماويات نيتروجينية، تتأثر بأسعار الأمونيا واليوريا والغاز والطلب الزراعي العالمي.", "https://fertiglobe.com/investor-relations/"),
  adxLeader("2POINTZERO", "تو بوينت زيرو", "Two Point Zero Group P.J.S.C", "الاستثمار والتقنية", "منصة استثمارية حديثة ذات تعرض للتقنية والأصول البديلة، وتحتاج متابعة دقيقة للسيولة وجودة الإفصاح."),
  adxLeader("ADPORTS", "مجموعة موانئ أبوظبي", "Abu Dhabi Ports Company PJSC", "النقل والخدمات اللوجستية", "مجموعة موانئ ولوجستيات مرتبطة بالتجارة الإقليمية، توسع المناطق الصناعية، وعقود الشحن والخدمات.", "https://www.adportsgroup.com/en/investors"),
  adxLeader("AMR", "أمريكانا للمطاعم", "Americana Restaurants International PLC", "الخدمات الاستهلاكية", "مشغل مطاعم إقليمي، يتأثر بإنفاق المستهلكين، التوسع الجغرافي، وتكاليف الغذاء والعمالة.", "https://www.americanarestaurants.com/investors/"),
  adxLeader("SIB", "مصرف الشارقة الإسلامي", "Sharjah Islamic Bank PJSC", "البنوك الإسلامية", "مصرف إسلامي محلي تتحدد قراءته بنمو التمويلات، جودة الأصول، وهوامش الربحية والتوزيعات.", "https://www.sib.ae/en/investor-relations"),
  adxLeader("PRESIGHT", "بريسايت", "Presight AI Holding PLC", "الذكاء الاصطناعي وتحليل البيانات", "شركة ذكاء اصطناعي وتحليلات بيانات، يتأثر أداؤها بعقود التحول الرقمي ونمو الإيرادات وجودة التنفيذ.", "https://www.presight.ai/investor-relations/"),
];

export const stocksConfig: StockConfig[] = [
  {
    symbol: "DEWA",
    nameAr: "هيئة كهرباء ومياه دبي",
    nameEn: "Dubai Electricity and Water Authority PJSC",
    market: "DFM",
    sector: "المرافق",
    profile: "شركة مرافق دفاعية ترتبط إيراداتها بالطلب على الكهرباء والمياه وخدمات البنية التحتية في دبي.",
    officialUrls: {
      marketProfile: "https://www.dfm.ae/en/issuers/listed-securities/securities/company-profile-page?id=DEWA",
      disclosures: "https://www.dfm.ae/en/the-exchange/news-and-disclosures/company-disclosures",
      dividends: DFM_DIVIDENDS,
      investorRelations: "https://www.dewa.gov.ae/en/investor-relations",
    },
  },
  {
    symbol: "SALIK",
    nameAr: "سالك",
    nameEn: "Salik Company PJSC",
    market: "DFM",
    sector: "النقل والخدمات المرورية",
    profile: "مشغل بوابات التعرفة المرورية في دبي مع نموذج إيرادات مرتبط بحركة المرور والتوسع التنظيمي.",
    officialUrls: {
      marketProfile: "https://www.dfm.ae/en/issuers/listed-securities/securities/company-profile-page?id=SALIK",
      disclosures: "https://www.dfm.ae/en/the-exchange/news-and-disclosures/company-disclosures",
      dividends: DFM_DIVIDENDS,
      investorRelations: "https://www.salik.ae/en/investor-relations",
    },
  },
  {
    symbol: "TALABAT",
    nameAr: "طلبات القابضة",
    nameEn: "Talabat Holding PLC",
    market: "DFM",
    sector: "التجارة الرقمية",
    profile: "منصة طلب وتوصيل رقمية حديثة الإدراج، ترتبط قراءتها بالنمو التشغيلي وجودة الأرباح بعد الإدراج.",
    officialUrls: {
      marketProfile: "https://www.dfm.ae/en/issuers/listed-securities/securities/company-profile-page?id=TALABAT",
      disclosures: "https://www.dfm.ae/en/the-exchange/news-and-disclosures/company-disclosures",
      dividends: DFM_DIVIDENDS,
    },
  },
  {
    symbol: "DIB",
    nameAr: "بنك دبي الإسلامي",
    nameEn: "Dubai Islamic Bank PJSC",
    market: "DFM",
    sector: "البنوك الإسلامية",
    profile: "بنك إسلامي كبير، تتأثر قراءته بنمو التمويلات وجودة الأصول وهوامش الربحية.",
    officialUrls: {
      marketProfile: "https://www.dfm.ae/en/issuers/listed-securities/securities/company-profile-page?id=DIB",
      disclosures: "https://www.dfm.ae/en/the-exchange/news-and-disclosures/company-disclosures",
      dividends: DFM_DIVIDENDS,
      investorRelations: "https://www.dib.ae/about-us/investor-relations",
    },
  },
  {
    symbol: "EMIRATESNBD",
    nameAr: "بنك الإمارات دبي الوطني",
    nameEn: "Emirates NBD PJSC",
    market: "DFM",
    sector: "البنوك",
    profile: "بنك قيادي في دبي والمنطقة، يعتمد تقييمه على الربحية وجودة الائتمان وكفاءة رأس المال.",
    officialUrls: {
      marketProfile: "https://www.dfm.ae/en/issuers/listed-securities/securities/company-profile-page?id=EMIRATESNBD",
      disclosures: "https://www.dfm.ae/en/the-exchange/news-and-disclosures/company-disclosures",
      dividends: DFM_DIVIDENDS,
      investorRelations: "https://www.emiratesnbd.com/en/investor-relations",
    },
  },
  {
    symbol: "DU",
    nameAr: "الإمارات للاتصالات المتكاملة",
    nameEn: "Emirates Integrated Telecommunications Company PJSC",
    market: "DFM",
    sector: "الاتصالات",
    profile: "مشغل اتصالات إماراتي دفاعي نسبيا، تتركز قراءته في نمو المشتركين والتدفقات النقدية والتوزيعات.",
    officialUrls: {
      marketProfile: "https://www.dfm.ae/en/issuers/listed-securities/securities/company-profile-page?id=DU",
      disclosures: "https://www.dfm.ae/en/the-exchange/news-and-disclosures/company-disclosures",
      dividends: DFM_DIVIDENDS,
      investorRelations: "https://www.du.ae/about/investor-relations",
    },
  },
  {
    symbol: "EMPOWER",
    nameAr: "إمباور",
    nameEn: "Emirates Central Cooling Systems Corporation PJSC",
    market: "DFM",
    sector: "التبريد المركزي",
    profile: "مزود تبريد مركزي يتأثر بنمو العقار والبنية التحتية وقدرة التدفقات على دعم التوزيعات.",
    officialUrls: {
      marketProfile: "https://www.dfm.ae/en/issuers/listed-securities/securities/company-profile-page?id=EMPOWER",
      disclosures: "https://www.dfm.ae/en/the-exchange/news-and-disclosures/company-disclosures",
      dividends: DFM_DIVIDENDS,
      investorRelations: "https://www.empower.ae/investor-relations/",
    },
  },
  {
    symbol: "EMAAR",
    nameAr: "إعمار العقارية",
    nameEn: "Emaar Properties PJSC",
    market: "DFM",
    sector: "العقار",
    profile: "شركة عقارية قيادية في دبي، وتظل قراءتها مرتبطة بدورة العقار والمبيعات والتدفقات النقدية.",
    officialUrls: {
      marketProfile: "https://www.dfm.ae/en/issuers/listed-securities/securities/company-profile-page?id=EMAAR",
      disclosures: "https://www.dfm.ae/en/the-exchange/news-and-disclosures/company-disclosures",
      dividends: DFM_DIVIDENDS,
      investorRelations: "https://properties.emaar.com/en/investor-relations/",
    },
  },
  {
    symbol: "TECOM",
    nameAr: "تيكوم",
    nameEn: "TECOM Group PJSC",
    market: "DFM",
    sector: "مناطق الأعمال",
    profile: "مشغل مجمعات ومناطق أعمال، وتدور قراءته حول الإشغال والإيرادات المتكررة والتوزيعات.",
    officialUrls: {
      marketProfile: "https://www.dfm.ae/en/issuers/listed-securities/securities/company-profile-page?id=TECOM",
      disclosures: "https://www.dfm.ae/en/the-exchange/news-and-disclosures/company-disclosures",
      dividends: DFM_DIVIDENDS,
      investorRelations: "https://www.tecomgroup.ae/investor-relations",
    },
  },
  {
    symbol: "NMDCENR",
    nameAr: "إن إم دي سي للطاقة",
    nameEn: "NMDC Energy P.J.S.C",
    market: "ADX",
    sector: "الطاقة والخدمات البحرية",
    profile: "شركة مشاريع وخدمات للطاقة والبنية البحرية، وتتأثر بدورية العقود وتنفيذ المشاريع.",
    officialUrls: {
      marketProfile: "https://www.adx.ae/en/main-market/company-profile/overview?symbols=NMDCENR",
      disclosures: "https://www.adx.ae/en/main-market/company-profile/disclosures?symbols=NMDCENR",
      dividends: ADX_DIVIDENDS,
    },
  },
  {
    symbol: "EAND",
    nameAr: "مجموعة إي آند",
    nameEn: "Emirates Telecommunications Group Company PJSC",
    market: "ADX",
    sector: "الاتصالات",
    profile: "مجموعة اتصالات واستثمارات رقمية إقليمية، تجمع بين التدفقات الدفاعية والتوسع الخارجي.",
    officialUrls: {
      marketProfile: "https://www.adx.ae/en/main-market/company-profile/overview?symbols=EAND",
      disclosures: "https://www.adx.ae/en/main-market/company-profile/disclosures?symbols=EAND",
      dividends: ADX_DIVIDENDS,
      investorRelations: "https://eand.com/en/investors.jsp",
    },
  },
  {
    symbol: "ADNOCDIST",
    nameAr: "أدنوك للتوزيع",
    nameEn: "ADNOC Distribution",
    market: "ADX",
    sector: "الطاقة والتجزئة",
    profile: "شركة توزيع وقود وخدمات تجزئة ترتبط بانتشار الشبكة وهوامش الوقود والإنفاق الرأسمالي.",
    officialUrls: {
      marketProfile: "https://www.adx.ae/en/main-market/company-profile/overview?symbols=ADNOCDIST",
      disclosures: "https://www.adx.ae/en/main-market/company-profile/disclosures?symbols=ADNOCDIST",
      dividends: ADX_DIVIDENDS,
      investorRelations: "https://www.adnocdistribution.ae/en/investor-relations/",
    },
  },
  {
    symbol: "ADNOCGAS",
    nameAr: "أدنوك للغاز",
    nameEn: "ADNOC Gas PLC",
    market: "ADX",
    sector: "الغاز والطاقة",
    profile: "شركة غاز كبرى، وتتأثر قراءتها بأسعار الطاقة والعقود طويلة الأجل والإنفاق الرأسمالي.",
    officialUrls: {
      marketProfile: "https://www.adx.ae/en/main-market/company-profile/overview?symbols=ADNOCGAS",
      disclosures: "https://www.adx.ae/en/main-market/company-profile/disclosures?symbols=ADNOCGAS",
      dividends: ADX_DIVIDENDS,
      investorRelations: "https://www.adnocgas.ae/en/investor-relations",
    },
  },
  {
    symbol: "ADNOCDRILL",
    nameAr: "أدنوك للحفر",
    nameEn: "ADNOC Drilling Company PJSC",
    market: "ADX",
    sector: "خدمات الطاقة",
    profile: "شركة خدمات حفر مرتبطة بخطط توسع الطاقة والعقود طويلة الأجل ومستويات الإنفاق الرأسمالي.",
    officialUrls: {
      marketProfile: "https://www.adx.ae/en/main-market/company-profile/overview?symbols=ADNOCDRILL",
      disclosures: "https://www.adx.ae/en/main-market/company-profile/disclosures?symbols=ADNOCDRILL",
      dividends: ADX_DIVIDENDS,
      investorRelations: "https://www.adnocdrilling.ae/en/investor-relations",
    },
  },
  {
    symbol: "FAB",
    nameAr: "بنك أبوظبي الأول",
    nameEn: "First Abu Dhabi Bank",
    market: "ADX",
    sector: "البنوك",
    profile: "بنك قيادي في أبوظبي والمنطقة، ترتبط قراءته بالربحية ورأس المال وجودة الأصول.",
    officialUrls: {
      marketProfile: "https://www.adx.ae/en/main-market/company-profile/overview?symbols=FAB",
      disclosures: "https://www.adx.ae/en/main-market/company-profile/disclosures?symbols=FAB",
      dividends: ADX_DIVIDENDS,
      investorRelations: "https://www.bankfab.com/en-ae/about-fab/investor-relations",
    },
  },
  {
    symbol: "ADCB",
    nameAr: "بنك أبوظبي التجاري",
    nameEn: "Abu Dhabi Commercial Bank",
    market: "ADX",
    sector: "البنوك",
    profile: "بنك تجاري إماراتي كبير، تتأثر قراءته بنمو القروض وجودة الائتمان وكفاءة رأس المال.",
    officialUrls: {
      marketProfile: "https://www.adx.ae/en/main-market/company-profile/overview?symbols=ADCB",
      disclosures: "https://www.adx.ae/en/main-market/company-profile/disclosures?symbols=ADCB",
      dividends: ADX_DIVIDENDS,
      investorRelations: "https://www.adcb.com/en/about-us/investor-relations/",
    },
  },
  {
    symbol: "ADIB",
    nameAr: "مصرف أبوظبي الإسلامي",
    nameEn: "Abu Dhabi Islamic Bank",
    market: "ADX",
    sector: "البنوك الإسلامية",
    profile: "مصرف إسلامي إماراتي تتركز قراءته في نمو التمويلات وجودة الأصول وربحية حقوق الملكية.",
    officialUrls: {
      marketProfile: "https://www.adx.ae/en/main-market/company-profile/overview?symbols=ADIB",
      disclosures: "https://www.adx.ae/en/main-market/company-profile/disclosures?symbols=ADIB",
      dividends: ADX_DIVIDENDS,
      investorRelations: "https://www.adib.ae/en/Pages/Investor-Relations.aspx",
    },
  },
  {
    symbol: "ADNIC",
    nameAr: "أبوظبي الوطنية للتأمين",
    nameEn: "Abu Dhabi National Insurance Company",
    market: "ADX",
    sector: "التأمين",
    profile: "شركة تأمين وطنية تتأثر بنتائج الاكتتاب ودورات المطالبات وعوائد الاستثمار.",
    officialUrls: {
      marketProfile: "https://www.adx.ae/en/main-market/company-profile/overview?symbols=ADNIC",
      disclosures: "https://www.adx.ae/en/main-market/company-profile/disclosures?symbols=ADNIC",
      dividends: ADX_DIVIDENDS,
      investorRelations: "https://www.adnic.ae/investor-relations",
    },
  },
  ...additionalStockConfigs,
];

export const stockSymbols = stocksConfig.map((stock) => stock.symbol);
