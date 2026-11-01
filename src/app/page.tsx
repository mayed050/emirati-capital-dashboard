import { Dashboard } from "@/components/Dashboard";
import { getMarketIndexes } from "@/lib/data/market-history";

export default function Home() {
  return <Dashboard marketIndexes={getMarketIndexes()} />;
}
