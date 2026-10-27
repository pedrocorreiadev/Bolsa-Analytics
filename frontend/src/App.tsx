
import { useEffect, useState } from "react";
import HomePage from "./pages/HomePage";
import StockChart from "./components/StockChart";
import StockIndicators from "./components/StockIndicators";

import {
  stocks,
  type Periodo,
  type StockPoint,
} from "./data/stocks";

import { buscarHistoricoAcao } from "./services/stockService";

function App() {
  const [acao, setAcao] = useState("PETR4");
  const [periodo, setPeriodo] = useState<Periodo>(7);

  const [dados, setDados] = useState<StockPoint[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;

    async function carregarDados() {
      setCarregando(true);
      setErro("");

      try {
        const resultado = await buscarHistoricoAcao(
          acao,
          periodo
        );

        if (ativo) {
          setDados(resultado);
        }
      } catch {
        if (ativo) {
          setErro("Não foi possível carregar os dados.");
          setDados([]);
        }
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    carregarDados();

    return () => {
      ativo = false;
    };
  }, [acao, periodo]);

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

        {carregando ? (
          <p>Carregando dados financeiros...</p>
        ) : erro ? (
          <p style={{ color: "#dc2626" }}>
            {erro}
          </p>
        ) : (
          <>
            <StockIndicators dados={dados} />
            <StockChart dados={dados} />
          </>
        )}

        <p style={{ color: "#64748b", fontSize: "12px" }}>
          Dados simulados para fins acadêmicos.
        </p>
      </section>
    </>
  );
}

export default App;
