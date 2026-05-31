"use client";

import Image from "next/image";
import { useMemo, useState, type CSSProperties } from "react";
import type { StockRecord } from "@/types";

type StockIconStock = Pick<StockRecord, "symbol" | "nameAr" | "officialUrls">;
type StockIconSize = "sm" | "md" | "lg";

const iconDomains: Record<string, string> = {
  DEWA: "dewa.gov.ae",
  SALIK: "salik.ae",
  TALABAT: "talabat.com",
  DIB: "dib.ae",
  EMIRATESNBD: "emiratesnbd.com",
  DU: "du.ae",
  EMPOWER: "empower.ae",
  EMAAR: "emaar.com",
  TECOM: "tecomgroup.ae",
  NMDCENR: "nmdc-energy.com",
  EAND: "eand.com",
  ADNOCDIST: "adnocdistribution.ae",
  ADNOCGAS: "adnocgas.ae",
  ADNOCDRILL: "adnocdrilling.ae",
  FAB: "bankfab.com",
  ADCB: "adcb.com",
  ADIB: "adib.ae",
  ADNIC: "adnic.ae",
  EMAARDEV: "emaar.com",
  MASQ: "mashreq.com",
  AIRARABIA: "airarabia.com",
  PARKIN: "parkin.ae",
  DUBAIRESI: "dubairesidential.ae",
  DIC: "dubaiinvestments.com",
  DFM: "dfm.ae",
  GULFNAV: "gulfnav.com",
  GFH: "gfh.com",
  ALEC: "alec.ae",
  DTC: "dubaitaxi.ae",
  TABREED: "tabreed.ae",
  IHC: "ihcuae.com",
  TAQA: "taqa.com",
  BOROUGE: "borouge.com",
  ALPHADHABI: "alphadhabi.com",
  ALDAR: "aldar.com",
  MODON: "modon.com",
  ADNOCLS: "adnocls.ae",
  FERTIGLB: "fertiglobe.com",
  "2POINTZERO": "2pointzero.ae",
  ADPORTS: "adportsgroup.com",
  AMR: "americanarestaurants.com",
  SIB: "sib.ae",
  PRESIGHT: "presight.ai",
};

const sizeMap: Record<StockIconSize, string> = {
  sm: "1.75rem",
  md: "2.4rem",
  lg: "4rem",
};

export function StockIcon({ stock, size = "md", className = "" }: { stock: StockIconStock; size?: StockIconSize; className?: string }) {
  const [failedIconUrl, setFailedIconUrl] = useState("");
  const domain = useMemo(() => iconDomains[stock.symbol] ?? domainFromOfficialUrls(stock), [stock]);
  const iconUrl = domain ? `https://www.google.com/s2/favicons?sz=96&domain=${encodeURIComponent(domain)}` : "";
  const failed = failedIconUrl === iconUrl;

  const style = {
    background: avatarGradient(stock.symbol),
    width: sizeMap[size],
    height: sizeMap[size],
  } satisfies CSSProperties;

  return (
    <span className={`stock-avatar stock-icon ${className}`} style={style} title={`${stock.nameAr} (${stock.symbol})`} aria-label={`${stock.nameAr} ${stock.symbol}`}>
      {iconUrl && !failed ? (
        <Image src={iconUrl} alt="" width={96} height={96} unoptimized referrerPolicy="no-referrer" onError={() => setFailedIconUrl(iconUrl)} />
      ) : (
        <span className="stock-icon-fallback">{stock.symbol.slice(0, size === "sm" ? 2 : 3)}</span>
      )}
    </span>
  );
}

function domainFromOfficialUrls(stock: StockIconStock) {
  const url = stock.officialUrls.investorRelations ?? stock.officialUrls.marketProfile;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function avatarGradient(symbol: string) {
  let hue = 0;
  for (let index = 0; index < symbol.length; index += 1) {
    hue = (hue * 31 + symbol.charCodeAt(index)) % 360;
  }

  return `linear-gradient(135deg, hsl(${hue} 72% 48%), hsl(${(hue + 42) % 360} 74% 42%))`;
}
