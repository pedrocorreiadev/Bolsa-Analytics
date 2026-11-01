import { useEffect, useState } from "react";
import { Icon } from "../components/Icon";
import StockChart from "../components/StockChart";
import StockIndicators from "../components/StockIndicators";
import StockComparison from "../components/StockComparison";
import { stocks, type Periodo, type StockPoint } from "../data/stocks";
import { buscarHistoricoAcao } from "../services/stockService";
import { classeVariacao, formatarMoeda, formatarPercentual, resumirHistorico } from "../utils/market";

const codigos = Object.keys(stocks);
const periodos: Periodo[] = [7, 30, 90];

type Consulta = {
  periodo: Periodo;
  tentativa: number;
  historicos: Record<string, StockPoint[]>;
  erro: string;
};

function LegacyAnalysis() {
  const [acao, setAcao] = useState("PETR4");
  const [periodo, setPeriodo] = useState<Periodo>(7);
  const [tentativa, setTentativa] = useState(0);
  const [consulta, setConsulta] = useState<Consulta>({
    periodo: 7, tentativa: -1, historicos: {}, erro: "",
  });

  useEffect(() => {
    let ativo = true;

    async function carregarDados() {
      try {
        const resultados = await Promise.all(
          codigos.map(async (codigo) => [codigo, await buscarHistoricoAcao(codigo, periodo)] as const),
        );
        if (ativo) {
          setConsulta({ periodo, tentativa, historicos: Object.fromEntries(resultados), erro: "" });
        }
      } catch {
        if (ativo) {
          setConsulta({ periodo, tentativa, historicos: {}, erro: "Não foi possível carregar os dados das ações." });
        }
      }
    }

    void carregarDados();
    return () => { ativo = false; };
  }, [periodo, tentativa]);

  const carregando = consulta.periodo !== periodo || consulta.tentativa !== tentativa;
  const dados = carregando ? [] : consulta.historicos[acao] ?? [];
  const resumo = resumirHistorico(dados);
  const ultimoDia = dados.at(-1)?.dia;
  const historicoInvertido = [...dados].reverse();

  return (
    <div className="legacy-analysis">
          <section className="quote-strip" aria-label={`Cotações simuladas · período de ${periodo} dias`} aria-busy={carregando}>
            <div className="strip-label"><span className="eyebrow">Ações</span><span className="muted">Simulação · {periodo} dias</span></div>
            {codigos.map((codigo) => {
              const cotacao = resumirHistorico(carregando ? [] : consulta.historicos[codigo] ?? []);
              return (
                <button key={codigo} type="button" className={`ticker-item ${acao === codigo ? "is-selected" : ""}`} onClick={() => setAcao(codigo)} aria-pressed={acao === codigo} aria-label={`Selecionar ${codigo}, ${stocks[codigo].nome}${cotacao ? `, último valor simulado ${formatarMoeda(cotacao.ultimo)}, variação ${formatarPercentual(cotacao.percentual)} em ${periodo} dias` : ", cotação indisponível"}`}>
                  <span className="ticker-symbol mono">{codigo}<span className="ticker-name">{stocks[codigo].nome}</span></span>
                  <span className="ticker-value mono">{cotacao ? formatarMoeda(cotacao.ultimo) : "—"}<span className={cotacao ? classeVariacao(cotacao.percentual) : "muted"}>{cotacao ? formatarPercentual(cotacao.percentual) : "—"}</span></span>
                </button>
              );
            })}
          </section>

          <div className="workspace-heading">
            <div><p className="eyebrow">Séries locais preservadas</p><h2>Laboratório simulado<span className="heading-dot">.</span></h2></div>
            <p className="workspace-note">Dados simulados para fins acadêmicos</p>
          </div>

          <div className="dashboard-grid">
            <section id="analise" className="panel primary-panel" aria-labelledby="titulo-grafico" tabIndex={-1}>
              <div className="panel-header"><h2 id="titulo-grafico">Evolução do preço <span className="panel-symbol">{acao}</span></h2><span className="panel-meta">BRL · Linha</span></div>
              <div className="asset-heading">
                <div><div className="asset-name"><h3>{acao}</h3><span>{stocks[acao].nome}</span><span className="instrument-tag">Ação</span></div>
                  <div className="asset-price"><strong className="mono">{resumo ? formatarMoeda(resumo.ultimo) : "—"}</strong>{resumo && <span className={`price-change mono ${classeVariacao(resumo.percentual)}`}><Icon name={resumo.variacao >= 0 ? "arrow-up" : "arrow-down"} size={15} />{formatarPercentual(resumo.percentual)}<small>no período</small></span>}</div>
                  <p className="quote-caption">Último valor simulado{ultimoDia ? ` · ${ultimoDia}` : ""}</p>
                </div>
                <span className="series-count mono">{dados.length > 0 ? `${dados.length} pontos` : "—"}</span>
              </div>
              <div className="chart-toolbar"><div className="period-control" role="group" aria-label="Período de análise"><span className="toolbar-label">Período</span>{periodos.map((dias) => <button key={dias} type="button" aria-pressed={periodo === dias} onClick={() => setPeriodo(dias)}>{dias} dias</button>)}</div><span className="toolbar-note">Preços simulados</span></div>

              <div aria-busy={carregando} className="chart-content">
                {carregando ? (
                  <div className="state-message chart-state" role="status"><span className="loading-bars" aria-hidden="true"><i /><i /><i /><i /><i /></span><strong>Carregando histórico</strong><span>Preparando os dados do período selecionado.</span></div>
                ) : consulta.erro ? (
                  <div className="state-message chart-state" role="alert"><strong className="negative">Não foi possível exibir o gráfico</strong><span>{consulta.erro}</span><button className="retry-button" type="button" onClick={() => setTentativa((valor) => valor + 1)}><Icon name="refresh" size={14} />Tentar novamente</button></div>
                ) : dados.length === 0 ? (
                  <div className="state-message chart-state" role="status"><strong>Nenhum dado disponível</strong><span>Não há histórico para este ativo no período selecionado.</span></div>
                ) : <StockChart dados={dados} codigo={acao} />}
              </div>
              <div className="panel-footer"><span>{dados.length > 0 ? `${dados[0].dia} a ${ultimoDia}` : "Histórico indisponível"}</span><span>Série simulada · {periodo} dias corridos</span></div>
            </section>

            <aside className="market-sidebar" aria-label="Ativos e indicadores">
              <section className="panel watchlist-panel" aria-labelledby="titulo-ativos">
                <div className="panel-header"><h2 id="titulo-ativos">Lista de ativos</h2><span className="panel-meta">{codigos.length} ações</span></div>
                <div className="watchlist-head" aria-hidden="true"><span>Ativo</span><span>Último / Var.</span></div>
                <ul className="watchlist">{codigos.map((codigo) => {
                  const cotacao = resumirHistorico(carregando ? [] : consulta.historicos[codigo] ?? []);
                  return <li key={codigo}><button type="button" className={acao === codigo ? "is-selected" : ""} onClick={() => setAcao(codigo)} aria-pressed={acao === codigo}><span><strong className="mono">{codigo}</strong><small>{stocks[codigo].nome}</small></span><span className="watchlist-quote mono"><strong>{cotacao ? formatarMoeda(cotacao.ultimo) : "—"}</strong><small className={cotacao ? classeVariacao(cotacao.percentual) : "muted"}>{cotacao ? formatarPercentual(cotacao.percentual) : "—"}</small></span></button></li>;
                })}</ul>
                <p className="watchlist-note">Variação no período de {periodo} dias · simulação</p>
              </section>

              <section className="panel summary-panel" aria-labelledby="titulo-resumo">
                <div className="panel-header"><h2 id="titulo-resumo">Resumo do ativo</h2><span className="panel-symbol">{acao}</span></div>
                <p className="summary-period">Estatísticas do período <span className="mono">{periodo} dias</span></p>
                {dados.length > 0 ? <StockIndicators dados={dados} /> : <p className="state-message muted">{carregando ? "Carregando indicadores…" : "Sem indicadores disponíveis."}</p>}
              </section>
            </aside>

            <StockComparison periodo={periodo} />

            <section id="historico" className="panel history-panel" aria-labelledby="titulo-historico" tabIndex={-1}>
              <div className="panel-header"><h2 id="titulo-historico">Histórico <span className="panel-symbol">{acao}</span></h2><span className="panel-meta">{dados.length} registros</span></div>
              <div className="history-caption"><span>Mais recentes primeiro</span><span className="mono">BRL</span></div>
              {dados.length > 0 ? <div className="table-scroll" role="region" aria-label={`Histórico de preços simulados de ${acao}`} tabIndex={0}><table><caption className="sr-only">Preços simulados e variação em relação ao ponto anterior. Datas no formato dia/mês.</caption><thead><tr><th scope="col">Data</th><th scope="col">Preço</th><th scope="col">Var. anterior</th></tr></thead><tbody>{historicoInvertido.map((ponto, index) => {
                const anterior = historicoInvertido[index + 1]?.preco;
                const variacao = anterior === undefined || anterior === 0 ? null : ((ponto.preco - anterior) / anterior) * 100;
                return <tr key={ponto.dia}><td className="mono">{ponto.dia}</td><td className="mono">{formatarMoeda(ponto.preco)}</td><td className={`mono ${variacao === null ? "muted" : classeVariacao(variacao)}`}>{variacao === null ? "—" : formatarPercentual(variacao)}</td></tr>;
              })}</tbody></table></div> : <p className="state-message muted">{carregando ? "Carregando registros…" : "Sem registros para este período."}</p>}
              <div className="panel-footer"><span>Valores da mesma série do gráfico</span></div>
            </section>
          </div>

    </div>
  );
}

export default LegacyAnalysis;
