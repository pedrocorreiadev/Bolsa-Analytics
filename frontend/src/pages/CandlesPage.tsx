import { Icon } from "../components/Icon";
import MarketChart from "../components/MarketChart";
import useMarketAssets from "../hooks/useMarketAssets";
import useMarketHistory from "../hooks/useMarketHistory";
import { navigate, useRoute } from "../router";
import { MARKET_INTERVALS, MARKET_PERIODS, intervalosPermitidos, isMarketInterval, isMarketPeriod } from "../types/market";
import { formatMarketDate, formatMarketPercent, formatMarketValue } from "../utils/formatMarket";
import "../styles/candles.css";

export default function CandlesPage({ initialMode = "candles" }: { initialMode?: "candles" | "line" }) {
  const route = useRoute();
  const params = new URLSearchParams(route.search);
  const id = params.get("ativo") ?? "petrobras";
  const rawPeriod = params.get("periodo") ?? "1mo";
  const rawInterval = params.get("intervalo") ?? "1d";
  const rawMode = params.get("modo") ?? initialMode;
  const mode = route.pathname === "/candles" ? "candles" : rawMode === "line" ? "line" : "candles";
  const period = isMarketPeriod(rawPeriod) ? rawPeriod : "1mo";
  const interval = isMarketInterval(rawInterval) ? rawInterval : "1d";
  const queryValid = isMarketPeriod(rawPeriod) && isMarketInterval(rawInterval) && intervalosPermitidos(period).includes(interval);
  const catalog = useMarketAssets();
  const selected = catalog.assets.find((asset) => asset.id === id);
  const request = useMarketHistory(selected && queryValid ? id : null, period, interval);
  const history = request.history;
  const latest = history?.data.at(-1);
  const first = history?.data[0];
  const change = latest && first && first.close !== 0 ? ((latest.close - first.close) / first.close) * 100 : null;

  function update(key: string, value: string) {
    const next = new URLSearchParams(route.search);
    next.set("ativo", id);
    next.set("periodo", period);
    next.set("intervalo", interval);
    next.set(key, value);
    if (key === "periodo" && isMarketPeriod(value) && !intervalosPermitidos(value).includes(interval)) next.set("intervalo", "1d");
    navigate(`${route.pathname}?${next}`);
  }

  return (
    <div className="candles-page">
      <section className="panel candle-controls-panel" aria-label="Filtros do histórico de candles">
        <div className="candle-controls">
          <div className="field candle-asset-field"><label htmlFor="candle-asset">Ativo</label><select id="candle-asset" value={id} onChange={(event) => update("ativo", event.target.value)} disabled={catalog.loading || Boolean(catalog.error)}>{!selected && <option value={id}>{id.toUpperCase()} · {catalog.loading ? "Carregando catálogo" : "OHLC indisponível"}</option>}{catalog.assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.ticker} · {asset.name}</option>)}</select></div>
          <div className="field"><label htmlFor="candle-period">Período histórico</label><select id="candle-period" value={rawPeriod} onChange={(event) => update("periodo", event.target.value)}>{!isMarketPeriod(rawPeriod) && <option value={rawPeriod}>Período não suportado</option>}{MARKET_PERIODS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
          <div className="field"><label htmlFor="candle-interval">Intervalo dos candles</label><select id="candle-interval" value={rawInterval} onChange={(event) => update("intervalo", event.target.value)}>{(!isMarketInterval(rawInterval) || !intervalosPermitidos(period).includes(interval)) && <option value={rawInterval}>Intervalo não suportado</option>}{MARKET_INTERVALS.filter((item) => intervalosPermitidos(period).includes(item.value)).map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
          {route.pathname !== "/candles" && <div className="field"><label htmlFor="candle-mode">Visualização</label><select id="candle-mode" value={mode} onChange={(event) => update("modo", event.target.value)}><option value="line">Linha</option><option value="candles">Candles</option></select></div>}
          {route.pathname === "/candles" && <div className="candle-frequency-note"><span className="eyebrow">Fonte</span><span>Yahoo Finance / yfinance</span></div>}
        </div>
      </section>

      {catalog.loading ? <div className="panel state-message candle-state" role="status"><strong>Carregando ativos</strong><span>Consultando o catálogo do backend.</span></div>
        : catalog.error ? <div className="panel state-message candle-state" role="alert"><strong className="negative">Catálogo indisponível</strong><span>{catalog.error}</span><button className="retry-button" type="button" onClick={catalog.reload}><Icon name="refresh" size={14} />Tentar novamente</button></div>
          : !selected ? <div className="panel state-message candle-state" role="status"><strong>Ativo sem suporte a OHLC</strong><span>O ativo “{id}” não está disponível na fonte integrada. Selecione outro ativo no catálogo.</span></div>
            : !queryValid ? <div className="panel state-message candle-state" role="status"><strong>Combinação não suportada</strong><span>Escolha um período e um intervalo compatíveis. Dados intradiários não estão disponíveis nesta integração.</span></div>
              : request.loading ? <div className="panel state-message candle-state" role="status"><strong>Carregando histórico OHLCV</strong><span>A consulta à fonte pode levar alguns segundos.</span></div>
                : request.error ? <div className="panel state-message candle-state" role={request.errorStatus === 404 ? "status" : "alert"}><strong className={request.errorStatus === 404 ? "" : "negative"}>{request.errorStatus === 404 ? "Nenhum histórico disponível" : "Não foi possível obter os candles"}</strong><span>{request.error}</span><button className="retry-button" type="button" onClick={request.reload}><Icon name="refresh" size={14} />Tentar novamente</button></div>
                  : !history || !latest ? <div className="panel state-message candle-state" role="status"><strong>Sem dados neste período</strong><span>A fonte não retornou registros OHLC para a seleção.</span></div>
                    : <>
                      <section className="panel candle-main-panel" aria-labelledby="candle-chart-title">
                        <div className="panel-header"><h2 id="candle-chart-title">{mode === "candles" ? "Candles" : "Fechamento"} <span className="panel-symbol">{history.ticker}</span></h2><span className="panel-meta">{history.count} sessões · {history.unit === "points" ? "Pontos" : history.currency}</span></div>
                        <div className="candle-quote"><div><span className="eyebrow">{selected.category}</span><h3>{selected.name}</h3><p className="muted">{history.ticker} · {history.timezone ?? "Fuso não informado pela fonte"}</p></div><div className="candle-last-value"><strong className="mono">{formatMarketValue(latest.close, history.currency, history.unit)}</strong>{change !== null && <span className={`mono ${change > 0 ? "positive" : change < 0 ? "negative" : "neutral"}`}>{formatMarketPercent(change)} <small>no período</small></span>}<small className="muted">Última sessão: {formatMarketDate(latest.date)}</small></div></div>
                        {Boolean(history.discarded) && <p className="candle-data-note" role="status">{history.discarded} registro(s) inválido(s) ou duplicado(s) ignorado(s). Nenhum dado foi preenchido artificialmente.</p>}
                        <MarketChart key={`${history.asset}:${history.period}:${history.interval}:${mode}`} history={history} mode={mode} />
                        <div className="panel-footer"><span>{history.source}</span><span>Datas de sessão da fonte · {history.interval === "1d" ? "diário" : history.interval === "1wk" ? "semanal" : "mensal"}</span></div>
                      </section>
                      <section className="panel candle-summary" aria-label="Resumo do histórico selecionado"><dl><div><dt>Primeira sessão</dt><dd className="mono">{formatMarketDate(history.data[0].date)}</dd></div><div><dt>Maior máxima no período</dt><dd className="mono">{formatMarketValue(Math.max(...history.data.map((point) => point.high)), history.currency, history.unit)}</dd></div><div><dt>Menor mínima no período</dt><dd className="mono">{formatMarketValue(Math.min(...history.data.map((point) => point.low)), history.currency, history.unit)}</dd></div><div><dt>Registros válidos</dt><dd className="mono">{history.count}</dd></div></dl></section>
                    </>}
      <p className="candle-source-note">Dados históricos da fonte, sem confirmação de tempo real. Dólar representa USD/BRL à vista. Ouro representa o contrato futuro GC=F. Períodos sem negociação não recebem candles adicionais.</p>
    </div>
  );
}
