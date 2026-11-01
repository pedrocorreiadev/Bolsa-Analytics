import type { MarketHistory } from "../types/market";

export function summarizeMarket(history?: MarketHistory | null) {
  if (!history?.data.length) return null;
  const first = history.data[0];
  const last = history.data.at(-1)!;
  const previous = history.data.at(-2);
  return {
    last,
    previous,
    dayChange: previous && previous.close !== 0 ? ((last.close - previous.close) / previous.close) * 100 : null,
    periodChange: first.close !== 0 ? ((last.close - first.close) / first.close) * 100 : null,
    high: Math.max(...history.data.map((point) => point.high)),
    low: Math.min(...history.data.map((point) => point.low)),
  };
}
