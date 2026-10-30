import { MARKET_INTERVALS, MARKET_PERIODS, intervalosPermitidos, type MarketHistory, type MarketInterval, type MarketPeriod, type OHLCVPoint } from "../types/market.ts";
import { formatMarketDate, formatMarketPercent, formatMarketValue } from "./formatMarket.ts";

export const comparisonPeriods = MARKET_PERIODS;

export function comparisonIntervals(period: MarketPeriod): { value: MarketInterval; label: string }[] {
  return MARKET_INTERVALS.filter((option) => intervalosPermitidos(period).includes(option.value));
}

export type ComparisonPoint = {
  date: string;
  first: OHLCVPoint;
  second: OHLCVPoint;
  firstBase: number | null;
  secondBase: number | null;
};

export type ComparisonSummary = {
  initial: number;
  latest: number;
  change: number | null;
  changePercent: number | null;
  high: number;
  low: number;
  averageClose: number;
  latestVolume: number | null;
};

function summarize(data: OHLCVPoint[]): ComparisonSummary {
  const initial = data[0].close;
  const latest = data[data.length - 1].close;
  const change = data.length > 1 ? latest - initial : null;
  return {
    initial,
    latest,
    change,
    changePercent: change !== null && initial !== 0 ? (change / initial) * 100 : null,
    high: Math.max(...data.map((point) => point.high)),
    low: Math.min(...data.map((point) => point.low)),
    averageClose: data.reduce((sum, point) => sum + point.close, 0) / data.length,
    latestVolume: data[data.length - 1].volume,
  };
}

function returnCorrelation(points: ComparisonPoint[]): number | null {
  const pairs: [number, number][] = [];
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    if (previous.first.close === 0 || previous.second.close === 0) continue;
    pairs.push([
      (points[index].first.close - previous.first.close) / previous.first.close,
      (points[index].second.close - previous.second.close) / previous.second.close,
    ]);
  }
  if (pairs.length < 3) return null;
  const averageFirst = pairs.reduce((sum, pair) => sum + pair[0], 0) / pairs.length;
  const averageSecond = pairs.reduce((sum, pair) => sum + pair[1], 0) / pairs.length;
  let covariance = 0;
  let varianceFirst = 0;
  let varianceSecond = 0;
  for (const [first, second] of pairs) {
    covariance += (first - averageFirst) * (second - averageSecond);
    varianceFirst += (first - averageFirst) ** 2;
    varianceSecond += (second - averageSecond) ** 2;
  }
  const denominator = Math.sqrt(varianceFirst * varianceSecond);
  return denominator === 0 ? null : Math.max(-1, Math.min(1, covariance / denominator));
}

/** Matches only observations actually present in both histories. No forward fill. */
export function compareHistories(first: MarketHistory, second: MarketHistory) {
  const firstByDate = new Map(first.data.map((point) => [point.date, point]));
  const secondByDate = new Map(second.data.map((point) => [point.date, point]));
  const commonDates = [...firstByDate.keys()].filter((date) => secondByDate.has(date)).sort();
  if (commonDates.length === 0) return null;

  const firstData = commonDates.map((date) => firstByDate.get(date)!);
  const secondData = commonDates.map((date) => secondByDate.get(date)!);
  const firstInitial = firstData[0].close;
  const secondInitial = secondData[0].close;
  const points: ComparisonPoint[] = commonDates.map((date, index) => ({
    date,
    first: firstData[index],
    second: secondData[index],
    firstBase: firstInitial !== 0 ? (firstData[index].close / firstInitial) * 100 : null,
    secondBase: secondInitial !== 0 ? (secondData[index].close / secondInitial) * 100 : null,
  }));
  const firstSummary = summarize(firstData);
  const secondSummary = summarize(secondData);

  return {
    points,
    firstData,
    secondData,
    firstSummary,
    secondSummary,
    start: commonDates[0],
    end: commonDates[commonDates.length - 1],
    count: commonDates.length,
    excludedFirst: firstByDate.size - commonDates.length,
    excludedSecond: secondByDate.size - commonDates.length,
    differencePercentagePoints: firstSummary.changePercent !== null && secondSummary.changePercent !== null
      ? firstSummary.changePercent - secondSummary.changePercent
      : null,
    correlation: returnCorrelation(points),
    comparablePrices: first.unit === second.unit && Boolean(first.currency && first.currency === second.currency),
    normalizable: firstInitial !== 0 && secondInitial !== 0 && commonDates.length > 1,
  };
}

export const comparisonNumber = (value: number, maximumFractionDigits = 2) =>
  value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits });

export const comparisonPercent = (value: number | null) =>
  value === null ? "—" : formatMarketPercent(value);

export const comparisonChangeClass = (value: number | null) =>
  value === null || value === 0 ? "neutral" : value > 0 ? "positive" : "negative";

export function comparisonValue(value: number | null, history: Pick<MarketHistory, "currency" | "unit">) {
  if (value === null) return "—";
  try {
    return formatMarketValue(value, history.currency, history.unit);
  } catch {
    return `${comparisonNumber(value, 4)} ${history.currency || "unid."}`;
  }
}

/** Dates are daily source labels, not local-midnight timestamps to convert. */
export function comparisonDate(date: string) {
  return formatMarketDate(date);
}
