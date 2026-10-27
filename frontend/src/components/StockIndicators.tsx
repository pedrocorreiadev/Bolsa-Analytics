
const precos = [28.5, 29.1, 28.8, 30.4, 31.2];

export default function StockIndicators() {
  const precoAtual = precos[precos.length - 1];
  const precoInicial = precos[0];
  const variacao =
    ((precoAtual - precoInicial) / precoInicial) * 100;

  const maiorPreco = Math.max(...precos);
  const menorPreco = Math.min(...precos);

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
      valor: `${variacao >= 0 ? "+" : ""}${variacao.toFixed(2)}%`,
    },
    {
      titulo: "Maior preço",
      valor: formatarMoeda(maiorPreco),
    },
    {
      titulo: "Menor preço",
      valor: formatarMoeda(menorPreco),
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
          <p style={{ color: "#64748b", margin: 0 }}>
            {item.titulo}
          </p>
          <h2 style={{ color: "#0f172a" }}>
            {item.valor}
          </h2>
        </div>
      ))}
    </div>
  );
}
