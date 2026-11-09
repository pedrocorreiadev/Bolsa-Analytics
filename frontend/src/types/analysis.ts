export type TrendAnalysis = {
  ativo: string; ticker: string; moeda: string; unidade: string; fonte: string;
  coletado_em: string | null; tempo_real: boolean; em_cache: boolean;
  qualidade: { received: number; valid: number; discarded: number } | null;
  direcao: "alta" | "baixa" | "lateral" | "mista"; observacoes: number; inicio: string; fim: string;
  janela_curta: number; janela_longa: number; horizonte: number;
  estatisticas: {
    media: number; mediana: number; minimo: number; maximo: number; variacao_pct: number;
    retorno_medio_pct: number; volatilidade_pct: number; queda_maxima_pct: number;
    r_quadrado: number; inclinacao_pct: number; distancia_medias_pct: number; movimentos_extremos: number;
  };
  serie: { data: string; fechamento: number; media_curta: number | null; media_longa: number | null; ajuste: number }[];
  projecoes: { passo: number; estimativa: number; inferior: number; superior: number }[];
  correlacao: { ativo: string; valor: number | null; pares: number; motivo: string | null } | null;
  explicacao: string[]; avisos: string[];
};
