import { lazy, Suspense, useState } from "react";
import CandlesPage from "./CandlesPage";
const LegacyAnalysis = lazy(() => import("./LegacyAnalysis"));

export default function ChartsPage() {
  const [laboratory, setLaboratory] = useState(false);
  return <div className="analysis-page"><CandlesPage initialMode="line" /><section className="laboratory-section"><button type="button" className="laboratory-toggle" aria-expanded={laboratory} aria-controls="simulation-laboratory" onClick={() => setLaboratory((value) => !value)}><span><strong>Laboratório com séries simuladas</strong><small>Gráficos, indicadores e comparação originais do projeto · PETR4, VALE3 e ITUB4</small></span><span aria-hidden="true">{laboratory ? "−" : "+"}</span></button>{laboratory && <div id="simulation-laboratory"><Suspense fallback={<p className="state-message" role="status">Carregando laboratório…</p>}><LegacyAnalysis /></Suspense></div>}</section></div>;
}
