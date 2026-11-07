import { useState, type CSSProperties } from "react";
import type { MarketRow } from "../context/MarketOverviewContext";
import { formatMarketDate, formatMarketPercent, formatMarketValue } from "../utils/formatMarket";
import { classeVariacao } from "../utils/market";
import { summarizeMarket } from "../utils/marketSummary";

type MarketTickerProps = { rows: MarketRow[]; loading: boolean };

export default function MarketTicker({ rows, loading }: MarketTickerProps) {
  const [paused, setPaused] = useState(false);
  const quotes = rows.flatMap(({ asset, history }) => {
    const summary = summarizeMarket(history);
    return summary && history ? [{ id: asset.id, ticker: asset.ticker, name: asset.name, value: summary.last.close, currency: history.currency, unit: history.unit, change: summary.dayChange, date: summary.last.date }] : [];
  });
  const duration = { "--ticker-duration": `${Math.max(30, quotes.length * 6)}s` } as CSSProperties;

  return <section className={`market-ticker${paused ? " is-paused" : ""}`} aria-label="Letreiro de cotações dos últimos fechamentos">
    <span className="market-ticker-label" title="Históricos da fonte; sem confirmação de tempo real">Cotações <small>Fechamentos</small></span>
    {quotes.length > 0 ? <>
      <div className="market-ticker-viewport" tabIndex={0} aria-label="Cotações em loop automático da esquerda para a direita. Use as setas para rolar com movimento reduzido.">
        <div className="market-ticker-track" style={duration}>
          {[0, 1].map((copy) => <ul className="market-ticker-group" key={copy} aria-hidden={copy === 1 ? true : undefined}>
            {quotes.map((quote) => <li className="market-ticker-quote" key={quote.id} title={`${quote.name} · Fechamento em ${formatMarketDate(quote.date)} · Variação entre os dois últimos fechamentos`}>
              <strong>{quote.ticker}</strong>
              <span className="market-ticker-price">{formatMarketValue(quote.value, quote.currency, quote.unit)}</span>
              <span className={quote.change !== null ? classeVariacao(quote.change) : "muted"}>
                {quote.change !== null ? <><span aria-hidden="true">{quote.change > 0 ? "▲ " : quote.change < 0 ? "▼ " : ""}</span>{formatMarketPercent(quote.change)}</> : "Variação indisponível"}
              </span>
              <time className="sr-only" dateTime={quote.date}>Fechamento em {formatMarketDate(quote.date)}</time>
            </li>)}
          </ul>)}
        </div>
      </div>
      <button className="market-ticker-toggle" type="button" onClick={() => setPaused((value) => !value)} aria-pressed={paused} aria-label={paused ? "Retomar letreiro de cotações" : "Pausar letreiro de cotações"} title={paused ? "Retomar letreiro" : "Pausar letreiro"}>
        <span aria-hidden="true">{paused ? "▶" : "Ⅱ"}</span>
      </button>
    </> : <p className="market-ticker-status" role="status">{loading ? "Consultando cotações…" : "Cotações indisponíveis · atualize as consultas"}</p>}
  </section>;
}
