import type { StockPoint } from "../data/stocks";

const moeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export const formatarMoeda = (valor: number) => moeda.format(valor);

export const formatarNumero = (valor: number) =>
  valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatarPercentual = (valor: number) =>
  `${valor >= 0 ? "+" : ""}${formatarNumero(valor)}%`;

export const classeVariacao = (valor: number) =>
  valor > 0 ? "positive" : valor < 0 ? "negative" : "neutral";

export function resumirHistorico(dados: StockPoint[]) {
  if (dados.length === 0) return null;

  const precos = dados.map((item) => item.preco);
  const inicial = precos[0];
  const ultimo = precos[precos.length - 1];
  const variacao = ultimo - inicial;

  return {
    inicial,
    ultimo,
    variacao,
    percentual: inicial === 0 ? 0 : (variacao / inicial) * 100,
    maior: Math.max(...precos),
    menor: Math.min(...precos),
    media: precos.reduce((total, preco) => total + preco, 0) / precos.length,
  };
}
