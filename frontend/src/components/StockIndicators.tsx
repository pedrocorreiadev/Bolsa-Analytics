
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

  const maiorPreco = Math.max(...precos);
  const menorPreco = Math.min(...precos);

  const precoMedio =
    precos.reduce((total, preco) => total + preco, 0) /
    precos.length;

  const variacaoReais = precoAtual - precoInicial;

  const variacaoPercentual =
    precoInicial !== 0
      ? (variacaoReais / precoInicial) * 100
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
      valor: `${variacaoPercentual >= 0 ? "+" : ""}${variacaoPercentual.toFixed(2)}%`,
      destaque: true,
    },
    {
      titulo: "Maior preço",
      valor: formatarMoeda(maiorPreco),
    },
    {
      titulo: "Menor preço",
      valor: formatarMoeda(menorPreco),
    },
    {
      titulo: "Preço médio",
      valor: formatarMoeda(precoMedio),
    },
    {
      titulo: "Variação em reais",
      valor: `${variacaoReais >= 0 ? "+" : ""}${formatarMoeda(variacaoReais)}`,
      destaque: true,
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
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          }}
        >
          <p
            style={{
              color: "#64748b",
              margin: 0,
              fontSize: "14px",
            }}
          >
            {item.titulo}
          </p>

          <h2
            style={{
              color: item.destaque
                ? variacaoReais >= 0
                  ? "#16a34a"
                  : "#dc2626"
                : "#0f172a",
              fontSize: "24px",
              marginBottom: 0,
            }}
          >
            {item.valor}
          </h2>
        </div>
      ))}
    </div>
  );
}
