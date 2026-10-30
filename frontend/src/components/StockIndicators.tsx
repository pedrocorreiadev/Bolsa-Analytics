import type { StockPoint } from "../data/stocks";
import { classeVariacao, formatarMoeda, formatarPercentual, resumirHistorico } from "../utils/market";
import "../styles/charts.css";

type StockIndicatorsProps = { dados: StockPoint[] };

export default function StockIndicators({ dados }: StockIndicatorsProps) {
  const resumo = resumirHistorico(dados);

  if (!resumo) {
    return <p className="state-message" role="status">Nenhum indicador disponível.</p>;
  }

  const indicadores = [
    { titulo: "Último valor simulado", valor: formatarMoeda(resumo.ultimo) },
    { titulo: "Variação no período", valor: formatarPercentual(resumo.percentual), destaque: true },
    { titulo: "Maior preço", valor: formatarMoeda(resumo.maior) },
    { titulo: "Menor preço", valor: formatarMoeda(resumo.menor) },
    { titulo: "Preço médio", valor: formatarMoeda(resumo.media) },
    { titulo: "Variação em reais", valor: `${resumo.variacao >= 0 ? "+" : ""}${formatarMoeda(resumo.variacao)}`, destaque: true },
  ];

  return (
    <dl className="indicator-list">
      {indicadores.map((item) => (
        <div key={item.titulo}>
          <dt>{item.titulo}</dt>
          <dd className={`mono ${item.destaque ? classeVariacao(resumo.variacao) : ""}`}>{item.valor}</dd>
        </div>
      ))}
    </dl>
  );
}
