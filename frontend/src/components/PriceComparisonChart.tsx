import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MarketHistory } from "../types/market";
import { comparisonDate, comparisonNumber, comparisonValue, type ComparisonPoint } from "../utils/comparison";

type PriceComparisonChartProps = {
  points: ComparisonPoint[];
  first: MarketHistory;
  second: MarketHistory;
  mode: "performance" | "price";
};

export default function PriceComparisonChart({ points, first, second, mode }: PriceComparisonChartProps) {
  const performance = mode === "performance";

  return (
    <div className="relative-comparison-chart">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <LineChart
          data={points}
          margin={{ top: 20, right: 12, left: 10, bottom: 3 }}
          accessibilityLayer
          aria-label={`Comparação de ${first.ticker} e ${second.ticker}, ${performance ? "desempenho em base 100" : "preços de fechamento"}. Use as setas para percorrer as observações.`}
        >
          <CartesianGrid stroke="#202329" vertical={false} />
          <XAxis dataKey="date" tickFormatter={(date: string) => comparisonDate(date).slice(0, 5)} minTickGap={38} tick={{ fill: "#969ca6", fontSize: 11 }} tickLine={false} axisLine={{ stroke: "#30343b" }} height={34} tickMargin={10} />
          <YAxis orientation="right" domain={["auto", "auto"]} tickFormatter={(value) => Number(value).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} tick={{ fill: "#969ca6", fontSize: 11 }} tickLine={false} axisLine={false} width={76} tickMargin={8} tickCount={5} />
          <Tooltip
            cursor={{ stroke: "#8a919a", strokeDasharray: "3 3" }}
            contentStyle={{ background: "#15171b", border: "1px solid #393d44", borderRadius: 1, fontSize: 12 }}
            labelStyle={{ color: "#c7cbd2", marginBottom: 6 }}
            labelFormatter={(label) => comparisonDate(String(label))}
            formatter={(value, name) => [performance ? `${comparisonNumber(Number(value))} (base 100)` : comparisonValue(Number(value), first), name]}
          />
          {performance && <ReferenceLine y={100} stroke="#68717d" strokeDasharray="4 4" />}
          <Line type="linear" dataKey={performance ? "firstBase" : "first.close"} name={first.ticker} stroke="#efa94e" strokeWidth={2} dot={points.length === 1 ? { r: 3, fill: "#efa94e" } : false} isAnimationActive={false} connectNulls={false} activeDot={{ r: 4, stroke: "#101216", strokeWidth: 2 }} />
          <Line type="linear" dataKey={performance ? "secondBase" : "second.close"} name={second.ticker} stroke="#92b2e4" strokeWidth={2} strokeDasharray="5 3" dot={points.length === 1 ? { r: 3, fill: "#92b2e4" } : false} isAnimationActive={false} connectNulls={false} activeDot={{ r: 4, stroke: "#101216", strokeWidth: 2 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
