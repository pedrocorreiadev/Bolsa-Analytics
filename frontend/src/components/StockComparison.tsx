
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import {
  stocks,
  gerarHistorico,
  type Periodo,
} from "../data/stocks";

type StockComparisonProps = {
  periodo: Periodo;
};

export default function StockComparison({
  periodo,
}: StockComparisonProps) {
  const petrobras = gerarHistorico(
    stocks.PETR4.dados[0].preco,
    periodo
  );

  const vale = gerarHistorico(
    stocks.VALE3.dados[0].preco,
    periodo
  );

  const dadosComparacao = petrobras.map(
    (item, index) => ({
      dia: item.dia,
      PETR4: Number(
        (
          (item.preco / petrobras[0].preco) *
          100
        ).toFixed(2)
      ),
      VALE3: Number(
        (
          (vale[index].preco / vale[0].preco) *
          100
        ).toFixed(2)
      ),
    })
  );

  return (
    <div style={{ marginTop: "40px" }}>
      <h2>Comparação entre ações</h2>

      <p>
        Petrobras (PETR4) x Vale (VALE3)
      </p>

      <p style={{ fontSize: "12px", color: "#64748b" }}>
        Desempenho relativo, base 100.
        Dados simulados.
      </p>

      <div style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dadosComparacao}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="dia" />
            <YAxis domain={["auto", "auto"]} />
            <Tooltip />
            <Legend />

            <Line
              type="monotone"
              dataKey="PETR4"
              stroke="#2563eb"
              strokeWidth={3}
              dot={false}
            />

            <Line
              type="monotone"
              dataKey="VALE3"
              stroke="#16a34a"
              strokeWidth={3}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
