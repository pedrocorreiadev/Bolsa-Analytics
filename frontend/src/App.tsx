
import { useState } from "react";
import HomePage from "./pages/HomePage";
import StockChart from "./components/StockChart";
import StockIndicators from "./components/StockIndicators";
import { stocks } from "./data/stocks";

function App() {
  const [acao, setAcao] = useState("PETR4");

  const acaoSelecionada = stocks[acao];

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
            marginTop: "8px",
            marginBottom: "24px",
            border: "1px solid #cbd5e1",
            borderRadius: "8px",
          }}
        >
          {Object.keys(stocks).map((codigo) => (
            <option key={codigo} value={codigo}>
              {codigo} - {stocks[codigo].nome}
            </option>
          ))}
        </select>

        <StockIndicators
          dados={acaoSelecionada.dados}
        />

        <StockChart
          dados={acaoSelecionada.dados}
        />
      </section>
    </>
  );
}

export default App;
