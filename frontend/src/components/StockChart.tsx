
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

type StockChartProps = {
  dados: StockPoint[];
};

export default function StockChart({
  dados,
}: StockChartProps) {
  if (dados.length === 0) {
    return <p>Nenhum dado disponível para o gráfico.</p>;
  }

  const precoMedio =
    dados.reduce((total, item) => total + item.preco, 0) /
    dados.length;

  const formatarMoeda = (valor: number) =>
    valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  return (
    <div style={{ width: "100%", marginBottom: "30px" }}>
      <h2>Evolução do preço da ação</h2>

      <p style={{ color: "#64748b" }}>
        Acompanhe a evolução dos preços e a média do período.
      </p>

      <div style={{ width: "100%", height: 350 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={dados}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 10,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e2e8f0"
            />

            <XAxis
              dataKey="dia"
              tick={{ fontSize: 12 }}
            />

            <YAxis
              domain={["auto", "auto"]}
              tickFormatter={(valor) =>
                `R$ ${Number(valor).toFixed(0)}`
              }
              tick={{ fontSize: 12 }}
            />

            <Tooltip
              formatter={(valor) => [
                formatarMoeda(Number(valor)),
                "Preço",
              ]}
            />

            <ReferenceLine
              y={precoMedio}
              stroke="#f59e0b"
              strokeDasharray="5 5"
              label={{
                value: "Preço médio",
                position: "insideTopRight",
                fill: "#b45309",
                fontSize: 12,
              }}
            />

            <Line
              type="monotone"
              dataKey="preco"
              stroke="#059669"
              strokeWidth={3}
              dot={{
                r: 3,
                fill: "#059669",
              }}
              activeDot={{
                r: 7,
                stroke: "#ffffff",
                strokeWidth: 2,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p
        style={{
          textAlign: "center",
          color: "#64748b",
          fontSize: "13px",
        }}
      >
        Preço médio do período:{" "}
        <strong>{formatarMoeda(precoMedio)}</strong>
      </p>
    </div>
  );
}
