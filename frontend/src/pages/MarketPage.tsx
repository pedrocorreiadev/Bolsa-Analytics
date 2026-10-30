import { AppLink, navigate, useRoute } from "../router";
import { Icon } from "../components/Icon";
import MarketDataState from "../components/MarketDataState";
import Sparkline from "../components/Sparkline";
import { useMarketOverview, type MarketRow } from "../hooks/useMarketOverview";
import { summarizeMarket } from "../utils/marketSummary";
import { classeVariacao } from "../utils/market";
import { formatMarketDate, formatMarketPercent, formatMarketValue } from "../utils/formatMarket";

type SortKey = "ativo" | "preco" | "variacao" | "periodo";

export default function MarketPage() {
  const { search } = useRoute();
  const params = new URLSearchParams(search);
  const query = params.get("q") ?? "";
  const category = params.get("classe") ?? "";
  const movement = params.get("movimento") ?? "";
  const sortKey = (["ativo", "preco", "variacao", "periodo"].includes(params.get("ordem") ?? "") ? params.get("ordem") : "ativo") as SortKey;
  const descending = params.get("direcao") === "desc";
  const { rows, loading, error, reload } = useMarketOverview();
  const categories = [...new Set(rows.map((row) => row.asset.category))];
  function update(values: Record<string, string>) {
    const next = new URLSearchParams(search);
    Object.entries(values).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key));
    navigate(`/mercado${next.size ? `?${next}` : ""}`, { replace: true });
  }
  const getSort = (row: MarketRow) => {
    const summary = summarizeMarket(row.history);
    if (sortKey === "ativo") return row.asset.ticker;
    if (sortKey === "preco") return summary?.last.close ?? null;
    return sortKey === "periodo" ? summary?.periodChange ?? null : summary?.dayChange ?? null;
  };
  const visible = rows.filter((row) => {
    const text = `${row.asset.ticker} ${row.asset.name} ${row.asset.category}`.toLocaleLowerCase("pt-BR");
    const variation = summarizeMarket(row.history)?.dayChange;
    return text.includes(query.toLocaleLowerCase("pt-BR")) && (!category || row.asset.category === category) && (!movement || (variation != null && (movement === "alta" ? variation > 0 : variation < 0)));
  }).sort((a, b) => {
    const first = getSort(a); const second = getSort(b);
    if (first === null) return second === null ? 0 : 1;
    if (second === null) return -1;
    const result = typeof first === "string" && typeof second === "string" ? first.localeCompare(second, "pt-BR") : Number(first) - Number(second);
    return descending ? -result : result;
  });
  function sort(key: SortKey) { update({ ordem: key, direcao: sortKey === key && !descending ? "desc" : "asc" }); }
  const sortHeader = (key: SortKey, label: string) => <th scope="col" aria-sort={sortKey === key ? descending ? "descending" : "ascending" : "none"}><button type="button" className="table-sort" onClick={() => sort(key)}>{label}<span aria-hidden="true">{sortKey === key ? descending ? " ↓" : " ↑" : " ↕"}</span></button></th>;

  return (
    <section className="panel market-panel" aria-labelledby="market-table-title">
      <div className="panel-header"><h2 id="market-table-title">Ativos disponíveis</h2><span className="panel-meta">{visible.length} de {rows.length} ativos</span></div>
      <div className="market-filters">
        <div className="field search-field"><label htmlFor="market-search">Buscar ativo</label><input id="market-search" type="search" value={query} onChange={(event) => update({ q: event.target.value })} placeholder="Símbolo ou nome…" /></div>
        <div className="field"><label htmlFor="market-category">Classe</label><select id="market-category" value={category} onChange={(event) => update({ classe: event.target.value })}><option value="">Todas as classes</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></div>
        <div className="field"><label htmlFor="market-movement">Última variação</label><select id="market-movement" value={movement} onChange={(event) => update({ movimento: event.target.value })}><option value="">Todas</option><option value="alta">Em alta</option><option value="baixa">Em baixa</option></select></div>
        <button type="button" className="action-button" disabled={loading} onClick={() => void reload()}><Icon name="refresh" size={13} />{loading ? "Consultando…" : "Atualizar"}</button>
      </div>
      {error ? <MarketDataState error={error} retry={() => void reload()} /> : !rows.length ? <MarketDataState loading={loading} /> : !visible.length ? <MarketDataState /> : (
        <div className="market-table-scroll" role="region" aria-label="Tabela de ativos e cotações" tabIndex={0}><table className="market-table"><caption className="sr-only">Cotações dos últimos históricos diários. Preços mantêm a moeda ou unidade de cada ativo. Variação entre os dois últimos fechamentos e no último mês.</caption><thead><tr>{sortHeader("ativo", "Ativo")}<th scope="col">Classe</th>{sortHeader("preco", "Último fechamento")}{sortHeader("variacao", "Var. anterior")}{sortHeader("periodo", "Var. 1 mês")}<th scope="col">Evolução · 1 mês</th><th scope="col">Data</th><th scope="col">Análise</th></tr></thead><tbody>{visible.map((row) => {
          const summary = summarizeMarket(row.history);
          return <tr key={row.asset.id}><td><strong className="mono">{row.asset.ticker}</strong><small>{row.asset.name}</small></td><td className="muted">{row.asset.category}</td><td className="mono">{summary ? formatMarketValue(summary.last.close, row.asset.currency, row.asset.unit) : row.loading ? "Carregando…" : "Indisponível"}</td><td className={`mono ${summary?.dayChange != null ? classeVariacao(summary.dayChange) : "muted"}`}>{summary?.dayChange != null ? formatMarketPercent(summary.dayChange) : "—"}</td><td className={`mono ${summary?.periodChange != null ? classeVariacao(summary.periodChange) : "muted"}`}>{summary?.periodChange != null ? formatMarketPercent(summary.periodChange) : "—"}</td><td className="table-sparkline">{summary ? <Sparkline data={row.history!.data} /> : "—"}</td><td className="mono muted">{summary ? formatMarketDate(summary.last.date) : "—"}</td><td><div className="table-actions"><AppLink href={`/graficos?ativo=${row.asset.id}&periodo=1mo&intervalo=1d`}>Gráfico</AppLink><AppLink href={`/candles?ativo=${row.asset.id}&periodo=1mo&intervalo=1d`}>Candles</AppLink><AppLink href={`/comparacao?primeiro=${row.asset.id}&segundo=${row.asset.id === "vale" ? "petrobras" : "vale"}`}>Comparar</AppLink></div></td></tr>;
        })}</tbody></table></div>
      )}
      <div className="panel-footer"><span>Preços em moedas e unidades originais. Ordenação por preço compara valores numéricos, sem conversão cambial.</span><span>Histórico de um mês · diário</span></div>
    </section>
  );
}
