import { AppLink } from "../router";
import { useMarketOverview } from "../hooks/useMarketOverview";
import { summarizeMarket } from "../utils/marketSummary";
import { classeVariacao } from "../utils/market";
import { formatMarketDate, formatMarketPercent, formatMarketValue } from "../utils/formatMarket";
import MarketDataState from "../components/MarketDataState";
import Sparkline from "../components/Sparkline";
import { Icon, type IconName } from "../components/Icon";
import AssetIcon from "../components/AssetIcon";

export default function HomePage() {
  const { rows, loading, error, reload } = useMarketOverview();
  const available = rows.filter((row) => row.history?.data.length);
  const changes = available.map((row) => summarizeMarket(row.history)?.dayChange).filter((value): value is number => value !== null && value !== undefined);
  const dates = available.map((row) => row.history!.data.at(-1)!.date).sort();
  const rising = changes.filter((value) => value > 0).length;
  const falling = changes.filter((value) => value < 0).length;
  const stats: { label: string; value: string | number; detail: string; icon: IconName; tone: string }[] = [
    { label: "Ativos no catálogo", value: rows.length || (loading ? "—" : "0"), detail: "Ações, índices, câmbio e mais", icon: "layers", tone: "amber" },
    { label: "Históricos carregados", value: loading && !available.length ? "—" : `${available.length}/${rows.length}`, detail: "Séries diárias · último mês", icon: "database", tone: "blue" },
    { label: "Altas / baixas", value: changes.length ? `${rising} / ${falling}` : "—", detail: "Entre os últimos fechamentos", icon: "quotes", tone: "green" },
    { label: "Última data disponível", value: dates.length ? formatMarketDate(dates.at(-1)!) : "—", detail: "A data varia entre mercados", icon: "calendar", tone: "violet" },
  ];

  return (
    <div className="overview-page">
      <div className="page-actions"><span className="source-note"><Icon name="database" size={14} />Yahoo Finance <span className="source-note-divider">/</span> Histórico diário</span><button type="button" className="action-button" disabled={loading} onClick={() => void reload()}><Icon name="refresh" size={15} />{loading ? "Carregando…" : "Atualizar consultas"}</button></div>
      <div className="overview-stats">{stats.map((stat) => <div className={`stat-cell stat-${stat.tone}`} key={stat.label}><div className="stat-heading"><span className="eyebrow">{stat.label}</span><span className="stat-icon"><Icon name={stat.icon} size={18} /></span></div>{stat.icon === "quotes" && changes.length > 0 ? <strong className="stat-breadth"><span className="positive">{rising}<Icon name="arrow-up" size={17} /></span><span className="stat-separator">/</span><span className="negative">{falling}<Icon name="arrow-down" size={17} /></span></strong> : <strong className="mono">{stat.value}</strong>}<small>{stat.detail}</small></div>)}</div>
      {error ? <section className="panel"><MarketDataState error={error} retry={() => void reload()} /></section> : rows.length === 0 ? <section className="panel"><MarketDataState loading={loading} /></section> : (
        <section className="panel overview-market-panel" aria-labelledby="market-snapshot-title">
          <div className="panel-header"><h2 id="market-snapshot-title"><Icon name="market" size={17} />Panorama dos ativos <span className="asset-count">{rows.length}</span></h2><span className="panel-meta">Últimos fechamentos disponíveis</span></div>
          <div className="asset-snapshot-grid">{rows.map((row) => {
            const summary = summarizeMarket(row.history);
            return <AppLink key={row.asset.id} className="asset-snapshot" href={`/candles?ativo=${row.asset.id}&periodo=1mo&intervalo=1d`}>
              <div className="snapshot-heading"><AssetIcon asset={row.asset} /><div className="snapshot-identity"><strong className="snapshot-ticker">{row.asset.ticker}</strong><p className="snapshot-name">{row.asset.name}</p></div><span className="snapshot-category">{row.asset.category}</span></div>
              <div className="snapshot-price"><strong className="mono">{summary ? formatMarketValue(summary.last.close, row.asset.currency, row.asset.unit) : "—"}</strong><span title="Variação entre os dois últimos fechamentos" className={`snapshot-change mono ${summary?.dayChange != null ? classeVariacao(summary.dayChange) : "muted"}`}>{summary?.dayChange != null && summary.dayChange !== 0 && <Icon name={summary.dayChange > 0 ? "arrow-up" : "arrow-down"} size={13} />}{summary?.dayChange != null ? formatMarketPercent(summary.dayChange) : "—"}</span></div>
              {summary ? <><div className="snapshot-chart-caption"><span>Último mês</span><span className={summary.periodChange != null ? classeVariacao(summary.periodChange) : "muted"}>{summary.periodChange != null ? formatMarketPercent(summary.periodChange) : "—"}</span></div><Sparkline data={row.history!.data} /></> : <div className="snapshot-unavailable">{row.loading ? "Consultando histórico…" : "Histórico indisponível"}</div>}
              <div className="snapshot-footer"><span><Icon name="history" size={12} />{summary ? formatMarketDate(summary.last.date) : row.loading ? "Aguardando a fonte" : "Abra para tentar novamente"}</span><span><Icon name="candles" size={13} />Ver candles</span></div>
            </AppLink>;
          })}</div>
          <div className="panel-footer"><span>Variação em destaque: último fechamento. Minigráficos: desempenho no mês.</span><AppLink className="text-link" href="/mercado">Explorar mercado</AppLink></div>
        </section>
      )}
      <div className="overview-bottom-grid">
        <section className="panel" aria-labelledby="workflow-title"><div className="panel-header"><h2 id="workflow-title">Área de análise</h2><span className="panel-meta">Ferramentas</span></div><div className="workflow-links"><AppLink href="/tendencias"><Icon name="arrow-up" size={19} /><div><strong>Tendências e projeções</strong><p>Filtros, médias móveis, regressão e correlação dos retornos.</p></div><span aria-hidden="true">↗</span></AppLink><AppLink href="/cotacoes"><Icon name="refresh" size={19} /><div><strong>Cotações intradiárias</strong><p>Atualização automática com horário do último candle.</p></div><span aria-hidden="true">↗</span></AppLink><AppLink href="/candles"><Icon name="chart" size={19} /><div><strong>Candles e volume</strong><p>OHLCV, intervalos, zoom e navegação no histórico.</p></div><span aria-hidden="true">↗</span></AppLink><AppLink href="/comparacao"><Icon name="compare" size={19} /><div><strong>Comparar ativos</strong><p>Preços, variações, base 100 e gráficos sincronizados.</p></div><span aria-hidden="true">↗</span></AppLink><AppLink href="/graficos"><Icon name="history" size={19} /><div><strong>Gráficos e laboratório</strong><p>Análise de preços e as séries simuladas do projeto.</p></div><span aria-hidden="true">↗</span></AppLink></div></section>
        <section className="panel" aria-labelledby="coverage-title"><div className="panel-header"><h2 id="coverage-title">Cobertura da fonte</h2><span className="panel-meta">Contexto</span></div><dl className="coverage-list"><div><dt>Origem dos dados</dt><dd>Yahoo Finance / yfinance</dd></div><div><dt>Moedas e unidades</dt><dd>Informadas por ativo</dd></div><div><dt>Câmbio</dt><dd>USD, EUR, GBP e JPY em reais</dd></div><div><dt>Contrato de ouro</dt><dd>Futuro · GC=F</dd></div><div><dt>Atualização</dt><dd>Manual ou automática nas configurações</dd></div></dl><p className="coverage-note">Candles representam os registros da fonte, sem preencher datas sem negociação. WDO não está disponível.</p></section>
      </div>
    </div>
  );
}
