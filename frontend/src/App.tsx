
import { useState } from "react";
import HomePage from "./pages/HomePage";
import StockChart from "./components/StockChart";
import StockIndicators from "./components/StockIndicators";
import {
  stocks,
  gerarHistorico,
  type Periodo,
} from "./data/stocks";

function App() {
  const [acao, setAcao] = useState("PETR4");
  const [periodo, setPeriodo] = useState<Periodo>(7);

  const acaoSelecionada = stocks[acao];

  const precoInicial = acaoSelecionada.dados[0].preco;

  const dadosFiltrados = gerarHistorico(
    precoInicial,
    periodo
  );

  return (
    <>
      <HomePage />

      <section
        style={{
          padding: "30px",
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        <h2>Análise de ações</h2>

        <label htmlFor="acao">
          Selecione uma ação:
        </label>

        <select
          id="acao"
          value={acao}
          onChange={(event) =>
            setAcao(event.target.value)
          }
          style={{
            display: "block",
            padding: "10px",
            margin: "12px 0 24px",
            borderRadius: "8px",
            border: "1px solid #cbd5e1",
          }}
        >
          {Object.keys(stocks).map((codigo) => (
            <option key={codigo} value={codigo}>
              {codigo} - {stocks[codigo].nome}
            </option>
          ))}
        </select>

        <h3>Período de análise</h3>

        <div
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "24px",
          }}
        >
          {([7, 30, 90] as Periodo[]).map(
            (dias) => (
              <button
                key={dias}
                type="button"
                onClick={() => setPeriodo(dias)}
                style={{
                  padding: "10px 18px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  border: "1px solid #cbd5e1",
                  background:
                    periodo === dias
                      ? "#2563eb"
                      : "#ffffff",
                  color:
                    periodo === dias
                      ? "#ffffff"
                      : "#0f172a",
                }}
              >
                {dias} dias
              </button>
            )
          )}
        </div>

        <StockIndicators dados={dadosFiltrados} />

        <StockChart dados={dadosFiltrados} />
      </section>
    </>
  );
}

export default App;
