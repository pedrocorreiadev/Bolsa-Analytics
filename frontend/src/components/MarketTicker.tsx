import { useState, type CSSProperties } from "react";
import type { MarketRow } from "../context/MarketOverviewContext";
import type { MarketUnit } from "../types/market";
import { navigate, useRoute } from "../router";
import { formatMarketDate, formatMarketPercent, formatMarketValue } from "../utils/formatMarket";
import { classeVariacao } from "../utils/market";
import { summarizeMarket } from "../utils/marketSummary";

type MarketTickerProps = { rows: MarketRow[]; loading: boolean };

type TickerQuote = {
  id: string;
  ticker: string;
  name: string;
  value: number;
  currency: string;
  unit: MarketUnit;
  change: number | null;
  date?: string;
};

// Valores fictícios exclusivos da prévia visual, sem alimentar os dados do painel.
const demoQuotes: TickerQuote[] = [
  { id: "demo-petr4", ticker: "PETR4", name: "Petrobras", value: 37.42, currency: "BRL", unit: "currency", change: 1.82 },
  { id: "demo-vale3", ticker: "VALE3", name: "Vale", value: 62.18, currency: "BRL", unit: "currency", change: -0.74 },
  { id: "demo-ibov", ticker: "IBOV", name: "Ibovespa", value: 128450.32, currency: "BRL", unit: "points", change: 0.93 },
  { id: "demo-usd", ticker: "USD/BRL", name: "Dólar", value: 5.1234, currency: "BRL", unit: "currency", change: -0.38 },
  { id: "demo-eur", ticker: "EUR/BRL", name: "Euro", value: 5.5678, currency: "BRL", unit: "currency", change: 0.45 },
  { id: "demo-gold", ticker: "GC=F", name: "Ouro futuro", value: 2658.70, currency: "USD", unit: "currency", change: 1.12 },
  { id: "demo-btc", ticker: "BTC/USD", name: "Bitcoin", value: 68432.50, currency: "USD", unit: "currency", change: -2.16 },
];

export default function MarketTicker({ rows, loading }: MarketTickerProps) {
  const [paused, setPaused] = useState(false);
  const { pathname, search } = useRoute();
  const demo = new URLSearchParams(search).get("letreiro") === "demo";
  const quotes: TickerQuote[] = demo ? demoQuotes : rows.flatMap(({ asset, history }) => {
    const summary = summarizeMarket(history);
    return summary && history ? [{ id: asset.id, ticker: asset.ticker, name: asset.name, value: summary.last.close, currency: history.currency, unit: history.unit, change: summary.dayChange, date: summary.last.date }] : [];
  });
  const duration = { "--ticker-duration": `${Math.max(30, quotes.length * 6)}s` } as CSSProperties;

  function toggleDemo() {
    const params = new URLSearchParams(search);
    if (demo) params.delete("letreiro");
    else params.set("letreiro", "demo");
    setPaused(false);
    navigate(`${pathname}${params.size ? `?${params}` : ""}`);
  }

  return <section className={`market-ticker${paused ? " is-paused" : ""}${demo ? " is-demo" : ""}`} aria-label={demo ? "Letreiro de demonstração com cotações fictícias" : "Letreiro de cotações dos últimos fechamentos"}>
    <span className="market-ticker-label" title={demo ? "Dados fictícios apenas para visualizar a animação" : "Históricos da fonte; sem confirmação de tempo real"}>Cotações <small>{demo ? "Dados simulados" : "Fechamentos"}</small></span>
    {quotes.length > 0 ? <>
      <div className="market-ticker-viewport" tabIndex={0} aria-label="Cotações. Foque ou passe o mouse para pausar; use as setas para rolar com movimento reduzido.">
        <div className="market-ticker-track" style={duration}>
          {[0, 1].map((copy) => <ul className="market-ticker-group" key={copy} aria-hidden={copy === 1 ? true : undefined}>
            {quotes.map((quote) => <li className="market-ticker-quote" key={quote.id} title={`${quote.name} · ${quote.date ? `Fechamento em ${formatMarketDate(quote.date)} · Variação entre os dois últimos fechamentos` : "Dados fictícios para demonstração"}`}>
              <strong>{quote.ticker}</strong>
              <span className="market-ticker-price">{formatMarketValue(quote.value, quote.currency, quote.unit)}</span>
              <span className={quote.change !== null ? classeVariacao(quote.change) : "muted"}>
                {quote.change !== null ? <><span aria-hidden="true">{quote.change > 0 ? "▲ " : quote.change < 0 ? "▼ " : ""}</span>{formatMarketPercent(quote.change)}</> : "Variação indisponível"}
              </span>
              {quote.date && <time className="sr-only" dateTime={quote.date}>Fechamento em {formatMarketDate(quote.date)}</time>}
            </li>)}
          </ul>)}
        </div>
      </div>
      <button className="market-ticker-toggle" type="button" onClick={() => setPaused((value) => !value)} aria-pressed={paused} aria-label={paused ? "Retomar letreiro de cotações" : "Pausar letreiro de cotações"} title={paused ? "Retomar letreiro" : "Pausar letreiro"}>
        <span aria-hidden="true">{paused ? "▶" : "Ⅱ"}</span>
      </button>
    </> : <p className="market-ticker-status" role="status">{loading ? "Consultando cotações…" : "Cotações indisponíveis · visualize a demo"}</p>}
    <button className="market-ticker-demo-toggle" type="button" onClick={toggleDemo} aria-pressed={demo} title={demo ? "Voltar às cotações da API" : "Visualizar letreiro com dados fictícios"}>{demo ? "Usar API" : "Demo"}</button>
  </section>;
}
