import type { OHLCVPoint } from "../types/market";

export default function Sparkline({ data }: { data: OHLCVPoint[] }) {
  if (data.length < 2) return <div className="sparkline-placeholder" aria-hidden="true" />;
  const min = Math.min(...data.map((point) => point.close));
  const max = Math.max(...data.map((point) => point.close));
  const span = max - min || 1;
  const points = data.map((point, index) => `${(index / (data.length - 1)) * 240},${46 - ((point.close - min) / span) * 40}`).join(" ");
  const positive = data.at(-1)!.close >= data[0].close;
  return <svg className="sparkline" viewBox="0 0 240 52" preserveAspectRatio="none" aria-hidden="true"><path d="M0 51 H240" stroke="#292c30" /><polyline points={points} fill="none" stroke={positive ? "var(--green)" : "var(--red)"} strokeWidth="1.6" vectorEffect="non-scaling-stroke" /></svg>;
}
