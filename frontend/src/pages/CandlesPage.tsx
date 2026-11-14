import { Icon } from "../components/Icon";
import MarketChart from "../components/MarketChart";
import useMarketAssets from "../hooks/useMarketAssets";
import useMarketHistory from "../hooks/useMarketHistory";
import { navigate, useRoute } from "../router";
import { MARKET_INTERVALS, MARKET_PERIODS, intervalosPermitidos, isMarketInterval, isMarketPeriod } from "../types/market";
import { formatMarketDate, formatMarketPercent, formatMarketValue } from "../utils/formatMarket";
import "../styles/candles.css";

const periodLabels = { "5d": "5D", "1mo": "1M", "3mo": "3M", "6mo": "6M", "1y": "1A", "2y": "2A", "5y": "5A" };

export default function CandlesPage({ initialMode = "candles" }: { initialMode?: "candles" | "line" }) {
  const route = useRoute();
  const params = new URLSearchParams(route.search);
  const id = params.get("ativo") ?? "petrobras";
  const rawPeriod = params.get("periodo") ?? "1mo";
  const rawInterval = params.get("intervalo") ?? "1d";
  const rawMode = params.get("modo") ?? initialMode;
  const mode = rawMode === "line" ? "line" : "candles";
  const period = isMarketPeriod(rawPeriod) ? rawPeriod : "1mo";
  const interval = isMarketInterval(rawInterval) ? rawInterval : "1d";
  const queryValid = isMarketPeriod(rawPeriod) && isMarketInterval(rawInterval) && intervalosPermitidos(period).includes(interval);
  const catalog = useMarketAssets();
  const selected = catalog.assets.find((asset) => asset.id === id);
  const request = useMarketHistory(selected && queryValid ? id : null, period, interval);
  const history = request.history;
  const latest = history?.data.at(-1);
  const first = history?.data[0];
  const change = history && latest && first && history.data.length > 1 && first.close !== 0 ? ((latest.close - first.close) / first.close) * 100 : null;
  const high = history?.data.reduce((value, point) => Math.max(value, point.high), -Infinity) ?? 0;
  const low = history?.data.reduce((value, point) => Math.min(value, point.low), Infinity) ?? 0;
  const rangePosition = latest && high > low
    ? Math.max(0, Math.min(100, ((latest.close - low) / (high - low)) * 100)) : 50;

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
      <section className="panel candle-controls-panel" aria-label="Configurar gráfico de preços">
        <div className="candle-controls-heading"><span><Icon name="chart" size={16} />Configure sua análise</span><span className="candle-history-badge">Dados históricos</span></div>
        <div className="candle-controls">
          <div className="field candle-asset-field"><label htmlFor="candle-asset">Ativo</label><select id="candle-asset" value={id} onChange={(event) => update("ativo", event.target.value)} disabled={catalog.loading || Boolean(catalog.error)}>{!selected && <option value={id}>{id.toUpperCase()} · {catalog.loading ? "Carregando catálogo" : "OHLC indisponível"}</option>}{catalog.assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.ticker} · {asset.name}</option>)}</select></div>
          <div className="field"><label htmlFor="candle-interval">Intervalo entre registros</label><select id="candle-interval" value={rawInterval} onChange={(event) => update("intervalo", event.target.value)}>{(!isMarketInterval(rawInterval) || !intervalosPermitidos(period).includes(interval)) && <option value={rawInterval}>Intervalo não suportado</option>}{MARKET_INTERVALS.filter((item) => intervalosPermitidos(period).includes(item.value)).map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
          <div className="field"><span id="candle-mode-label" className="candle-field-label">Visualização</span><div className="candle-mode-control" role="group" aria-labelledby="candle-mode-label"><button type="button" aria-pressed={mode === "candles"} onClick={() => update("modo", "candles")}><svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M6 2v4m0 7v5M14 2v6m0 7v3" /><path d="M3.5 6h5v7h-5zM11.5 8h5v7h-5z" /></svg>Candles</button><button type="button" aria-pressed={mode === "line"} onClick={() => update("modo", "line")}><Icon name="chart" size={16} />Linha</button></div></div>
        </div>
        <div className="candle-period-bar"><span id="candle-period-label">Período</span><div className="candle-period-control" role="group" aria-labelledby="candle-period-label">{MARKET_PERIODS.map((item) => <button type="button" key={item.value} aria-pressed={rawPeriod === item.value} aria-label={item.label} title={item.label} onClick={() => update("periodo", item.value)}>{periodLabels[item.value]}</button>)}</div><span className="candle-period-description">{MARKET_PERIODS.find((item) => item.value === rawPeriod)?.label ?? "Período não suportado"} de histórico</span></div>
      </section>

      {catalog.loading ? <div className="panel state-message candle-state" role="status"><strong>Carregando ativos</strong><span>Consultando o catálogo do backend.</span></div>
        : catalog.error ? <div className="panel state-message candle-state" role="alert"><strong className="negative">Catálogo indisponível</strong><span>{catalog.error}</span><button className="retry-button" type="button" onClick={catalog.reload}><Icon name="refresh" size={14} />Tentar novamente</button></div>
          : !selected ? <div className="panel state-message candle-state" role="status"><strong>Ativo sem suporte a OHLC</strong><span>O ativo “{id}” não está disponível na fonte integrada. Selecione outro ativo no catálogo.</span></div>
            : !queryValid ? <div className="panel state-message candle-state" role="status"><strong>Combinação não suportada</strong><span>Escolha um período e um intervalo compatíveis. Dados intradiários não estão disponíveis nesta integração.</span></div>
              : request.loading ? <div className="panel state-message candle-state" role="status"><div className="candle-loading-symbol" aria-hidden="true"><i /><i /><i /><i /><i /></div><strong>Carregando histórico de preços</strong><span>Consultando os registros da fonte para a sua seleção.</span></div>
                : request.error ? <div className="panel state-message candle-state" role={request.errorStatus === 404 ? "status" : "alert"}><strong className={request.errorStatus === 404 ? "" : "negative"}>{request.errorStatus === 404 ? "Nenhum histórico disponível" : "Não foi possível obter os candles"}</strong><span>{request.error}</span><button className="retry-button" type="button" onClick={request.reload}><Icon name="refresh" size={14} />Tentar novamente</button></div>
                  : !history || !latest ? <div className="panel state-message candle-state" role="status"><strong>Sem dados neste período</strong><span>A fonte não retornou registros OHLC para a seleção.</span></div>
                    : <>
                      <section className="panel candle-main-panel" aria-labelledby="candle-chart-title">
                        <div className="panel-header"><h2 id="candle-chart-title">Histórico de preços <span className="panel-symbol">{history.ticker}</span></h2><button type="button" className="candle-refresh" onClick={request.reload} title="Consultar o histórico novamente"><Icon name="refresh" size={14} /><span>Atualizar</span></button></div>
                        <div className="candle-quote"><div className="candle-instrument"><span className="candle-symbol-badge mono">{history.ticker.replace(/\.SA$/, "")}</span><div><span className="eyebrow">{selected.category}</span><h3>{selected.name}</h3><p className="muted">{history.unit === "points" ? "Pontos" : history.currency} · {history.timezone ?? "Fuso não informado pela fonte"}</p></div></div><div className="candle-last-value"><span className="candle-price-label">Último fechamento</span><strong className="mono">{formatMarketValue(latest.close, history.currency, history.unit)}</strong>{change !== null ? <span className={`candle-change mono ${change > 0 ? "positive" : change < 0 ? "negative" : "neutral"}`}>{change !== 0 && <Icon name={change > 0 ? "arrow-up" : "arrow-down"} size={14} />}{formatMarketPercent(change)} <small>no período</small></span> : <span className="candle-change muted">Variação indisponível neste período</span>}<small className="muted">Sessão de {formatMarketDate(latest.date)}</small></div></div>
                        <div className="candle-range" aria-label="Faixa de preços do período"><span><small>Mínima do período</small><strong className="mono">{formatMarketValue(low, history.currency, history.unit)}</strong></span><div className="candle-range-track" role="img" aria-label={`Último fechamento em ${Math.round(rangePosition)}% da faixa entre a mínima e a máxima do período`}><span style={{ left: `${rangePosition}%` }} /></div><span><small>Máxima do período</small><strong className="mono">{formatMarketValue(high, history.currency, history.unit)}</strong></span></div>
                        {Boolean(history.discarded) && <p className="candle-data-note" role="status">{history.discarded} registro(s) inválido(s) ou duplicado(s) ignorado(s). Nenhum dado foi preenchido artificialmente.</p>}
                        <MarketChart key={`${history.asset}:${history.period}:${history.interval}:${mode}`} history={history} mode={mode} />
                        <div className="panel-footer"><span>{history.source}</span><span>{history.count} registros · {history.interval === "1d" ? "Diário" : history.interval === "1wk" ? "Semanal" : "Mensal"} · {formatMarketDate(history.data[0].date)} — {formatMarketDate(latest.date)}</span></div>
                      </section>
                      <section className="panel candle-summary" aria-label="Resumo do histórico selecionado"><dl><div><dt>Primeira sessão</dt><dd className="mono">{formatMarketDate(history.data[0].date)}</dd></div><div><dt>Maior máxima no período</dt><dd className="mono">{formatMarketValue(Math.max(...history.data.map((point) => point.high)), history.currency, history.unit)}</dd></div><div><dt>Menor mínima no período</dt><dd className="mono">{formatMarketValue(Math.min(...history.data.map((point) => point.low)), history.currency, history.unit)}</dd></div><div><dt>Registros válidos</dt><dd className="mono">{history.count}</dd></div></dl></section>
                    </>}
      <p className="candle-source-note">Dados históricos da fonte, sem confirmação de tempo real. Dólar representa USD/BRL à vista. Ouro representa o contrato futuro GC=F. Períodos sem negociação não recebem candles adicionais.</p>
    </div>
  );
}
