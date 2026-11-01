import { createContext } from "react";
import type { MarketAsset, MarketHistory } from "../types/market";

export type MarketRow = { asset: MarketAsset; history?: MarketHistory; error?: string; loading: boolean };
export type OverviewState = { status: "idle" | "loading" | "ready"; rows: MarketRow[]; error: string };
export type OverviewContextValue = OverviewState & { load: (force?: boolean) => Promise<void> };
export const MarketOverviewContext = createContext<OverviewContextValue | null>(null);
