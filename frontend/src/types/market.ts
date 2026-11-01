export type MarketPeriod = "5d" | "1mo" | "3mo" | "6mo" | "1y" | "2y" | "5y";
export type MarketInterval = "1d" | "1wk" | "1mo";
export type MarketUnit = "currency" | "points";

export type MarketAsset = {
  id: string;
  ticker: string;
  name: string;
  category: string;
  currency: string;
  unit: MarketUnit;
  timezone?: string | null;
};

export type OHLCVPoint = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null;
};

export type MarketHistory = {
  asset: string;
  ticker: string;
  period: MarketPeriod;
  interval: MarketInterval;
  currency: string;
  unit: MarketUnit;
  timezone: string | null;
  source: string;
  count: number;
  data: OHLCVPoint[];
  /** Registros descartados na validação da resposta, nunca preenchidos artificialmente. */
  discarded?: number;
};

export const MARKET_PERIODS: ReadonlyArray<{ value: MarketPeriod; label: string }> = [
  { value: "5d", label: "5 dias" },
  { value: "1mo", label: "1 mês" },
  { value: "3mo", label: "3 meses" },
  { value: "6mo", label: "6 meses" },
  { value: "1y", label: "1 ano" },
  { value: "2y", label: "2 anos" },
  { value: "5y", label: "5 anos" },
];

export const MARKET_INTERVALS: ReadonlyArray<{ value: MarketInterval; label: string }> = [
  { value: "1d", label: "Diário" },
  { value: "1wk", label: "Semanal" },
  { value: "1mo", label: "Mensal" },
];

export function intervalosPermitidos(period: MarketPeriod): MarketInterval[] {
  if (period === "5d") return ["1d"];
  if (period === "1mo") return ["1d", "1wk"];
  return ["1d", "1wk", "1mo"];
}

export const isMarketPeriod = (value: string): value is MarketPeriod =>
  MARKET_PERIODS.some((period) => period.value === value);

export const isMarketInterval = (value: string): value is MarketInterval =>
  MARKET_INTERVALS.some((interval) => interval.value === value);
