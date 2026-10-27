
import { useState } from "react";
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
  const [acao1, setAcao1] = useState("PETR4");
  const [acao2, setAcao2] = useState("VALE3");

  const codigos = Object.keys(stocks);

  const historico1 = gerarHistorico(
    stocks[acao1].dados[0].preco,
    periodo
  );

  const historico2 = gerarHistorico(
    stocks[acao2].dados[0].preco,
    periodo
  );

  const dadosComparacao = historico1.map(
    (item, index) => ({
      dia: item.dia,
      primeira: Number(
        ((item.preco / historico1[0].preco) * 100).toFixed(2)
      ),
      segunda: Number(
        ((historico2[index].preco / historico2[0].preco) * 100).toFixed(2)
      ),
    })
  );

  return (
    <section style={{ marginTop: "40px" }}>
      <h2>Comparação entre ações</h2>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "16px",
          margin: "20px 0",
        }}
      >
        <div>
          <label htmlFor="acao1">Primeira ação</label>
          <select
            id="acao1"
            value={acao1}
            onChange={(e) => setAcao1(e.target.value)}
            style={{ display: "block", padding: "10px" }}
          >
            {codigos.map((codigo) => (
              <option key={codigo} value={codigo}>
                {codigo}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="acao2">Segunda ação</label>
          <select
            id="acao2"
            value={acao2}
            onChange={(e) => setAcao2(e.target.value)}
            style={{ display: "block", padding: "10px" }}
          >
            {codigos.map((codigo) => (
              <option key={codigo} value={codigo}>
                {codigo}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p style={{ fontSize: "12px", color: "#64748b" }}>
        Comparação de desempenho relativo (base 100).
        Dados simulados.
      </p>

      <div style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dadosComparacao}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="dia" />
            <YAxis domain={["auto", "auto"]} />
            <Tooltip />
            <Legend
              formatter={(value) =>
                value === "primeira" ? acao1 : acao2
              }
            />

            <Line
              type="monotone"
              dataKey="primeira"
              stroke="#2563eb"
              strokeWidth={3}
              dot={false}
            />

            <Line
              type="monotone"
              dataKey="segunda"
              stroke="#16a34a"
              strokeWidth={3}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
