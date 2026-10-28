
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
  ReferenceLine,
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

  const calcularVariacao = (precos: number[]) => {
    const inicial = precos[0];
    const final = precos[precos.length - 1];

    return inicial !== 0
      ? ((final - inicial) / inicial) * 100
      : 0;
  };

  const variacao1 = calcularVariacao(
    historico1.map((item) => item.preco)
  );

  const variacao2 = calcularVariacao(
    historico2.map((item) => item.preco)
  );

  const diferenca = Math.abs(variacao1 - variacao2);

  const mesmaAcao = acao1 === acao2;

  const melhorAcao =
    mesmaAcao || Math.abs(variacao1 - variacao2) < 0.000001
      ? "Empate"
      : variacao1 > variacao2
        ? acao1
        : acao2;

  const dadosComparacao = historico1.map(
    (item, index) => ({
      dia: item.dia,
      primeira: Number(
        ((item.preco / historico1[0].preco) * 100).toFixed(2)
      ),
      segunda: Number(
        ((historico2[index].preco /
          historico2[0].preco) * 100).toFixed(2)
      ),
    })
  );

  const formatarPercentual = (valor: number) =>
    `${valor >= 0 ? "+" : ""}${valor.toFixed(2)}%`;

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
                {codigo} - {stocks[codigo].nome}
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
                {codigo} - {stocks[codigo].nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {mesmaAcao && (
        <p style={{ color: "#b45309" }}>
          Selecione ações diferentes para comparar empresas.
        </p>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        {[
          {
            titulo: `Variação ${acao1}`,
            valor: formatarPercentual(variacao1),
          },
          {
            titulo: `Variação ${acao2}`,
            valor: formatarPercentual(variacao2),
          },
          {
            titulo: "Melhor desempenho",
            valor: melhorAcao,
          },
          {
            titulo: "Diferença de desempenho",
            valor: `${diferenca.toFixed(2)} p.p.`,
          },
        ].map((indicador) => (
          <div
            key={indicador.titulo}
            style={{
              padding: "18px",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              background: "#ffffff",
            }}
          >
            <p style={{ color: "#64748b" }}>
              {indicador.titulo}
            </p>
            <h3>{indicador.valor}</h3>
          </div>
        ))}
      </div>

      <p style={{ fontSize: "12px", color: "#64748b" }}>
        Comparação de desempenho relativo (base 100).
        Dados simulados para fins acadêmicos.
      </p>

      <div style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dadosComparacao}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="dia" />
            <YAxis domain={["auto", "auto"]} />
            <Tooltip
              formatter={(valor, nome) => [
                Number(valor).toFixed(2),
                nome === "primeira" ? acao1 : acao2,
              ]}
            />
            <Legend
              formatter={(value) =>
                value === "primeira" ? acao1 : acao2
              }
            />
            <ReferenceLine
              y={100}
              stroke="#94a3b8"
              strokeDasharray="5 5"
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
