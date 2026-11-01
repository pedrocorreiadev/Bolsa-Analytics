import { useContext, useEffect } from "react";
import { MarketOverviewContext } from "../context/MarketOverviewContext";
export type { MarketRow } from "../context/MarketOverviewContext";

export function useMarketOverview() {
  const context = useContext(MarketOverviewContext);
  if (!context) throw new Error("MarketOverviewProvider ausente.");
  const { load } = context;
  useEffect(() => { void load(); }, [load]);
  return { ...context, loading: context.status !== "ready", reload: () => load(true) };
}
