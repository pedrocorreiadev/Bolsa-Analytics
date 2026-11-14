import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MarketHistory } from "../types/market";
import { comparisonDate, comparisonNumber, comparisonValue, type ComparisonPoint } from "../utils/comparison";
import { CHART_COLORS } from "../utils/chartTheme";
import "../styles/charts.css";

type PriceComparisonChartProps = {
  points: ComparisonPoint[];
  first: MarketHistory;
  second: MarketHistory;
  mode: "performance" | "price";
};

export default function PriceComparisonChart({ points, first, second, mode }: PriceComparisonChartProps) {
  const performance = mode === "performance";

  if (points.length === 0) {
    return <div className="chart-empty" role="status">Nenhum dado em comum disponível para o gráfico.</div>;
  }

  return (
    <div className="relative-comparison-chart">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <LineChart
          data={points}
          margin={{ top: 20, right: 12, left: 10, bottom: 3 }}
          accessibilityLayer
          aria-label={`Comparação de ${first.ticker} e ${second.ticker}, ${performance ? "desempenho em base 100" : "preços de fechamento"}. Use as setas para percorrer as observações.`}
        >
          <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
          <XAxis dataKey="date" tickFormatter={(date: string) => comparisonDate(date).slice(0, 5)} minTickGap={38} tick={{ fill: CHART_COLORS.text, fontSize: 11 }} tickLine={false} axisLine={{ stroke: CHART_COLORS.border }} height={34} tickMargin={10} />
          <YAxis orientation="right" domain={["auto", "auto"]} tickFormatter={(value) => Number(value).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} tick={{ fill: CHART_COLORS.text, fontSize: 11 }} tickLine={false} axisLine={false} width={76} tickMargin={8} tickCount={5} />
          <Tooltip
            cursor={{ stroke: "#75829a", strokeDasharray: "3 3" }}
            contentStyle={{ background: "#1b2230", border: `1px solid ${CHART_COLORS.border}`, borderRadius: 7, boxShadow: "0 6px 24px #0004", fontSize: 12, padding: "10px 13px" }}
            labelStyle={{ color: "#b3bdcd", marginBottom: 6 }}
            labelFormatter={(label) => comparisonDate(String(label))}
            formatter={(value, name) => [performance ? `${comparisonNumber(Number(value))} (base 100)` : comparisonValue(Number(value), first), name]}
          />
          {performance && <ReferenceLine y={100} stroke="#7e8ba1" strokeDasharray="4 4" />}
          <Line type="linear" dataKey={performance ? "firstBase" : "first.close"} name={first.ticker} stroke={CHART_COLORS.primary} strokeWidth={2} dot={points.length === 1 ? { r: 3, fill: CHART_COLORS.primary } : false} isAnimationActive={false} connectNulls={false} activeDot={{ r: 5, fill: CHART_COLORS.primary, stroke: CHART_COLORS.background, strokeWidth: 2 }} />
          <Line type="linear" dataKey={performance ? "secondBase" : "second.close"} name={second.ticker} stroke={CHART_COLORS.secondary} strokeWidth={2} strokeDasharray="5 3" dot={points.length === 1 ? { r: 3, fill: CHART_COLORS.secondary } : false} isAnimationActive={false} connectNulls={false} activeDot={{ r: 5, fill: CHART_COLORS.secondary, stroke: CHART_COLORS.background, strokeWidth: 2 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
