import type { MarketRow } from "../context/MarketOverviewContext";
import { AppLink } from "../router";
import { formatMarketDate, formatMarketPercent, formatMarketValue } from "../utils/formatMarket";
import { classeVariacao } from "../utils/market";
import { summarizeMarket } from "../utils/marketSummary";
import { Icon } from "./Icon";
import Sparkline from "./Sparkline";

type NavigationMarketSummaryProps = {
  rows: MarketRow[];
  loading: boolean;
  error: string;
  reload: () => Promise<void>;
};

const currencies = [
  { id: "dolar", pair: "USD/BRL", name: "Dólar" },
  { id: "euro", pair: "EUR/BRL", name: "Euro" },
  { id: "libra", pair: "GBP/BRL", name: "Libra" },
  { id: "iene", pair: "JPY/BRL", name: "Iene" },
];

export default function NavigationMarketSummary({ rows, loading, error, reload }: NavigationMarketSummaryProps) {
  const summaries = rows.flatMap((row) => {
    const summary = summarizeMarket(row.history);
    return summary ? [{ ...row, summary }] : [];
  });
  const daily = summaries.filter((row) => row.summary.dayChange !== null);
  const rising = daily.filter((row) => row.summary.dayChange! > 0).length;
  const falling = daily.filter((row) => row.summary.dayChange! < 0).length;
  const unchanged = daily.length - rising - falling;
  const watchlist = rows.filter((row) => row.asset.category !== "Câmbio");
  const ranked = summaries.filter((row) => row.history!.data.length > 1 && row.summary.periodChange !== null)
    .sort((a, b) => b.summary.periodChange! - a.summary.periodChange!);
  const highlights = ranked.length > 1
    ? [{ row: ranked[0], label: "Melhor desempenho" }, { row: ranked.at(-1)!, label: "Menor desempenho" }]
    : ranked.length === 1 ? [{ row: ranked[0], label: "Destaque disponível" }] : [];

  return <div className="navigation-market-summary">
    <section className="nav-market-pulse" aria-labelledby="nav-pulse-title">
      <div className="nav-section-heading"><h2 id="nav-pulse-title">Pulso do mercado</h2><Icon name="chart" size={13} /></div>
      <p className="nav-section-caption">Últimos fechamentos</p>
      {daily.length > 0 ? <>
        <dl className="nav-market-counts">
          <div><dt>Altas</dt><dd className="positive">{rising}</dd></div>
          <div><dt>Baixas</dt><dd className="negative">{falling}</dd></div>
          <div><dt>Estáveis</dt><dd className="neutral">{unchanged}</dd></div>
        </dl>
        <div className="nav-breadth-bar" aria-hidden="true">
          <span className="breadth-rising" style={{ flexGrow: rising }} />
          <span className="breadth-falling" style={{ flexGrow: falling }} />
          <span className="breadth-unchanged" style={{ flexGrow: unchanged }} />
        </div>
        <p className="nav-data-note">{daily.length} de {rows.length} ativos com variação{loading ? " · consultando…" : ""}</p>
      </> : <div className="nav-summary-state" role="status">
        <p>{loading ? "Consultando históricos…" : "Sem variações disponíveis."}</p>
        {!loading && <button type="button" onClick={() => void reload()}>Tentar novamente <Icon name="refresh" size={11} /></button>}
      </div>}
    </section>

    <section className="nav-currencies" aria-labelledby="nav-currencies-title">
      <div className="nav-section-heading"><h2 id="nav-currencies-title">Câmbio</h2><span>Em reais</span></div>
      <p className="nav-section-caption">Variação entre fechamentos</p>
      <ul>{currencies.map((currency) => {
        const row = rows.find((item) => item.asset.id === currency.id);
        const summary = summarizeMarket(row?.history);
        return <li key={currency.id}><AppLink
          className="nav-currency"
          href={`/candles?ativo=${currency.id}&periodo=1mo&intervalo=1d`}
          aria-label={`${currency.name}, ${currency.pair}${summary ? `, fechamento ${formatMarketValue(summary.last.close, "BRL")} em ${formatMarketDate(summary.last.date)}${summary.dayChange !== null ? `, variação ${formatMarketPercent(summary.dayChange)}` : ", variação indisponível"}` : row?.loading || loading ? ", carregando histórico" : ", histórico indisponível"}`}
        >
          <div className="nav-currency-top"><strong>{currency.pair}</strong><span className={summary?.dayChange != null ? classeVariacao(summary.dayChange) : "muted"}>{summary?.dayChange != null ? formatMarketPercent(summary.dayChange) : "—"}</span></div>
          <div className="nav-currency-price"><span>{currency.name}</span><span>{summary ? formatMarketValue(summary.last.close, "BRL") : row?.loading || loading ? "Consultando…" : "Indisponível"}</span></div>
          {summary && <time className="nav-currency-date" dateTime={summary.last.date}>{formatMarketDate(summary.last.date)}</time>}
        </AppLink></li>;
      })}</ul>
      <p className="nav-data-note">Cotação de 1 unidade da moeda em BRL.</p>
    </section>

    {highlights.length > 0 && <section className="nav-market-highlights" aria-labelledby="nav-highlights-title">
      <div className="nav-section-heading"><h2 id="nav-highlights-title">Destaques</h2><span>1 mês</span></div>
      {highlights.map(({ row, label }) => <AppLink
        key={row.asset.id}
        className="nav-highlight"
        href={`/graficos?ativo=${encodeURIComponent(row.asset.id)}&periodo=1mo&intervalo=1d`}
        aria-label={`${label} no último mês: ${row.asset.name}, ${formatMarketPercent(row.summary.periodChange!)}`}
      >
        <span className="nav-highlight-label">{label}</span>
        <div className="nav-highlight-value"><strong>{row.asset.ticker}</strong><span className={classeVariacao(row.summary.periodChange!)}>{formatMarketPercent(row.summary.periodChange!)}</span></div>
        <Sparkline data={row.history!.data} />
        <span className="nav-highlight-date">Até {formatMarketDate(row.summary.last.date)} <span aria-hidden="true">↗</span></span>
      </AppLink>)}
      <p className="nav-data-note">Variação entre o primeiro e o último fechamento do período.{loading ? " Ranking parcial." : ""}</p>
    </section>}

    {watchlist.length > 0 && <section className="nav-market-watchlist" aria-labelledby="nav-watchlist-title">
      <div className="nav-section-heading"><h2 id="nav-watchlist-title">Acompanhamento</h2></div>
      <p className="nav-section-caption">Variação entre fechamentos</p>
      <ul>{watchlist.map((row) => {
        const summary = summarizeMarket(row.history);
        return <li key={row.asset.id}><AppLink href={`/candles?ativo=${encodeURIComponent(row.asset.id)}&periodo=1mo&intervalo=1d`} title={`${row.asset.name}${summary ? ` · ${formatMarketDate(summary.last.date)}` : " · histórico indisponível"}`}>
          <span className="nav-watchlist-symbol">{row.asset.ticker}</span>
          <span className={summary?.dayChange != null ? classeVariacao(summary.dayChange) : "muted"}>{summary?.dayChange != null ? formatMarketPercent(summary.dayChange) : row.loading ? "…" : "—"}</span>
          {!row.loading && summary?.dayChange == null && <span className="sr-only">Variação indisponível</span>}
        </AppLink></li>;
      })}</ul>
    </section>}
    <p className="nav-source-note">{error ? "Fonte indisponível. Tente atualizar as consultas." : "Yahoo Finance / yfinance. Datas variam entre mercados; sem confirmação de tempo real."}</p>
  </div>;
}
