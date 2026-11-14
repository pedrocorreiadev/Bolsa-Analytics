import { useId } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { StockPoint } from "../data/stocks";
import { formatarMoeda, formatarNumero, resumirHistorico } from "../utils/market";
import { CHART_COLORS } from "../utils/chartTheme";
import "../styles/charts.css";

type StockChartProps = {
  dados: StockPoint[];
  codigo?: string;
};

export default function StockChart({ dados, codigo = "Ativo" }: StockChartProps) {
  const resumo = resumirHistorico(dados);
  const gradientId = useId();

  if (!resumo) {
    return <div className="chart-empty" role="status">Nenhum dado disponível para o gráfico.</div>;
  }

  return (
    <figure className="stock-chart-figure">
      <div className="price-chart">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <AreaChart
            data={dados}
            margin={{ top: 18, right: 8, left: 8, bottom: 2 }}
            accessibilityLayer
            aria-label={`Histórico simulado de ${codigo}. Use as setas para percorrer os preços.`}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={0.2} />
                <stop offset="100%" stopColor={CHART_COLORS.primary} stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
            <XAxis
              dataKey="dia"
              axisLine={{ stroke: CHART_COLORS.border }}
              tickLine={false}
              tick={{ fill: CHART_COLORS.text, fontSize: 11 }}
              minTickGap={36}
              tickMargin={12}
              height={36}
            />
            <YAxis
              orientation="right"
              domain={["auto", "auto"]}
              tickFormatter={(valor) => formatarNumero(Number(valor))}
              axisLine={false}
              tickLine={false}
              tick={{ fill: CHART_COLORS.text, fontSize: 11 }}
              tickMargin={10}
              width={66}
              tickCount={6}
            />
            <Tooltip
              cursor={{ stroke: "#75829a", strokeDasharray: "3 3" }}
              contentStyle={{ background: "#1b2230", border: `1px solid ${CHART_COLORS.border}`, borderRadius: 7, boxShadow: "0 6px 24px #0004", color: "#e8edf5", fontSize: 12, padding: "10px 13px" }}
              labelStyle={{ color: "#b3bdcd", marginBottom: 6 }}
              itemStyle={{ color: CHART_COLORS.primary }}
              labelFormatter={(label) => `Data: ${label}`}
              formatter={(valor) => [formatarMoeda(Number(valor)), codigo]}
            />
            <ReferenceLine y={resumo.media} stroke="#7e8ba1" strokeDasharray="5 5" />
            <Area
              type="linear"
              dataKey="preco"
              name={codigo}
              stroke={CHART_COLORS.primary}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              baseValue="dataMin"
              dot={dados.length <= 7 ? { r: 3, fill: CHART_COLORS.primary, stroke: CHART_COLORS.background, strokeWidth: 2 } : false}
              activeDot={{ r: 5, fill: CHART_COLORS.primary, stroke: CHART_COLORS.background, strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="chart-legend">
        <span><i className="series-line series-primary" aria-hidden="true" />Preço em BRL</span>
        <span><i className="series-line series-average" aria-hidden="true" />Média do período <strong className="mono">{formatarMoeda(resumo.media)}</strong></span>
      </figcaption>
    </figure>
  );
}
