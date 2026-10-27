
import type { StockPoint } from "../data/stocks";

type StockIndicatorsProps = {
  dados: StockPoint[];
};

export default function StockIndicators({
  dados,
}: StockIndicatorsProps) {
  if (dados.length === 0) {
    return <p>Nenhum dado disponível.</p>;
  }

  const precos = dados.map((item) => item.preco);

  const precoAtual = precos[precos.length - 1];
  const precoInicial = precos[0];

  const variacao =
    precoInicial !== 0
      ? ((precoAtual - precoInicial) / precoInicial) * 100
      : 0;

  const formatarMoeda = (valor: number) =>
    valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  const indicadores = [
    {
      titulo: "Preço atual",
      valor: formatarMoeda(precoAtual),
    },
    {
      titulo: "Variação no período",
      valor: `${variacao >= 0 ? "▲ +" : "▼ "}${variacao.toFixed(2)}%`,
    },
    {
      titulo: "Maior preço",
      valor: formatarMoeda(Math.max(...precos)),
    },
    {
      titulo: "Menor preço",
      valor: formatarMoeda(Math.min(...precos)),
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "16px",
        marginBottom: "24px",
      }}
    >
      {indicadores.map((item) => (
        <div
          key={item.titulo}
          style={{
            background: "#ffffff",
            padding: "20px",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
          }}
        >
          <p style={{ color: "#64748b", margin: 0 }}>
            {item.titulo}
          </p>

          <h2
            style={{
              color:
                item.titulo === "Variação no período"
                  ? variacao >= 0
                    ? "#16a34a"
                    : "#dc2626"
                  : "#0f172a",
            }}
          >
            {item.valor}
          </h2>
        </div>
      ))}
    </div>
  );
}
