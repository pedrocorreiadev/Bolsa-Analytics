import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { StockPoint } from "../data/stocks";
import { formatarMoeda, formatarNumero, resumirHistorico } from "../utils/market";
import "../styles/charts.css";

type StockChartProps = {
  dados: StockPoint[];
  codigo?: string;
};

export default function StockChart({ dados, codigo = "Ativo" }: StockChartProps) {
  const resumo = resumirHistorico(dados);

  if (!resumo) {
    return <div className="chart-empty" role="status">Nenhum dado disponível para o gráfico.</div>;
  }

  return (
    <figure className="stock-chart-figure">
      <div className="price-chart">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <LineChart
            data={dados}
            margin={{ top: 18, right: 8, left: 8, bottom: 2 }}
            accessibilityLayer
            aria-label={`Histórico simulado de ${codigo}. Use as setas para percorrer os preços.`}
          >
            <CartesianGrid stroke="#202329" vertical={false} />
            <XAxis
              dataKey="dia"
              axisLine={{ stroke: "#30343b" }}
              tickLine={false}
              tick={{ fill: "#969da8", fontSize: 11 }}
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
              tick={{ fill: "#969da8", fontSize: 11 }}
              tickMargin={10}
              width={66}
              tickCount={6}
            />
            <Tooltip
              cursor={{ stroke: "#666d77", strokeDasharray: "3 3" }}
              contentStyle={{ background: "#171a1f", border: "1px solid #353a42", borderRadius: 2, color: "#e8e9eb", fontSize: 12 }}
              labelStyle={{ color: "#aeb4be", marginBottom: 5 }}
              itemStyle={{ color: "#e7a84b" }}
              labelFormatter={(label) => `Data: ${label}`}
              formatter={(valor) => [formatarMoeda(Number(valor)), codigo]}
            />
            <ReferenceLine y={resumo.media} stroke="#838c99" strokeDasharray="5 5" />
            <Line
              type="linear"
              dataKey="preco"
              name={codigo}
              stroke="#e7a84b"
              strokeWidth={2}
              dot={dados.length <= 7 ? { r: 3, fill: "#e7a84b", stroke: "#111419", strokeWidth: 2 } : false}
              activeDot={{ r: 5, fill: "#e7a84b", stroke: "#111419", strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="chart-legend">
        <span><i className="series-line series-primary" aria-hidden="true" />Preço em BRL</span>
        <span><i className="series-line series-average" aria-hidden="true" />Média do período <strong className="mono">{formatarMoeda(resumo.media)}</strong></span>
      </figcaption>
    </figure>
  );
}
