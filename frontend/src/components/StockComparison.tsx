import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { stocks, gerarHistorico, type Periodo } from "../data/stocks";
import { classeVariacao, formatarNumero, formatarPercentual, resumirHistorico } from "../utils/market";
import "../styles/charts.css";

type StockComparisonProps = { periodo: Periodo };

export default function StockComparison({ periodo }: StockComparisonProps) {
  const [acao1, setAcao1] = useState("PETR4");
  const [acao2, setAcao2] = useState("VALE3");
  const codigos = Object.keys(stocks);
  const historico1 = gerarHistorico(stocks[acao1].dados[0].preco, periodo);
  const historico2 = gerarHistorico(stocks[acao2].dados[0].preco, periodo);
  const resumo1 = resumirHistorico(historico1);
  const resumo2 = resumirHistorico(historico2);
  const mesmaAcao = acao1 === acao2;

  if (!resumo1 || !resumo2) {
    return (
      <section id="comparacao" className="panel comparison-panel" aria-labelledby="comparison-title">
        <div className="panel-header"><h2 id="comparison-title">Comparação de ativos</h2></div>
        <p className="chart-empty" role="status">Nenhum dado disponível para comparar.</p>
      </section>
    );
  }

  const variacao1 = resumo1.percentual;
  const variacao2 = resumo2.percentual;
  const diferenca = Math.abs(variacao1 - variacao2);
  const melhorAcao = mesmaAcao || diferenca < 0.000001 ? "Empate" : variacao1 > variacao2 ? acao1 : acao2;
  const dadosComparacao = historico1.map((item, index) => ({
    dia: item.dia,
    primeira: Number(((item.preco / resumo1.inicial) * 100).toFixed(2)),
    segunda: Number(((historico2[index].preco / resumo2.inicial) * 100).toFixed(2)),
  }));

  return (
    <section id="comparacao" className="panel comparison-panel" aria-labelledby="comparison-title" tabIndex={-1}>
      <div className="panel-header">
        <h2 id="comparison-title">Comparação de ativos</h2>
        <span className="panel-meta">BASE 100 · {periodo} DIAS</span>
      </div>

      <div className="comparison-controls">
        <div className="field">
          <label htmlFor="acao1">Primeira ação</label>
          <select id="acao1" value={acao1} onChange={(event) => setAcao1(event.target.value)}>
            {codigos.map((codigo) => <option key={codigo} value={codigo}>{codigo} · {stocks[codigo].nome}</option>)}
          </select>
        </div>
        <span className="comparison-versus mono" aria-hidden="true">×</span>
        <div className="field">
          <label htmlFor="acao2">Segunda ação</label>
          <select id="acao2" value={acao2} onChange={(event) => setAcao2(event.target.value)}>
            {codigos.map((codigo) => <option key={codigo} value={codigo}>{codigo} · {stocks[codigo].nome}</option>)}
          </select>
        </div>
      </div>

      {mesmaAcao && <p className="comparison-equality" role="status">A mesma ação está selecionada. Escolha ações diferentes para comparar empresas.</p>}

      <dl className="comparison-metrics" aria-live="polite" aria-atomic="true">
        <div><dt>Variação {acao1}</dt><dd className={`mono ${classeVariacao(variacao1)}`}>{formatarPercentual(variacao1)}</dd></div>
        <div><dt>Variação {acao2}</dt><dd className={`mono ${classeVariacao(variacao2)}`}>{formatarPercentual(variacao2)}</dd></div>
        <div><dt>Melhor desempenho</dt><dd className="mono">{melhorAcao}</dd></div>
        <div><dt>Diferença</dt><dd className="mono">{formatarNumero(diferenca)} p.p.</dd></div>
      </dl>

      <div className="comparison-chart">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <LineChart data={dadosComparacao} margin={{ top: 12, right: 8, left: 8, bottom: 0 }} accessibilityLayer aria-label={`Comparação simulada entre ${acao1} e ${acao2} em base 100. Use as setas para percorrer os valores.`}>
            <CartesianGrid stroke="#202329" vertical={false} />
            <XAxis dataKey="dia" axisLine={{ stroke: "#30343b" }} tickLine={false} tick={{ fill: "#969da8", fontSize: 11 }} tickMargin={10} minTickGap={36} height={34} />
            <YAxis orientation="right" domain={["auto", "auto"]} tickFormatter={(valor) => Number(valor).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} axisLine={false} tickLine={false} tick={{ fill: "#969da8", fontSize: 11 }} tickCount={4} width={50} tickMargin={10} />
            <Tooltip
              cursor={{ stroke: "#666d77", strokeDasharray: "3 3" }}
              contentStyle={{ background: "#171a1f", border: "1px solid #353a42", borderRadius: 2, color: "#e8e9eb", fontSize: 12 }}
              labelStyle={{ color: "#aeb4be", marginBottom: 5 }}
              labelFormatter={(label) => `Data: ${label}`}
              formatter={(valor, nome) => [formatarNumero(Number(valor)), `${nome} (base 100)`]}
            />
            <ReferenceLine y={100} stroke="#68717d" strokeDasharray="4 4" />
            <Line type="linear" dataKey="primeira" name={acao1} stroke="#e7a84b" strokeWidth={2} dot={false} activeDot={{ r: 4, stroke: "#111419", strokeWidth: 2 }} isAnimationActive={false} />
            <Line type="linear" dataKey="segunda" name={acao2} stroke="#8da9d9" strokeDasharray="5 3" strokeWidth={2} dot={false} activeDot={{ r: 4, stroke: "#111419", strokeWidth: 2 }} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-legend comparison-legend">
        <span><i className="series-line series-primary" aria-hidden="true" />{acao1}</span>
        <span><i className="series-line series-secondary" aria-hidden="true" />{acao2}</span>
        <span className="comparison-explanation">Desempenho relativo · dados simulados</span>
      </div>
    </section>
  );
}
