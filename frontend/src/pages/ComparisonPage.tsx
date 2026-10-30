import { useId, useMemo, useState } from "react";
import { Icon } from "../components/Icon";
import MarketChart from "../components/MarketChart";
import PriceComparisonChart from "../components/PriceComparisonChart";
import { useMarketAssets } from "../hooks/useMarketAssets";
import { useMarketHistory } from "../hooks/useMarketHistory";
import { navigate, useRoute } from "../router";
import type { MarketHistory, MarketInterval, MarketPeriod } from "../types/market";
import {
  compareHistories,
  comparisonChangeClass,
  comparisonDate,
  comparisonIntervals,
  comparisonNumber,
  comparisonPercent,
  comparisonPeriods,
  comparisonValue,
} from "../utils/comparison";
import "../styles/comparison.css";

type Selection = { primeiro: string; segundo: string; periodo: MarketPeriod; intervalo: MarketInterval };

function signedValue(value: number | null, history: MarketHistory) {
  return value === null ? "—" : `${value >= 0 ? "+" : ""}${comparisonValue(value, history)}`;
}

export default function ComparisonPage() {
  const route = useRoute();
  const params = new URLSearchParams(route.search);
  const firstId = params.get("primeiro") || "petrobras";
  const secondId = params.get("segundo") || "vale";
  const requestedPeriod = params.get("periodo") || "1mo";
  const period = comparisonPeriods.find((option) => option.value === requestedPeriod)?.value ?? "1mo";
  const intervals = comparisonIntervals(period);
  const requestedInterval = params.get("intervalo") || "1d";
  const interval = intervals.find((option) => option.value === requestedInterval)?.value ?? "1d";
  const invalidParameters = requestedPeriod !== period || requestedInterval !== interval;
  const catalog = useMarketAssets();
  const firstAsset = catalog.assets.find((asset) => asset.id === firstId);
  const secondAsset = catalog.assets.find((asset) => asset.id === secondId);
  const firstRequest = useMarketHistory(firstAsset?.id ?? null, period, interval);
  const secondRequest = useMarketHistory(secondAsset?.id ?? null, period, interval);
  const secondHistory = firstId === secondId ? firstRequest.history : secondRequest.history;
  const [chartMode, setChartMode] = useState<"candles" | "line">("candles");
  const [overlayMode, setOverlayMode] = useState<"performance" | "price">("performance");
  const chartGroupId = useId();

  const comparison = useMemo(() => (
    firstRequest.history && secondHistory
      ? compareHistories(firstRequest.history, secondHistory)
      : null
  ), [firstRequest.history, secondHistory]);

  const alignedFirst = useMemo(() => (
    firstRequest.history && comparison
      ? { ...firstRequest.history, count: comparison.count, data: comparison.firstData }
      : null
  ), [firstRequest.history, comparison]);
  const alignedSecond = useMemo(() => (
    secondHistory && comparison
      ? { ...secondHistory, count: comparison.count, data: comparison.secondData }
      : null
  ), [secondHistory, comparison]);

  const loading = catalog.loading || firstRequest.loading || (firstId !== secondId && secondRequest.loading);
  const unsupportedAsset = !catalog.loading && !catalog.error && (!firstAsset || !secondAsset);
  const error = catalog.error || firstRequest.error || (firstId !== secondId ? secondRequest.error : "");
  const effectiveOverlay = comparison?.comparablePrices ? overlayMode : "performance";

  function updateSelection(patch: Partial<Selection>) {
    const next = { primeiro: firstId, segundo: secondId, periodo: period, intervalo: interval, ...patch };
    if (!comparisonIntervals(next.periodo).some((option) => option.value === next.intervalo)) next.intervalo = "1d";
    const nextParams = new URLSearchParams(route.search);
    for (const [key, value] of Object.entries(next)) nextParams.set(key, value);
    navigate(`${route.pathname}?${nextParams.toString()}`);
  }

  function reload() {
    if (catalog.error) {
      catalog.reload();
      return;
    }
    firstRequest.reload();
    if (firstId !== secondId) secondRequest.reload();
  }

  return (
    <div className="comparison-page">
      <section className="panel comparison-selection" aria-label="Configurar comparação">
        <div className="real-comparison-controls">
          <div className="field">
            <label htmlFor="compare-first">Primeiro ativo</label>
            <select id="compare-first" value={firstId} disabled={catalog.loading || Boolean(catalog.error)} onChange={(event) => updateSelection({ primeiro: event.target.value })}>
              {!firstAsset && <option value={firstId}>{catalog.loading ? "Carregando ativos…" : `${firstId} · indisponível`}</option>}
              {catalog.assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.ticker} · {asset.name}</option>)}
            </select>
          </div>
          <button className="comparison-swap" type="button" onClick={() => updateSelection({ primeiro: secondId, segundo: firstId })} disabled={!firstAsset || !secondAsset || firstId === secondId} aria-label="Inverter primeiro e segundo ativos"><Icon name="compare" size={17} /><span>Inverter</span></button>
          <div className="field">
            <label htmlFor="compare-second">Segundo ativo</label>
            <select id="compare-second" value={secondId} disabled={catalog.loading || Boolean(catalog.error)} onChange={(event) => updateSelection({ segundo: event.target.value })}>
              {!secondAsset && <option value={secondId}>{catalog.loading ? "Carregando ativos…" : `${secondId} · indisponível`}</option>}
              {catalog.assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.ticker} · {asset.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="compare-period">Período histórico</label>
            <select id="compare-period" value={period} onChange={(event) => updateSelection({ periodo: event.target.value as MarketPeriod })}>
              {comparisonPeriods.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="compare-interval">Intervalo dos candles</label>
            <select id="compare-interval" value={interval} onChange={(event) => updateSelection({ intervalo: event.target.value as MarketInterval })}>
              {intervals.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
          <button className="comparison-reload" type="button" onClick={reload} disabled={loading} aria-label="Consultar novamente os dois históricos"><Icon name="refresh" size={16} /><span>Atualizar</span></button>
        </div>
      </section>

      {invalidParameters && <p className="comparison-notice" role="status">A combinação informada na URL não é suportada. Os controles mostram {comparisonPeriods.find((option) => option.value === period)?.label.toLocaleLowerCase()} com candles {intervals.find((option) => option.value === interval)?.label.toLocaleLowerCase()}. Selecione uma opção para atualizar o endereço.</p>}
      {firstId === secondId && !unsupportedAsset && <p className="comparison-notice" role="status">O mesmo ativo está selecionado nos dois campos. As séries e seus resultados serão iguais.</p>}

      {loading ? (
        <section className="panel state-message comparison-state" role="status" aria-busy="true"><strong>Carregando históricos</strong><span>Buscando os dois ativos e identificando as datas em comum.</span></section>
      ) : error ? (
        <section className="panel state-message comparison-state" role="alert"><strong className="negative">Não foi possível preparar a comparação</strong><span>{error}</span><button className="retry-button" type="button" onClick={reload}><Icon name="refresh" size={15} />Tentar novamente</button></section>
      ) : unsupportedAsset ? (
        <section className="panel state-message comparison-state" role="status"><strong>Ativo sem suporte nesta fonte</strong><span>Escolha dois ativos disponíveis nos seletores. Os dados simulados do laboratório não são usados nesta comparação.</span></section>
      ) : !comparison || !alignedFirst || !alignedSecond ? (
        <section className="panel state-message comparison-state" role="status"><strong>Não há observações em comum</strong><span>A fonte não retornou datas compartilhadas para os dois ativos. Experimente outro período ou intervalo.</span></section>
      ) : (
        <>
          <div className="comparison-common-range"><span className="mono">{comparisonDate(comparison.start)} — {comparisonDate(comparison.end)}</span><span>{comparison.count} {comparison.count === 1 ? "data em comum" : "datas em comum"} · {intervals.find((option) => option.value === interval)?.label}</span></div>
          <p className="comparison-calendar-note">Pareamento por data local da fonte. Mercados com fusos diferentes não têm necessariamente o mesmo horário de fechamento.</p>

          <div className="comparison-quotes">
            {[
              { history: alignedFirst, summary: comparison.firstSummary, asset: firstAsset, order: "first" },
              { history: alignedSecond, summary: comparison.secondSummary, asset: secondAsset, order: "second" },
            ].map(({ history, summary, asset, order }) => (
              <section key={order} className={`panel comparison-quote comparison-quote-${order}`} aria-label={`Resumo de ${history.ticker}`}>
                <div className="comparison-quote-name"><span className="comparison-series-mark" aria-hidden="true" /><h3 className="mono">{history.ticker}</h3><span>{asset?.name}</span><span className="comparison-unit mono">{history.unit === "points" ? "PONTOS" : history.currency}</span></div>
                <div className="comparison-quote-value"><strong className="mono">{comparisonValue(summary.latest, history)}</strong><span className={`mono ${comparisonChangeClass(summary.changePercent)}`}>{comparisonPercent(summary.changePercent)}</span></div>
                <p>Último fechamento comum · variação desde {comparisonDate(comparison.start)}</p>
              </section>
            ))}
          </div>

          <div className="comparison-analysis-grid">
            <section className="panel comparison-overlay-panel" aria-labelledby="comparison-overlay-title">
              <div className="panel-header"><h2 id="comparison-overlay-title">{effectiveOverlay === "performance" ? "Desempenho relativo" : "Preços de fechamento"}</h2><div className="comparison-view-switch" role="group" aria-label="Representação da comparação"><button type="button" aria-pressed={effectiveOverlay === "performance"} onClick={() => setOverlayMode("performance")}>Base 100</button>{comparison.comparablePrices && <button type="button" aria-pressed={effectiveOverlay === "price"} onClick={() => setOverlayMode("price")}>Preços</button>}</div></div>
              {comparison.normalizable || effectiveOverlay === "price" ? <PriceComparisonChart points={comparison.points} first={alignedFirst} second={alignedSecond} mode={effectiveOverlay} /> : <div className="state-message comparison-small-state" role="status"><strong>Base de comparação insuficiente</strong><span>São necessários dois fechamentos em comum e um preço inicial diferente de zero.</span></div>}
              <div className="comparison-series-legend"><span><i className="comparison-series-mark" aria-hidden="true" />{alignedFirst.ticker}</span><span><i className="comparison-series-mark comparison-mark-second" aria-hidden="true" />{alignedSecond.ticker}</span><span className="muted">{effectiveOverlay === "performance" ? "Primeiro fechamento comum = 100" : `Mesma moeda e unidade · ${alignedFirst.unit === "points" ? "pontos" : alignedFirst.currency}`}</span></div>
            </section>

            <aside className="panel comparison-readings" aria-labelledby="comparison-readings-title">
              <div className="panel-header"><h2 id="comparison-readings-title">Leitura do período comum</h2></div>
              <dl>
                <div><dt>Diferença de variação</dt><dd className={`mono ${comparisonChangeClass(comparison.differencePercentagePoints)}`}>{comparison.differencePercentagePoints === null ? "—" : `${comparison.differencePercentagePoints >= 0 ? "+" : ""}${comparisonNumber(comparison.differencePercentagePoints)} p.p.`}</dd><dd className="comparison-reading-caption">{alignedFirst.ticker} menos {alignedSecond.ticker}</dd></div>
                <div><dt>Correlação dos retornos</dt><dd className="mono">{comparison.correlation === null ? "—" : comparisonNumber(comparison.correlation)}</dd><dd className="comparison-reading-caption">{comparison.correlation === null ? "Amostra insuficiente ou retornos constantes." : "Entre −1 e +1, nos intervalos entre datas comuns."}</dd></div>
                <div><dt>Observações sem par</dt><dd className="mono">{comparison.excludedFirst} / {comparison.excludedSecond}</dd><dd className="comparison-reading-caption">{alignedFirst.ticker} / {alignedSecond.ticker} · excluídas da comparação.</dd></div>
              </dl>
              <p className="comparison-readings-note">{comparison.comparablePrices ? "A visualização de preços usa a mesma moeda e unidade." : "Moedas ou unidades diferentes: compare a evolução percentual; os preços permanecem separados."}</p>
            </aside>
          </div>

          <section aria-labelledby="comparison-pair-title">
            <div className="comparison-pair-heading"><div><h3 id="comparison-pair-title">Estrutura de preços, lado a lado</h3><p>Zoom e cursor por data comum · cada mercado preserva seu fuso.</p></div><div className="comparison-view-switch" role="group" aria-label="Tipo dos gráficos individuais"><button type="button" aria-pressed={chartMode === "candles"} onClick={() => setChartMode("candles")}>Candles</button><button type="button" aria-pressed={chartMode === "line"} onClick={() => setChartMode("line")}>Linhas</button></div></div>
            <div className="comparison-candles-grid">
              {[alignedFirst, alignedSecond].map((history, index) => <section key={index} className="panel comparison-individual-chart" aria-label={`Gráfico de ${history.ticker}`}><div className="panel-header"><h2>{history.ticker}</h2><span className="panel-meta">{history.unit === "points" ? "Pontos" : history.currency} · {history.timezone || "Fuso não informado"}</span></div><MarketChart history={history} mode={chartMode} compact height={330} syncId={`comparison-${chartGroupId}`} /><div className="panel-footer"><span>OHLC da fonte · {history.count} observações</span><span>{history.source}</span></div></section>)}
            </div>
          </section>

          <section className="panel comparison-statistics" aria-labelledby="comparison-statistics-title">
            <div className="panel-header"><h2 id="comparison-statistics-title">Estatísticas comparadas</h2><span className="panel-meta">Mesmas datas · sem conversão</span></div>
            <div className="comparison-table-scroll" role="region" aria-label="Estatísticas dos ativos no período comum" tabIndex={0}>
              <table><caption className="sr-only">Estatísticas calculadas apenas nos candles com a mesma data nos dois históricos, entre {comparisonDate(comparison.start)} e {comparisonDate(comparison.end)}.</caption><thead><tr><th scope="col">Métrica</th><th scope="col">{alignedFirst.ticker}<span>{alignedFirst.unit === "points" ? "Pontos" : alignedFirst.currency}</span></th><th scope="col">{alignedSecond.ticker}<span>{alignedSecond.unit === "points" ? "Pontos" : alignedSecond.currency}</span></th></tr></thead><tbody>
                <tr><th scope="row">Primeiro fechamento comum</th><td className="mono">{comparisonValue(comparison.firstSummary.initial, alignedFirst)}</td><td className="mono">{comparisonValue(comparison.secondSummary.initial, alignedSecond)}</td></tr>
                <tr><th scope="row">Último fechamento comum</th><td className="mono">{comparisonValue(comparison.firstSummary.latest, alignedFirst)}</td><td className="mono">{comparisonValue(comparison.secondSummary.latest, alignedSecond)}</td></tr>
                <tr><th scope="row">Variação absoluta</th><td className={`mono ${comparisonChangeClass(comparison.firstSummary.change)}`}>{signedValue(comparison.firstSummary.change, alignedFirst)}</td><td className={`mono ${comparisonChangeClass(comparison.secondSummary.change)}`}>{signedValue(comparison.secondSummary.change, alignedSecond)}</td></tr>
                <tr><th scope="row">Variação percentual</th><td className={`mono ${comparisonChangeClass(comparison.firstSummary.changePercent)}`}>{comparisonPercent(comparison.firstSummary.changePercent)}</td><td className={`mono ${comparisonChangeClass(comparison.secondSummary.changePercent)}`}>{comparisonPercent(comparison.secondSummary.changePercent)}</td></tr>
                <tr><th scope="row">Máxima dos candles comuns</th><td className="mono">{comparisonValue(comparison.firstSummary.high, alignedFirst)}</td><td className="mono">{comparisonValue(comparison.secondSummary.high, alignedSecond)}</td></tr>
                <tr><th scope="row">Mínima dos candles comuns</th><td className="mono">{comparisonValue(comparison.firstSummary.low, alignedFirst)}</td><td className="mono">{comparisonValue(comparison.secondSummary.low, alignedSecond)}</td></tr>
                <tr><th scope="row">Média dos fechamentos</th><td className="mono">{comparisonValue(comparison.firstSummary.averageClose, alignedFirst)}</td><td className="mono">{comparisonValue(comparison.secondSummary.averageClose, alignedSecond)}</td></tr>
                <tr><th scope="row">Volume do último candle comum</th><td className="mono">{comparison.firstSummary.latestVolume?.toLocaleString("pt-BR") ?? "Não informado"}</td><td className="mono">{comparison.secondSummary.latestVolume?.toLocaleString("pt-BR") ?? "Não informado"}</td></tr>
              </tbody></table>
            </div>
          </section>

          <details className="comparison-methodology"><summary tabIndex={0}>Como esta comparação é calculada</summary><p>Somente datas presentes nos dois históricos entram nos gráficos e nas estatísticas. Não há preenchimento de períodos sem negociação. Cada candle mantém abertura, máxima, mínima, fechamento e volume retornados pela fonte. As datas são rótulos do calendário de cada mercado, sem conversão entre fusos.</p><p>A base 100 divide cada fechamento pelo primeiro fechamento comum e multiplica por 100. A variação usa o mesmo início e fim. A correlação de Pearson considera os retornos entre fechamentos comuns e exige pelo menos três pares de retornos não constantes. Ela descreve esta amostra histórica e não prevê movimentos futuros.</p><p>Preços e volumes mantêm a moeda e a unidade de cada ativo. Os históricos podem ter atraso; esta tela não confirma dados em tempo real.</p></details>
        </>
      )}
    </div>
  );
}
