
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import type { StockPoint } from "../data/stocks";

type StockChartProps = {
  dados: StockPoint[];
};

export default function StockChart({
  dados,
}: StockChartProps) {
  return (
    <div style={{ width: "100%" }}>
      <h2>Evolução do preço da ação</h2>
      <p>Dados fictícios para demonstração</p>

      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dados}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="dia" />
            <YAxis domain={["auto", "auto"]} />
            <Tooltip
              formatter={(valor) => [
                `R$ ${Number(valor).toFixed(2)}`,
                "Preço",
              ]}
            />
            <Line
              type="monotone"
              dataKey="preco"
              stroke="#059669"
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
