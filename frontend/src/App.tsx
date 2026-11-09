import { lazy, Suspense, useEffect, useState, type FormEvent } from "react";
import { Icon, type IconName } from "./components/Icon";
import { AppLink, navigate, useRoute } from "./router";
import { MarketOverviewProvider } from "./components/MarketOverviewProvider";
import NavigationMarketSummary from "./components/NavigationMarketSummary";
import MarketTicker from "./components/MarketTicker";
import { useMarketOverview } from "./hooks/useMarketOverview";
import HomePage from "./pages/HomePage";
import MarketPage from "./pages/MarketPage";
import { AccountProvider } from "./components/AccountProvider";
import { useAccount } from "./hooks/useAccount";
import "./styles/terminal.css";
import "./styles/workspace.css";

const ChartsPage = lazy(() => import("./pages/ChartsPage"));
const CandlesPage = lazy(() => import("./pages/CandlesPage"));
const ComparisonPage = lazy(() => import("./pages/ComparisonPage"));
const TrendsPage = lazy(() => import("./pages/TrendsPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const AccountPage = lazy(() => import("./pages/AccountPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const QuotesPage = lazy(() => import("./pages/QuotesPage"));
const pages: { path: string; label: string; icon: IconName; detail: string; code: string }[] = [
  { path: "/", label: "Visão geral", icon: "chart", detail: "Panorama dos ativos e dos últimos históricos disponíveis.", code: "01" },
  { path: "/mercado", label: "Mercado", icon: "history", detail: "Explore, filtre e ordene os ativos atendidos pela fonte.", code: "02" },
  { path: "/graficos", label: "Gráficos", icon: "chart", detail: "Evolução de preços, estatísticas e laboratório acadêmico.", code: "03" },
  { path: "/candles", label: "Candles", icon: "chart", detail: "Histórico OHLCV, volume e navegação por período.", code: "04" },
  { path: "/comparacao", label: "Comparação", icon: "compare", detail: "Preços, variações e desempenho relativo de dois ativos.", code: "05" },
  { path: "/tendencias", label: "Tendências", icon: "arrow-up", detail: "Cruze médias móveis, estatísticas e cenários ao longo do tempo.", code: "06" },
  { path: "/cotacoes", label: "Cotações", icon: "refresh", detail: "Acompanhe cotações intradiárias com atualização automática e horário da fonte.", code: "12" },
];
const accountPages: typeof pages = [
  { path: "/conta", label: "Minha área", icon: "user", detail: "Seus ativos, seu acompanhamento e suas ferramentas.", code: "07" },
  { path: "/perfil", label: "Meu perfil", icon: "user", detail: "Gerencie seus dados e a segurança da conta.", code: "08" },
  { path: "/configuracoes", label: "Configurações", icon: "settings", detail: "Personalize o terminal e salve seus favoritos.", code: "09" },
  { path: "/admin", label: "Administração", icon: "shield", detail: "Usuários, consultas à fonte e qualidade da coleta.", code: "10" },
  { path: "/login", label: "Acesso", icon: "user", detail: "Entre ou crie sua conta no Bolsa Analytics.", code: "11" },
];

function AccountRoute({ admin = false }: { admin?: boolean }) {
  const { user, loading, error, refresh } = useAccount();
  const { pathname } = useRoute();
  if (loading) return <div className="panel state-message" role="status">Verificando sessão…</div>;
  if (error) return <div className="panel account-card"><h2>Sessão indisponível</h2><p role="alert">{error}</p><button className="action-button" onClick={() => void refresh()}>Tentar novamente</button></div>;
  if (!user) return <div className="panel account-card"><h2>Entre para acessar sua área</h2><p>Salve seu perfil e personalize as ferramentas do terminal.</p><AppLink className="action-button primary-action" href={`/login?destino=${encodeURIComponent(pathname)}`}>Entrar ou criar conta →</AppLink></div>;
  if (admin && user.papel !== "admin") return <div className="panel account-card"><h2>Acesso restrito</h2><p>Este painel está disponível para administradores.</p><AppLink href="/conta" className="action-button">Voltar para minha área</AppLink></div>;
  return admin ? <AdminPage /> : <AccountPage key={pathname + user.id} />;
}

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
  const current = [...pages, ...accountPages].find((page) => page.path === pathname);
  const { user, loading: accountLoading, logout } = useAccount();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState("");
  const { rows, loading, error, reload } = useMarketOverview();
  useEffect(() => {
    document.title = `${current?.label ?? "Página não encontrada"} · Bolsa Analytics`;
    document.getElementById("main-content")?.focus({ preventScroll: true });
  }, [pathname, current?.label]);
  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate(`/mercado${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`);
  }
  async function signOut() {
    setLoggingOut(true); setLogoutError("");
    try { await logout(); navigate("/login"); }
    catch (cause) { setLogoutError(cause instanceof Error ? cause.message : "Não foi possível sair."); }
    finally { setLoggingOut(false); }
  }

  return <div className={`terminal-app terminal-v2 ${collapsed ? "nav-collapsed" : ""}`}>
    <a href="#main-content" className="skip-link">Ir para o conteúdo</a>
    <header className="terminal-topbar"><AppLink href="/" className="terminal-wordmark" aria-label="Bolsa Analytics, início">BOLSA<span>ANALYTICS</span></AppLink><span className="topbar-divider" /><span className="topbar-context">{current?.label ?? "404"}</span><form className="global-search" onSubmit={search} role="search"><label className="sr-only" htmlFor="global-asset-search">Selecionar ativo no mercado</label><select id="global-asset-search" value={query} onChange={(event) => setQuery(event.target.value)} disabled={!rows.length}><option value="">{!rows.length ? loading ? "Carregando ativos…" : "Catálogo indisponível" : "Todos os ativos"}</option>{rows.map(({ asset }) => <option key={asset.id} value={asset.ticker}>{asset.name} · {asset.ticker}</option>)}</select><button type="submit">Ver {query ? "ativo" : "todos"} <span aria-hidden="true">↵</span></button></form><MarketTicker rows={rows} loading={loading} /><Clock /><span className="historical-badge"><span aria-hidden="true" />Históricos</span></header>
    <div className="app-frame"><aside className="terminal-navigation"><div className="navigation-caption"><span>Área de trabalho</span><button type="button" onClick={() => setCollapsed((value) => !value)} aria-expanded={!collapsed} aria-label={collapsed ? "Expandir navegação" : "Recolher navegação"}>{collapsed ? "›" : "‹"}</button></div><nav aria-label="Páginas do terminal">{pages.map((page) => <AppLink key={page.path} href={page.path} className={`page-nav-item ${pathname === page.path ? "active" : ""}`} aria-current={pathname === page.path ? "page" : undefined} title={page.label}><Icon name={page.icon} size={16} /><span>{page.label}</span><small className="mono">{page.code}</small></AppLink>)}</nav><div className="account-navigation"><span className="account-nav-label">{user ? user.nome : "Minha conta"}</span><nav aria-label="Conta e ferramentas">{accountPages.filter((page) => page.path === "/login" ? !user : page.path !== "/admin" || user?.papel === "admin").filter((page) => user || page.path === "/login").map((page) => <AppLink key={page.path} href={page.path} className={`page-nav-item ${pathname === page.path ? "active" : ""}`} aria-current={pathname === page.path ? "page" : undefined} title={page.label}><Icon name={page.icon} size={16} /><span>{page.path === "/login" ? accountLoading ? "Verificando…" : "Entrar / cadastrar" : page.label}</span></AppLink>)}{user && <button type="button" className="page-nav-item logout-button" disabled={loggingOut} onClick={() => void signOut()} title="Sair"><Icon name="logout" size={16} /><span>{loggingOut ? "Saindo…" : "Sair"}</span></button>}</nav>{logoutError && <p className="form-error" role="alert">{logoutError}</p>}</div><NavigationMarketSummary rows={rows} loading={loading} error={error} reload={reload} /><div className="navigation-footer"><span className="nav-brand mono">BA<span>_</span></span><p>Projeto acadêmico<br />Análise de mercado</p></div></aside>
      <div className="page-container"><div className="page-heading"><div><p className="eyebrow">BOLSA ANALYTICS <span>/ {current?.code ?? "404"}</span></p><h1>{current?.label ?? "Página não encontrada"}</h1><p className="page-description">{current?.detail ?? "Este endereço não corresponde a uma página do terminal."}</p></div>{pathname !== "/comparacao" && <AppLink className="compare-cta" href="/comparacao"><Icon name="compare" size={17} /><span>Comparar ativos<small>Preços · variações · candles</small></span><span aria-hidden="true">↗</span></AppLink>}</div>
        <main id="main-content" className="page-content" tabIndex={-1}><Suspense fallback={<div className="panel state-message" role="status">Carregando página…</div>}>{pathname === "/" ? <HomePage /> : pathname === "/mercado" ? <MarketPage /> : pathname === "/graficos" ? <ChartsPage /> : pathname === "/candles" ? <CandlesPage /> : pathname === "/comparacao" ? <ComparisonPage /> : pathname === "/tendencias" ? <TrendsPage /> : pathname === "/cotacoes" ? <QuotesPage /> : pathname === "/login" ? <LoginPage /> : pathname === "/admin" ? <AccountRoute admin /> : ["/conta", "/perfil", "/configuracoes"].includes(pathname) ? <AccountRoute /> : <div className="panel state-message"><h2>Endereço não encontrado</h2><AppLink className="action-button" href="/">Voltar à visão geral</AppLink></div>}</Suspense></main>
        <footer className="terminal-footer"><span><span className="footer-dot" aria-hidden="true" />Bolsa Analytics <span className="footer-divider">/</span> Projeto acadêmico</span><span>Históricos da fonte · atualização por consulta <span className="footer-divider">/</span> Sem confirmação de tempo real</span></footer>
      </div>
    </div>
  </div>;
}

export default function App() {
  return <AccountProvider><MarketOverviewProvider><Terminal /></MarketOverviewProvider></AccountProvider>;
}
