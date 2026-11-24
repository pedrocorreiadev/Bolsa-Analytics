import { useId } from "react";
import type { OHLCVPoint } from "../types/market";

export default function Sparkline({ data }: { data: OHLCVPoint[] }) {
  const gradientId = useId().replace(/:/g, "");
  if (data.length < 2) return <div className="sparkline-placeholder" aria-hidden="true" />;

  const min = Math.min(...data.map((point) => point.close));
  const max = Math.max(...data.map((point) => point.close));
  const span = max - min;
  const coords = data.map((point, index) => ({
    x: 3 + (index / (data.length - 1)) * 314,
    y: span === 0 ? 36 : 60 - ((point.close - min) / span) * 48,
  }));
  const points = coords.map(({ x, y }) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const direction = data.at(-1)!.close - data[0].close;
  const color = direction === 0 ? "var(--muted)" : direction > 0 ? "var(--green)" : "var(--red)";
  const last = coords.at(-1)!;

  return <svg className="sparkline" viewBox="0 0 320 72" preserveAspectRatio="none" aria-hidden="true">
    <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity=".2" /><stop offset="100%" stopColor={color} stopOpacity=".01" /></linearGradient></defs>
    <path d="M0 24H320M0 48H320M0 71H320" className="sparkline-grid" fill="none" vectorEffect="non-scaling-stroke" />
    <polygon points={`3,72 ${points} 317,72`} fill={`url(#${gradientId})`} />
    <polyline points={points} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    <circle cx={last.x} cy={last.y} r="2.8" fill={color} />
  </svg>;
}
