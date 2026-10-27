
import {
  stocks,
  gerarHistorico,
  type Periodo,
  type StockPoint,
} from "../data/stocks";

export async function buscarHistoricoAcao(
  codigo: string,
  periodo: Periodo
): Promise<StockPoint[]> {
  const acao = stocks[codigo];

  if (!acao) {
    throw new Error("Ação não encontrada.");
  }

  // Dados simulados enquanto a API não está pronta.
  return gerarHistorico(acao.dados[0].preco, periodo);
}
