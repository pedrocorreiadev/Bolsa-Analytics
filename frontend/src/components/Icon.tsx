import type { SVGProps } from "react";

// Local SVG artwork. A shared stroke keeps small toolbar and navigation icons legible.
const artwork = {
  user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" /></>,
  settings: <><path d="m9 3-.6 2.2-2 .9-2-.6L2.9 9l1.5 1.6v2.8L2.9 15l1.5 3.5 2-.6 2 .9L9 21h6l.6-2.2 2-.9 2 .6 1.5-3.5-1.5-1.6v-2.8L21.1 9l-1.5-3.5-2 .6-2-.9L15 3Z" /><circle cx="12" cy="12" r="3" /></>,
  shield: <><path d="m12 3 8 3v6c0 4.6-4.7 7.8-8 9-3.3-1.2-8-4.4-8-9V6Z" /><path d="m8.5 12 2.5 2.5 4.5-5" /></>,
  logout: <path d="M10 4H4v16h6M14 8l4 4-4 4m-6-4h10" />,
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="4" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="11" width="7" height="10" rx="1.5" /></>,
  market: <path d="m3 9 9-6 9 6H3Zm2 3v6m7-6v6m7-6v6M3 21h18" />,
  chart: <path d="M3 3v18h18M6 15l5-5 4 3 6-8" />,
  candles: <><path d="M6 3v4m0 9v5m6-18v10m0 5v3m6-18v3m0 9v6" /><rect x="3.5" y="7" width="5" height="9" rx=".8" /><rect x="9.5" y="13" width="5" height="5" rx=".8" /><rect x="15.5" y="6" width="5" height="9" rx=".8" /></>,
  trend: <path d="m3 17 6-6 4 4 8-10m-6 0h6v6" />,
  quotes: <path d="M2 13h4l3-8 5 15 3-9h5" />,
  "caret-down": <path d="m7 10 5 5 5-5" />,
  "chevron-left": <path d="m14 6-6 6 6 6" />,
  "chevron-right": <path d="m10 6 6 6-6 6" />,
  refresh: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M6.1 6.2A8 8 0 0 1 19.8 12M4.2 12a8 8 0 0 0 13.7 5.8" /></>,
  "arrow-up": <path d="M6 18 18 6M7 6h11v11" />,
  "arrow-down": <path d="m6 6 12 12M7 18h11V7" />,
  compare: <path d="M3 7h17m-4-4 4 4-4 4M21 17H4m4-4-4 4 4 4" />,
  history: <><path d="M3 4v5h5M3.6 9a9 9 0 1 1 .8 8" /><path d="M12 7v5l3 2" /></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
  layers: <path d="m12 3 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 16l9 5 9-5" />,
  database: <><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v7c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4m10-4v4M3 11h18m-13 4h1m6 0h1m-8 3h1" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  fit: <><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" /><rect x="8" y="8" width="8" height="8" rx="1" /></>,
  grid: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18m6-18v18M3 9h18M3 15h18" /></>,
  maximize: <path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" />,
  minimize: <path d="M3 8h5V3m8 0v5h5M3 16h5v5m8 0v-5h5" />,
} as const;

export type IconName = keyof typeof artwork;

type IconProps = Omit<SVGProps<SVGSVGElement>, "name" | "children"> & {
  name: IconName;
  size?: number;
};

export function Icon({ name, size = 18, ...props }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.65} strokeLinecap="round" strokeLinejoin="round" focusable="false" aria-hidden="true" {...props}>{artwork[name]}</svg>;
}
