import { lazy, Suspense, useEffect, useState, type FormEvent } from "react";
import { Icon, type IconName } from "./components/Icon";
import { AppLink, navigate, useRoute } from "./router";
import { MarketOverviewProvider } from "./components/MarketOverviewProvider";
import HomePage from "./pages/HomePage";
import MarketPage from "./pages/MarketPage";
import "./styles/terminal.css";

const ChartsPage = lazy(() => import("./pages/ChartsPage"));
const CandlesPage = lazy(() => import("./pages/CandlesPage"));
const ComparisonPage = lazy(() => import("./pages/ComparisonPage"));
const pages: { path: string; label: string; icon: IconName; detail: string; code: string }[] = [
  { path: "/", label: "Visão geral", icon: "chart", detail: "Panorama dos ativos e dos últimos históricos disponíveis.", code: "01" },
  { path: "/mercado", label: "Mercado", icon: "history", detail: "Explore, filtre e ordene os ativos atendidos pela fonte.", code: "02" },
  { path: "/graficos", label: "Gráficos", icon: "chart", detail: "Evolução de preços, estatísticas e laboratório acadêmico.", code: "03" },
  { path: "/candles", label: "Candles", icon: "chart", detail: "Histórico OHLCV, volume e navegação por período.", code: "04" },
  { path: "/comparacao", label: "Comparação", icon: "compare", detail: "Preços, variações e desempenho relativo de dois ativos.", code: "05" },
];

function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  return <span className="terminal-clock">Rio Branco <time className="mono" dateTime={now.toISOString()}>{now.toLocaleTimeString("pt-BR", { timeZone: "America/Rio_Branco", hour: "2-digit", minute: "2-digit" })}</time></span>;
}

function Terminal() {
  const { pathname } = useRoute();
  const current = pages.find((page) => page.path === pathname);
  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState("");
  useEffect(() => {
    document.title = `${current?.label ?? "Página não encontrada"} · Bolsa Analytics`;
    document.getElementById("main-content")?.focus({ preventScroll: true });
  }, [pathname, current?.label]);
  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate(`/mercado${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`);
  }

  return <div className={`terminal-app terminal-v2 ${collapsed ? "nav-collapsed" : ""}`}>
    <a href="#main-content" className="skip-link">Ir para o conteúdo</a>
    <header className="terminal-topbar"><AppLink href="/" className="terminal-wordmark" aria-label="Bolsa Analytics, início">BOLSA<span>ANALYTICS</span></AppLink><span className="topbar-divider" /><span className="topbar-context">{current?.label ?? "404"}</span><form className="global-search" onSubmit={search} role="search"><label className="sr-only" htmlFor="global-asset-search">Buscar ativo no mercado</label><input id="global-asset-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar símbolo ou ativo…" /><button type="submit">Buscar <span aria-hidden="true">↵</span></button></form><Clock /><span className="historical-badge"><span aria-hidden="true" />Históricos</span></header>
    <div className="app-frame"><aside className="terminal-navigation"><div className="navigation-caption"><span>Área de trabalho</span><button type="button" onClick={() => setCollapsed((value) => !value)} aria-expanded={!collapsed} aria-label={collapsed ? "Expandir navegação" : "Recolher navegação"}>{collapsed ? "›" : "‹"}</button></div><nav aria-label="Páginas do terminal">{pages.map((page) => <AppLink key={page.path} href={page.path} className={`page-nav-item ${pathname === page.path ? "active" : ""}`} aria-current={pathname === page.path ? "page" : undefined} title={page.label}><Icon name={page.icon} size={16} /><span>{page.label}</span><small className="mono">{page.code}</small></AppLink>)}</nav><div className="navigation-footer"><span className="nav-brand mono">BA<span>_</span></span><p>Projeto acadêmico<br />Análise de mercado</p></div></aside>
      <div className="page-container"><div className="page-heading"><div><p className="eyebrow">BOLSA ANALYTICS <span>/ {current?.code ?? "404"}</span></p><h1>{current?.label ?? "Página não encontrada"}</h1><p className="page-description">{current?.detail ?? "Este endereço não corresponde a uma página do terminal."}</p></div>{pathname !== "/comparacao" && <AppLink className="compare-cta" href="/comparacao"><Icon name="compare" size={17} /><span>Comparar ativos<small>Preços · variações · candles</small></span><span aria-hidden="true">↗</span></AppLink>}</div>
        <main id="main-content" className="page-content" tabIndex={-1}><Suspense fallback={<div className="panel state-message" role="status">Carregando página…</div>}>{pathname === "/" ? <HomePage /> : pathname === "/mercado" ? <MarketPage /> : pathname === "/graficos" ? <ChartsPage /> : pathname === "/candles" ? <CandlesPage /> : pathname === "/comparacao" ? <ComparisonPage /> : <div className="panel state-message"><h2>Endereço não encontrado</h2><AppLink className="action-button" href="/">Voltar à visão geral</AppLink></div>}</Suspense></main>
        <footer className="terminal-footer"><span><span className="footer-dot" aria-hidden="true" />Bolsa Analytics <span className="footer-divider">/</span> Projeto acadêmico</span><span>Históricos da fonte · atualização por consulta <span className="footer-divider">/</span> Sem confirmação de tempo real</span></footer>
      </div>
    </div>
  </div>;
}

export default function App() {
  return <MarketOverviewProvider><Terminal /></MarketOverviewProvider>;
}
