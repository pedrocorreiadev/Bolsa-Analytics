
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const dados = [
  { dia: "Seg", preco: 28.5 },
  { dia: "Ter", preco: 29.1 },
  { dia: "Qua", preco: 28.8 },
  { dia: "Qui", preco: 30.4 },
  { dia: "Sex", preco: 31.2 },
];

export default function StockChart() {
  return (
    <div style={{ width: "100%", maxWidth: 700 }}>
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
              stroke="#2563eb"
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
