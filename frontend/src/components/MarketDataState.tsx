export default function MarketDataState({ loading, error, retry }: { loading?: boolean; error?: string; retry?: () => void }) {
  return (
    <div className="state-message data-state" role={error ? "alert" : "status"}>
      <span className="state-code mono" aria-hidden="true">{loading ? "···" : error ? "!" : "∅"}</span>
      <strong>{loading ? "Consultando a fonte financeira" : error ? "Dados indisponíveis" : "Nenhum registro encontrado"}</strong>
      <span>{loading ? "Os ativos são carregados individualmente. Aguarde a consulta ao histórico." : error || "Altere os filtros ou escolha outro ativo."}</span>
      {error && retry && <button type="button" className="action-button" onClick={retry}>Tentar novamente</button>}
    </div>
  );
}
