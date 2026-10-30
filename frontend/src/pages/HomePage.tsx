import { AppLink } from "../router";
import { useMarketOverview } from "../hooks/useMarketOverview";
import { summarizeMarket } from "../utils/marketSummary";
import { classeVariacao } from "../utils/market";
import { formatMarketDate, formatMarketPercent, formatMarketValue } from "../utils/formatMarket";
import MarketDataState from "../components/MarketDataState";
import Sparkline from "../components/Sparkline";
import { Icon } from "../components/Icon";

export default function HomePage() {
  const { rows, loading, error, reload } = useMarketOverview();
  const available = rows.filter((row) => row.history?.data.length);
  const changes = available.map((row) => summarizeMarket(row.history)?.dayChange).filter((value): value is number => value !== null && value !== undefined);
  const dates = available.map((row) => row.history!.data.at(-1)!.date).sort();
  const stats = [
    { label: "Ativos no catálogo", value: rows.length || (loading ? "—" : "0"), detail: "Universo disponível na API" },
    { label: "Históricos carregados", value: loading && !available.length ? "—" : `${available.length}/${rows.length}`, detail: "Séries diárias · último mês" },
    { label: "Altas / baixas", value: changes.length ? `${changes.filter((value) => value > 0).length} / ${changes.filter((value) => value < 0).length}` : "—", detail: "Entre os dois últimos fechamentos" },
    { label: "Última data disponível", value: dates.length ? formatMarketDate(dates.at(-1)!) : "—", detail: "A data pode variar entre mercados" },
  ];

  return (
    <div className="overview-page">
      <div className="page-actions"><span className="source-note">Yahoo Finance / yfinance · histórico diário</span><button type="button" className="action-button" disabled={loading} onClick={() => void reload()}><Icon name="refresh" size={13} />{loading ? "Carregando…" : "Atualizar consultas"}</button></div>
      <div className="overview-stats">{stats.map((stat) => <div className="stat-cell" key={stat.label}><span className="eyebrow">{stat.label}</span><strong className="mono">{stat.value}</strong><small>{stat.detail}</small></div>)}</div>
      {error ? <section className="panel"><MarketDataState error={error} retry={() => void reload()} /></section> : rows.length === 0 ? <section className="panel"><MarketDataState loading={loading} /></section> : (
        <section className="panel" aria-labelledby="market-snapshot-title">
          <div className="panel-header"><h2 id="market-snapshot-title">Panorama dos ativos</h2><span className="panel-meta">Últimos fechamentos disponíveis</span></div>
          <div className="asset-snapshot-grid">{rows.map((row) => {
            const summary = summarizeMarket(row.history);
            return <AppLink key={row.asset.id} className="asset-snapshot" href={`/candles?ativo=${row.asset.id}&periodo=1mo&intervalo=1d`}>
              <div className="snapshot-label"><strong className="mono">{row.asset.ticker}</strong><span>{row.asset.category}</span></div>
              <p className="snapshot-name">{row.asset.name}</p>
              <div className="snapshot-price"><strong className="mono">{summary ? formatMarketValue(summary.last.close, row.asset.currency, row.asset.unit) : "—"}</strong><span className={`mono ${summary?.dayChange != null ? classeVariacao(summary.dayChange) : "muted"}`}>{summary?.dayChange != null ? formatMarketPercent(summary.dayChange) : "—"}</span></div>
              {summary ? <Sparkline data={row.history!.data} /> : <div className="snapshot-unavailable">{row.loading ? "Consultando histórico…" : "Histórico indisponível"}</div>}
              <div className="snapshot-footer"><span>{summary ? formatMarketDate(summary.last.date) : row.loading ? "Aguardando a fonte" : "Abra para tentar novamente"}</span><span>Ver candles →</span></div>
            </AppLink>;
          })}</div>
          <div className="panel-footer"><span>Variação: último fechamento contra o anterior. Minigráficos: um mês.</span><AppLink className="text-link" href="/mercado">Todos os ativos →</AppLink></div>
        </section>
      )}
      <div className="overview-bottom-grid">
        <section className="panel" aria-labelledby="workflow-title"><div className="panel-header"><h2 id="workflow-title">Área de análise</h2><span className="panel-meta">Ferramentas</span></div><div className="workflow-links"><AppLink href="/candles"><Icon name="chart" size={19} /><div><strong>Candles e volume</strong><p>OHLCV, intervalos, zoom e navegação no histórico.</p></div><span aria-hidden="true">↗</span></AppLink><AppLink href="/comparacao"><Icon name="compare" size={19} /><div><strong>Comparar ativos</strong><p>Preços, variações, base 100 e gráficos sincronizados.</p></div><span aria-hidden="true">↗</span></AppLink><AppLink href="/graficos"><Icon name="history" size={19} /><div><strong>Gráficos e laboratório</strong><p>Análise de preços e as séries simuladas do projeto.</p></div><span aria-hidden="true">↗</span></AppLink></div></section>
        <section className="panel" aria-labelledby="coverage-title"><div className="panel-header"><h2 id="coverage-title">Cobertura da fonte</h2><span className="panel-meta">Contexto</span></div><dl className="coverage-list"><div><dt>Origem dos dados</dt><dd>Yahoo Finance / yfinance</dd></div><div><dt>Moedas e unidades</dt><dd>Informadas por ativo</dd></div><div><dt>Câmbio</dt><dd>Dólar à vista · USD/BRL</dd></div><div><dt>Contrato de ouro</dt><dd>Futuro · GC=F</dd></div><div><dt>Atualização</dt><dd>Consulta manual de históricos</dd></div></dl><p className="coverage-note">Candles representam os registros da fonte, sem preencher datas sem negociação. WDO não está disponível.</p></section>
      </div>
    </div>
  );
}
