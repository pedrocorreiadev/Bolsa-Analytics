import { useEffect, useState, type FormEvent } from "react";
import { Area, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "../services/accountService";
import { useAccount } from "../hooks/useAccount";
import useMarketAssets from "../hooks/useMarketAssets";
import { navigate, useRoute } from "../router";
import { MARKET_PERIODS } from "../types/market";
import type { TrendAnalysis } from "../types/analysis";
import MarketDataState from "../components/MarketDataState";
import { formatMarketDate, formatMarketPercent, formatMarketValue } from "../utils/formatMarket";
import { CHART_COLORS } from "../utils/chartTheme";

const directionLabel = { alta: "Tendência de alta", baixa: "Tendência de baixa", lateral: "Movimento lateral", mista: "Sinais divergentes" };

function TrendChart({ analysis }: { analysis: TrendAnalysis }) {
  const [averages, setAverages] = useState(true);
  const [regression, setRegression] = useState(true);
  const count = analysis.serie.length;
  const historical = analysis.serie.map((point, index) => ({
    indice: index, rotulo: formatMarketDate(point.data), fechamento: point.fechamento,
    curta: point.media_curta, longa: point.media_longa, ajuste: point.ajuste,
    estimativa: index === count - 1 ? point.ajuste : null, faixa: null as [number, number] | null,
  }));
  const future = analysis.projecoes.map((point) => ({
    indice: count - 1 + point.passo, rotulo: `+${point.passo} observações`, fechamento: null,
    curta: null, longa: null, ajuste: null, estimativa: point.estimativa, faixa: [point.inferior, point.superior] as [number, number],
  }));
  const chartData = [...historical, ...future];
  const value = (price: number) => formatMarketValue(price, analysis.moeda, analysis.unidade);
  return <section className="panel"><div className="panel-header"><h2>Histórico e cenário projetado</h2><span className="panel-meta">{analysis.ticker} · {analysis.moeda}</span></div><div className="trend-chart-options"><label><input type="checkbox" checked={averages} onChange={(e) => setAverages(e.target.checked)} />Médias móveis</label><label><input type="checkbox" checked={regression} onChange={(e) => setRegression(e.target.checked)} />Regressão histórica</label><span className="muted">Linha vertical: fim da amostra</span></div><div className="trend-chart" role="img" aria-label={`Histórico de ${analysis.ticker} com médias móveis e projeção de ${analysis.horizonte} observações. Valores projetados disponíveis na tabela abaixo.`}><ResponsiveContainer width="100%" height="100%" minWidth={0}><ComposedChart data={chartData} margin={{ top: 20, right: 18, left: 12, bottom: 8 }} accessibilityLayer>
    <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} /><XAxis dataKey="indice" type="number" domain={[0, count + analysis.horizonte - 1]} tickFormatter={(i) => i >= count ? `+${Math.round(i - count + 1)}` : formatMarketDate(analysis.serie[Math.round(i)]?.data ?? "").slice(0, 5)} tick={{ fill: CHART_COLORS.text, fontSize: 11 }} axisLine={{ stroke: CHART_COLORS.border }} tickLine={false} minTickGap={50} /><YAxis orientation="right" domain={["auto", "auto"]} tickFormatter={(v) => Number(v).toLocaleString("pt-BR", { notation: "compact", maximumFractionDigits: 2 })} tick={{ fill: CHART_COLORS.text, fontSize: 11 }} width={72} axisLine={false} tickLine={false} />
    <Tooltip cursor={{ stroke: "#75829a", strokeDasharray: "3 3" }} contentStyle={{ background: "#1b2230", border: `1px solid ${CHART_COLORS.border}`, borderRadius: 7, boxShadow: "0 6px 24px #0004", color: "#e8edf5", fontSize: 12, padding: "10px 13px" }} labelStyle={{ color: "#b3bdcd", marginBottom: 6 }} labelFormatter={(i) => chartData.find((p) => p.indice === Number(i))?.rotulo ?? ""} formatter={(v, name) => [Array.isArray(v) ? v.map((n) => value(Number(n))).join(" a ") : value(Number(v)), name]} />
    <ReferenceLine x={count - 1} stroke="#7f8796" strokeDasharray="4 4" /><Area dataKey="faixa" name="Faixa ilustrativa" stroke="none" fill="#a78bfa" fillOpacity={0.16} isAnimationActive={false} />
    <Line dataKey="fechamento" name="Fechamento" stroke={CHART_COLORS.primary} dot={false} strokeWidth={2} activeDot={{ r: 5, fill: CHART_COLORS.primary, stroke: CHART_COLORS.background, strokeWidth: 2 }} isAnimationActive={false} />
    {averages && <Line dataKey="curta" name={`Média ${analysis.janela_curta}`} stroke="#65d4c4" dot={false} strokeWidth={1.5} isAnimationActive={false} />}{averages && <Line dataKey="longa" name={`Média ${analysis.janela_longa}`} stroke={CHART_COLORS.secondary} dot={false} strokeWidth={1.5} isAnimationActive={false} />}
    {regression && <Line dataKey="ajuste" name="Regressão" stroke="#a7adb8" strokeDasharray="4 4" dot={false} isAnimationActive={false} />}<Line dataKey="estimativa" name="Projeção" stroke="#b39aff" strokeDasharray="6 3" dot={false} strokeWidth={2} isAnimationActive={false} />
  </ComposedChart></ResponsiveContainer></div><div className="trend-legend"><span style={{ color: CHART_COLORS.primary }}>━ Fechamento</span>{averages && <><span style={{ color: "#65d4c4" }}>━ Média {analysis.janela_curta}</span><span style={{ color: CHART_COLORS.secondary }}>━ Média {analysis.janela_longa}</span></>}{regression && <span>┄ Regressão</span>}<span style={{ color: "#b39aff" }}>┄ Cenário e dispersão</span></div><p className="coverage-note">A faixa indica dispersão do modelo. Não representa probabilidade validada de o preço futuro permanecer no intervalo. +1 é a próxima observação, sem data de pregão prevista.</p></section>;
}

export default function TrendsPage() {
  const route = useRoute();
  const { user, loading: accountLoading } = useAccount();
  const catalog = useMarketAssets();
  const params = new URLSearchParams(route.search);
  const asset = params.get("ativo") ?? user?.preferencias.ativo ?? "petrobras";
  const period = params.get("periodo") ?? user?.preferencias.periodo ?? "3mo";
  const short = params.get("curta") ?? "5";
  const long = params.get("longa") ?? "20";
  const horizon = params.get("horizonte") ?? String(user?.preferencias.horizonte ?? 10);
  const benchmark = params.get("referencia") ?? "ibovespa";
  const query = new URLSearchParams({ period, short, long, horizon });
  if (benchmark) query.set("benchmark", benchmark);
  if (params.get("inicio")) query.set("start", params.get("inicio")!);
  if (params.get("fim")) query.set("end", params.get("fim")!);
  const path = `/api/analysis/${encodeURIComponent(asset)}?${query}`;
  const [attempt, setAttempt] = useState(0);
  const requestKey = `${path}:${attempt}`;
  const [result, setResult] = useState<{ key: string; data: TrendAnalysis | null; error: string }>({ key: "", data: null, error: "" });
  useEffect(() => {
    if (accountLoading) return;
    const controller = new AbortController();
    const deadline = window.setTimeout(() => controller.abort("timeout"), 30_000);
    api<TrendAnalysis>(path, { signal: controller.signal }).then((data) => {
      if (!controller.signal.aborted) setResult({ key: requestKey, data, error: "" });
    }).catch((cause) => {
      if (!controller.signal.aborted) setResult({ key: requestKey, data: null, error: cause instanceof Error ? cause.message : "Análise indisponível." });
    }).finally(() => window.clearTimeout(deadline));
    // O timeout precisa produzir estado de erro, enquanto o cleanup apenas cancela.
    controller.signal.addEventListener("abort", () => {
      if (controller.signal.reason === "timeout") setResult({ key: requestKey, data: null, error: "A análise demorou para responder. Tente novamente." });
    });
    return () => { window.clearTimeout(deadline); controller.abort(); };
  }, [path, requestKey, accountLoading]);
  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const next = new URLSearchParams();
    fields.forEach((value, key) => { if (value || key === "referencia") next.set(key, String(value)); });
    navigate(`/tendencias?${next}`);
  }
  const loading = accountLoading || result.key !== requestKey;
  const analysis = !loading ? result.data : null;
  const stats = analysis?.estatisticas;
  const price = (n: number) => analysis ? formatMarketValue(n, analysis.moeda, analysis.unidade) : "—";
  return <div className="trends-page"><section className="panel"><div className="panel-header"><h2>Configure a análise</h2><span className="panel-meta">Fechamentos diários</span></div><form key={`${route.search}:${user?.id ?? "publico"}:${catalog.assets.length}`} className="trend-filters" onSubmit={apply}>
    <div className="field"><label htmlFor="trend-asset">Ativo</label><select name="ativo" id="trend-asset" defaultValue={asset}>{!catalog.assets.some((a) => a.id === asset) && <option value={asset}>{asset}</option>}{catalog.assets.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
    <div className="field"><label htmlFor="trend-period">Histórico consultado</label><select name="periodo" id="trend-period" defaultValue={period}>{MARKET_PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}</select></div>
    <div className="field small-field"><label htmlFor="trend-short">Média curta</label><input name="curta" id="trend-short" type="number" min={2} max={199} defaultValue={short} required /></div><div className="field small-field"><label htmlFor="trend-long">Média longa</label><input name="longa" id="trend-long" type="number" min={3} max={200} defaultValue={long} required /></div>
    <div className="field"><label htmlFor="trend-horizon">Projeção</label><select name="horizonte" id="trend-horizon" defaultValue={horizon}>{[5, 10, 20].map((n) => <option key={n} value={n}>{n} observações</option>)}</select></div>
    <div className="field"><label htmlFor="trend-benchmark">Cruzar retornos com</label><select name="referencia" id="trend-benchmark" defaultValue={benchmark}><option value="">Sem comparação</option>{catalog.assets.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
    <div className="field"><label htmlFor="trend-start">Data inicial · opcional</label><input name="inicio" id="trend-start" type="date" defaultValue={params.get("inicio") ?? ""} /></div><div className="field"><label htmlFor="trend-end">Data final · opcional</label><input name="fim" id="trend-end" type="date" defaultValue={params.get("fim") ?? ""} /></div>
    <button className="action-button primary-action" type="submit">Aplicar filtros →</button><button className="action-button" type="button" disabled={loading} onClick={() => setAttempt((n) => n + 1)}>Atualizar análise</button><p className="filter-help">As datas recortam o histórico escolhido. Médias, estatísticas e regressão usam somente os registros desse recorte; amostras pequenas exigem ampliar o período.</p>
  </form>{catalog.error && <p className="form-error" role="alert">{catalog.error} <button className="action-button" onClick={catalog.reload}>Recarregar catálogo</button></p>}</section>
  {!analysis ? <section className="panel"><MarketDataState loading={loading} error={!loading ? result.error : ""} retry={() => setAttempt((n) => n + 1)} /></section> : <>
    <section className={`panel trend-verdict trend-${analysis.direcao}`}><div><span className="eyebrow">{analysis.ticker} / LEITURA DA AMOSTRA</span><h2>{directionLabel[analysis.direcao]}</h2><p>{analysis.observacoes} observações · {formatMarketDate(analysis.inicio)} a {formatMarketDate(analysis.fim)}</p></div><div><span className="eyebrow">AJUSTE HISTÓRICO · R²</span><strong>{(analysis.estatisticas.r_quadrado * 100).toFixed(1)}%</strong><p>Não indica chance de acerto futuro.</p></div></section>
    <div className="analysis-metrics">{[
      ["Variação da amostra", formatMarketPercent(stats!.variacao_pct), "Primeiro ao último fechamento"],
      ["Volatilidade diária", `${stats!.volatilidade_pct.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`, "Desvio amostral dos retornos"],
      ["Maior queda do pico", formatMarketPercent(stats!.queda_maxima_pct), "Drawdown dos fechamentos"],
      ["Correlação dos retornos", analysis.correlacao?.valor != null ? analysis.correlacao.valor.toLocaleString("pt-BR", { maximumFractionDigits: 3 }) : "—", analysis.correlacao ? `${analysis.correlacao.pares} pares · ${catalog.assets.find((a) => a.id === analysis.correlacao?.ativo)?.name ?? analysis.correlacao.ativo}` : "Referência desativada"],
    ].map(([label, value, help]) => <div className="panel metric-card" key={label}><span className="eyebrow">{label}</span><strong>{value}</strong><small>{help}</small></div>)}</div>
    {analysis.correlacao?.motivo && <p className="analysis-note" role="status">Correlação: {analysis.correlacao.motivo}</p>}
    <TrendChart analysis={analysis} />
    <div className="analysis-details-grid"><section className="panel"><div className="panel-header"><h2>Estatística descritiva</h2></div><dl className="coverage-list">{[
      ["Média dos fechamentos", price(stats!.media)], ["Mediana", price(stats!.mediana)], ["Menor / maior fechamento", `${price(stats!.minimo)} / ${price(stats!.maximo)}`],
      ["Retorno médio diário", formatMarketPercent(stats!.retorno_medio_pct)], ["Inclinação da regressão / observação", formatMarketPercent(stats!.inclinacao_pct)], ["Distância média curta / longa", formatMarketPercent(stats!.distancia_medias_pct)], ["Retornos além de 3 desvios", String(stats!.movimentos_extremos)],
    ].map(([label, v]) => <div key={label}><dt>{label}</dt><dd>{v}</dd></div>)}</dl><p className="coverage-note">Correlação de Pearson entre retornos com datas de início e fim iguais. Fechamentos de mercados diferentes podem ocorrer em horários diferentes.</p></section><section className="panel"><div className="panel-header"><h2>Cenários ao longo do tempo</h2><span className="panel-meta">{analysis.horizonte} observações</span></div><div className="projection-table-scroll" role="region" aria-label="Tabela de projeções" tabIndex={0}><table className="projection-table"><caption className="sr-only">Projeção estatística e faixa ilustrativa, na moeda original do ativo.</caption><thead><tr><th scope="col">Passo</th><th scope="col">Inferior</th><th scope="col">Estimativa</th><th scope="col">Superior</th></tr></thead><tbody>{analysis.projecoes.map((p) => <tr key={p.passo}><th scope="row">+{p.passo}</th><td>{price(p.inferior)}</td><td>{price(p.estimativa)}</td><td>{price(p.superior)}</td></tr>)}</tbody></table></div></section></div>
    <section className="panel methodology"><div className="panel-header"><h2>Como chegamos a essa leitura</h2><span className="panel-meta">Algoritmo explicável</span></div><ol>{analysis.explicacao.map((text) => <li key={text}>{text}</li>)}</ol><div className="analysis-warnings">{analysis.avisos.map((text) => <p key={text}>{text}</p>)}</div><div className="panel-footer"><span>{analysis.fonte} · {analysis.em_cache ? "Cache de até 60 s" : "Consulta à fonte"} · {analysis.qualidade ? `${analysis.qualidade.valid}/${analysis.qualidade.received} registros válidos na coleta; ${analysis.qualidade.discarded} descartados ou duplicados` : "Qualidade não informada"}</span><span>Coleta: {analysis.coletado_em ? new Date(analysis.coletado_em).toLocaleString("pt-BR") : "—"} · Sem confirmação de tempo real</span></div></section>
  </>}
  </div>;
}
