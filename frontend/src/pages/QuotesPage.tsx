import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "../services/accountService";
import { useAccount } from "../hooks/useAccount";
import useMarketAssets from "../hooks/useMarketAssets";
import { AppLink, navigate, useRoute } from "../router";
import MarketDataState from "../components/MarketDataState";
import { formatMarketPercent, formatMarketValue } from "../utils/formatMarket";
import { CHART_COLORS } from "../utils/chartTheme";

type Quote = {
  asset: string; ticker: string; name: string; currency: string; unit: string; source: string;
  timezone: string; collected_at: string; as_of: string; count: number; cached: boolean;
  data: { time: string; open: number; high: number; low: number; close: number }[];
};

export default function QuotesPage() {
  const route = useRoute();
  const catalog = useMarketAssets();
  const { user } = useAccount();
  const asset = new URLSearchParams(route.search).get("ativo") ?? user?.preferencias.ativo ?? "petrobras";
  const [refresh, setRefresh] = useState(60);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ asset: string; data: Quote | null; error: string; loading: boolean }>({ asset: "", data: null, error: "", loading: true });
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    let active = true;
    api<Quote>(`/api/quotes/${encodeURIComponent(asset)}`).then((data) => {
      if (active) { setResult({ asset, data, error: "", loading: false }); setNow(Date.now()); }
    }).catch((cause) => {
      if (active) setResult((old) => ({ asset, data: old.asset === asset ? old.data : null, error: cause instanceof Error ? cause.message : "Cotação indisponível.", loading: false }));
    });
    return () => { active = false; };
  }, [asset, attempt]);
  useEffect(() => {
    if (!refresh) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        setResult((old) => ({ ...old, loading: true }));
        setAttempt((n) => n + 1);
      }
    }, refresh * 1000);
    return () => window.clearInterval(timer);
  }, [refresh]);
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 10_000); return () => window.clearInterval(timer); }, []);
  const quote = result.asset === asset ? result.data : null;
  const loading = result.asset !== asset || result.loading;
  const error = result.asset === asset ? result.error : "";
  const latest = quote?.data.at(-1);
  const opening = quote?.data[0]?.open;
  const age = quote ? Math.max(0, Math.floor((now - new Date(quote.as_of).getTime()) / 60_000)) : null;
  const price = (n: number) => formatMarketValue(n, quote!.currency, quote!.unit);
  const time = (stamp: string) => new Date(stamp).toLocaleTimeString("pt-BR", { timeZone: quote?.timezone, hour: "2-digit", minute: "2-digit" });
  const update = () => { setResult((old) => ({ ...old, loading: true })); setAttempt((n) => n + 1); };
  return <div className="trends-page"><section className="panel"><div className="panel-header"><h2>Monitor de cotações</h2><span className="panel-meta">Intradiário · candles de 1 minuto</span></div><div className="trend-filters"><div className="field"><label htmlFor="quote-asset">Ativo acompanhado</label><select id="quote-asset" value={asset} onChange={(e) => navigate(`/cotacoes?ativo=${encodeURIComponent(e.target.value)}`)}>{!catalog.assets.some((a) => a.id === asset) && <option value={asset}>{asset}</option>}{catalog.assets.map((a) => <option key={a.id} value={a.id}>{a.name} · {a.ticker}</option>)}</select></div><div className="field"><label htmlFor="quote-refresh">Atualização automática</label><select id="quote-refresh" value={refresh} onChange={(e) => setRefresh(Number(e.target.value))}><option value={0}>Pausada</option><option value={60}>A cada 1 minuto</option><option value={300}>A cada 5 minutos</option></select></div><button className="action-button" disabled={loading} onClick={update}>{loading ? "Consultando…" : "Atualizar agora"}</button><p className="filter-help">A consulta automática pausa com a aba oculta. A fonte pode fornecer dados atrasados ou da sessão anterior. A cotação exibida é o fechamento do último candle disponível, sem garantia de tempo real.</p></div>{catalog.error && <p className="form-error" role="alert">{catalog.error} <button className="action-button" onClick={catalog.reload}>Recarregar catálogo</button></p>}</section>
    {error && quote && <p className="form-error" role="alert">Falha na atualização: {error} Os valores abaixo são da última consulta bem-sucedida.</p>}
    {!quote || !latest ? <section className="panel"><MarketDataState loading={loading} error={error} retry={update} /></section> : <><section className="panel quote-hero"><div><span className="eyebrow">{quote.ticker} / {quote.name}</span><h2>{price(latest.close)}</h2><p className={opening && latest.close >= opening ? "positive" : "negative"}>{opening ? formatMarketPercent((latest.close / opening - 1) * 100) : "—"} <span className="muted">desde a primeira abertura disponível</span></p></div><div className="quote-timing"><span className={`quote-age ${age !== null && age > 5 ? "negative" : "muted"}`}>Último candle: {age} min atrás</span><p>{new Date(quote.as_of).toLocaleString("pt-BR", { timeZone: quote.timezone })}</p><small>Horário da fonte: {quote.timezone}</small><p>Consulta: {new Date(quote.collected_at).toLocaleString("pt-BR")}</p><small>{quote.cached ? "Cache de até 60 s" : "Consultado na fonte"}{loading ? " · Atualizando…" : ""}</small></div></section><section className="panel"><div className="panel-header"><h2>Evolução intradiária</h2><span className="panel-meta">{quote.count} registros · {quote.currency}</span></div><div className="trend-chart"><ResponsiveContainer width="100%" height="100%" minWidth={0}><LineChart data={quote.data} margin={{ top: 20, right: 20, left: 10, bottom: 10 }} accessibilityLayer aria-label={`Cotações intradiárias de ${quote.ticker}`}><CartesianGrid vertical={false} stroke={CHART_COLORS.grid} /><XAxis dataKey="time" tickFormatter={time} minTickGap={50} tick={{ fill: CHART_COLORS.text, fontSize: 11 }} axisLine={{ stroke: CHART_COLORS.border }} tickLine={false} /><YAxis domain={["auto", "auto"]} orientation="right" tickFormatter={(n) => Number(n).toLocaleString("pt-BR", { notation: "compact" })} width={75} tick={{ fill: CHART_COLORS.text, fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip labelFormatter={(t) => time(String(t))} formatter={(v) => [price(Number(v)), "Cotação"]} cursor={{ stroke: "#75829a", strokeDasharray: "3 3" }} contentStyle={{ background: "#1b2230", border: `1px solid ${CHART_COLORS.border}`, borderRadius: 7, boxShadow: "0 6px 24px #0004", color: "#e8edf5", fontSize: 12, padding: "10px 13px" }} labelStyle={{ color: "#b3bdcd", marginBottom: 6 }} itemStyle={{ color: CHART_COLORS.primary }} /><Line dataKey="close" name="Cotação" stroke={CHART_COLORS.primary} dot={quote.data.length === 1 ? { r: 3, fill: CHART_COLORS.primary } : false} activeDot={{ r: 5, fill: CHART_COLORS.primary, stroke: CHART_COLORS.background, strokeWidth: 2 }} strokeWidth={2} isAnimationActive={false} /></LineChart></ResponsiveContainer></div><div className="panel-footer"><span>{quote.source} · abertura do último candle às {time(quote.as_of)} · sem confirmação de tempo real</span><AppLink className="text-link" href={`/tendencias?ativo=${asset}`}>Analisar tendência →</AppLink></div></section><div className="analysis-metrics">{[["Abertura disponível", price(opening!)], ["Máxima intradiária", price(Math.max(...quote.data.map((p) => p.high)))], ["Mínima intradiária", price(Math.min(...quote.data.map((p) => p.low)))], ["Último fechamento de 1 min", price(latest.close)]].map(([label, value]) => <div className="panel metric-card" key={label}><span className="eyebrow">{label}</span><strong className="quote-stat-value">{value}</strong></div>)}</div></>}
  </div>;
}
