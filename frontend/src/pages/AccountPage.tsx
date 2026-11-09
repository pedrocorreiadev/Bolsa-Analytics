import { useState, type FormEvent } from "react";
import { useAccount } from "../hooks/useAccount";
import { api, type Preferences, type User } from "../services/accountService";
import { AppLink, useRoute } from "../router";
import useMarketAssets from "../hooks/useMarketAssets";
import { useMarketOverview } from "../hooks/useMarketOverview";
import { summarizeMarket } from "../utils/marketSummary";
import { formatMarketDate, formatMarketPercent, formatMarketValue } from "../utils/formatMarket";
import { MARKET_PERIODS } from "../types/market";

function Profile() {
  const { user, setUser } = useAccount();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>, password = false) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = Object.fromEntries(new FormData(form));
    setBusy(true); setError(""); setMessage("");
    try {
      if (password) {
        await api<void>("/api/auth/password", { method: "POST", body: fields });
        form.reset(); setMessage("Senha alterada. As outras sessões foram encerradas.");
      } else {
        setUser(await api<User>("/api/auth/profile", { method: "PATCH", body: fields }));
        setMessage("Perfil atualizado.");
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível salvar."); }
    finally { setBusy(false); }
  }
  return <div className="account-grid"><section className="panel account-card"><h2>Dados do perfil</h2><p>{user?.email} · {user?.papel === "admin" ? "Administrador" : "Usuário"}</p><form className="account-form" onSubmit={(event) => void submit(event)}><div className="field"><label htmlFor="profile-name">Nome de exibição</label><input id="profile-name" name="nome" defaultValue={user?.nome} minLength={2} maxLength={80} required autoComplete="name" /></div><button className="action-button primary-action" disabled={busy}>Salvar perfil</button></form><p className="account-footnote">Conta criada em {user ? new Date(user.criado_em).toLocaleDateString("pt-BR") : "—"}.</p></section><section className="panel account-card"><h2>Alterar senha</h2><p>A nova senha deve ter entre 10 e 128 caracteres.</p><form className="account-form" onSubmit={(event) => void submit(event, true)}><div className="field"><label htmlFor="current-password">Senha atual</label><input id="current-password" name="senha_atual" type="password" required maxLength={128} autoComplete="current-password" /></div><div className="field"><label htmlFor="new-password">Nova senha</label><input id="new-password" name="nova_senha" type="password" minLength={10} maxLength={128} required autoComplete="new-password" /></div><button className="action-button" disabled={busy}>Atualizar senha</button></form></section>{message && <p className="form-success" role="status">{message}</p>}{error && <p className="form-error" role="alert">{error}</p>}</div>;
}

function Settings() {
  const { user, setUser } = useAccount();
  const { assets, loading, error: catalogError, reload } = useMarketAssets();
  const [prefs, setPrefs] = useState<Preferences>(user!.preferencias);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  function update<K extends keyof Preferences>(key: K, value: Preferences[K]) { setPrefs({ ...prefs, [key]: value }); setMessage(""); }
  async function save(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try { const account = await api<User>("/api/auth/preferences", { method: "PUT", body: prefs }); setUser(account); setMessage("Preferências salvas e aplicadas."); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível salvar."); }
    finally { setBusy(false); }
  }
  return <section className="panel account-card settings-card"><h2>Personalize suas ferramentas</h2><p>Escolhas iniciais para tendências, acompanhamento e atualização do panorama.</p>{catalogError && <p className="form-error" role="alert">{catalogError} <button type="button" className="action-button" onClick={reload}>Recarregar ativos</button></p>}<form className="account-form" onSubmit={save}><div className="settings-fields"><div className="field"><label htmlFor="settings-asset">Ativo inicial</label><select id="settings-asset" value={prefs.ativo} onChange={(e) => update("ativo", e.target.value)} disabled={loading || !assets.length}>{!assets.length && <option value={prefs.ativo}>{prefs.ativo}</option>}{assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.name}</option>)}</select></div><div className="field"><label htmlFor="settings-period">Histórico inicial</label><select id="settings-period" value={prefs.periodo} onChange={(e) => update("periodo", e.target.value as Preferences["periodo"])}>{MARKET_PERIODS.filter((p) => p.value !== "5d").map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}</select></div><div className="field"><label htmlFor="settings-horizon">Projeção inicial</label><select id="settings-horizon" value={prefs.horizonte} onChange={(e) => update("horizonte", Number(e.target.value))}>{[5, 10, 20].map((n) => <option key={n} value={n}>{n} observações futuras</option>)}</select></div><div className="field"><label htmlFor="settings-refresh">Atualizar panorama</label><select id="settings-refresh" value={prefs.atualizacao} onChange={(e) => update("atualizacao", Number(e.target.value))}><option value={0}>Manualmente</option><option value={60}>A cada 1 minuto</option><option value={300}>A cada 5 minutos</option></select></div></div><fieldset className="watchlist-picker"><legend>Ativos que acompanho</legend>{assets.map((asset) => <label key={asset.id}><input type="checkbox" checked={prefs.favoritos.includes(asset.id)} onChange={(e) => update("favoritos", e.target.checked ? [...prefs.favoritos, asset.id] : prefs.favoritos.filter((id) => id !== asset.id))} />{asset.name}<small>{asset.ticker}</small></label>)}</fieldset><p className="account-footnote">A atualização automática pausa com a aba oculta. Dados do Yahoo Finance podem ter atraso; consultar novamente não garante uma nova cotação.</p>{message && <p role="status" className="form-success">{message}</p>}{error && <p role="alert" className="form-error">{error}</p>}<button className="action-button primary-action" disabled={busy}>{busy ? "Salvando…" : "Salvar configurações"}</button></form></section>;
}

export default function AccountPage() {
  const { pathname } = useRoute();
  const { user } = useAccount();
  const { rows } = useMarketOverview();
  if (pathname === "/perfil") return <Profile />;
  if (pathname === "/configuracoes") return <Settings />;
  const favorites = rows.filter((row) => user!.preferencias.favoritos.includes(row.asset.id));
  return <div className="account-dashboard"><section className="panel account-welcome"><div><span className="eyebrow">MINHA ÁREA</span><h2>Olá, {user?.nome}.</h2><p>Seu acompanhamento e suas ferramentas em um só lugar.</p></div><AppLink href="/configuracoes" className="action-button">Configurar acompanhamento →</AppLink></section><div className="account-shortcuts"><AppLink className="panel account-card" href={`/tendencias?ativo=${user?.preferencias.ativo}`}><span className="eyebrow">ANÁLISE</span><h3>Explorar tendências ↗</h3><p>Médias móveis, estatísticas e cenários futuros.</p></AppLink><AppLink className="panel account-card" href="/perfil"><span className="eyebrow">PERFIL</span><h3>Meus dados ↗</h3><p>Nome, acesso e alteração de senha.</p></AppLink>{user?.papel === "admin" && <AppLink className="panel account-card" href="/admin"><span className="eyebrow">ADMINISTRAÇÃO</span><h3>Painel administrativo ↗</h3><p>Usuários, coleta e qualidade dos dados.</p></AppLink>}</div><section className="panel"><div className="panel-header"><h2>Meu acompanhamento</h2><span className="panel-meta">{favorites.length} ativos</span></div>{favorites.length ? <div className="watchlist-cards">{favorites.map((row) => { const summary = summarizeMarket(row.history); return <AppLink className="account-card" key={row.asset.id} href={`/tendencias?ativo=${row.asset.id}`}><span className="eyebrow">{row.asset.ticker}</span><h3>{row.asset.name}</h3><strong>{summary ? formatMarketValue(summary.last.close, row.asset.currency, row.asset.unit) : row.loading ? "Consultando…" : "Indisponível"}</strong><p>{summary ? `${summary.dayChange === null ? "—" : formatMarketPercent(summary.dayChange)} · ${formatMarketDate(summary.last.date)}` : "Abra a análise para consultar novamente."}</p><span className="text-link">Analisar tendência →</span></AppLink>; })}</div> : <div className="account-card empty-watchlist"><h3>Escolha seus primeiros ativos</h3><p>Salve favoritos nas configurações para acompanhar os últimos fechamentos por aqui.</p><AppLink className="action-button" href="/configuracoes">Escolher ativos</AppLink></div>}</section></div>;
}
