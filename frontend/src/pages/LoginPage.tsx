import { useState, type FormEvent } from "react";
import { useAccount } from "../hooks/useAccount";
import { api, type User } from "../services/accountService";
import { AppLink, navigate, useRoute } from "../router";

export default function LoginPage() {
  const { user, setUser } = useAccount();
  const { search } = useRoute();
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    setBusy(true); setError("");
    try {
      const account = await api<User>(`/api/auth/${register ? "register" : "login"}`, { method: "POST", body: {
        email: fields.get("email"), senha: fields.get("senha"), ...(register ? { nome: fields.get("nome") } : {}),
      } });
      setUser(account);
      const target = new URLSearchParams(search).get("destino");
      navigate(target && /^\/(conta|perfil|configuracoes|admin)(\?|$)/.test(target) ? target : "/conta", { replace: true });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível entrar."); }
    finally { setBusy(false); }
  }
  if (user) return <section className="panel account-card"><h2>Sessão iniciada</h2><p>Você entrou como {user.nome}.</p><AppLink href="/conta" className="action-button">Abrir minha área →</AppLink></section>;
  return <div className="login-layout">
    <section className="login-intro"><span className="eyebrow">SEU ESPAÇO DE ANÁLISE</span><h2>Contexto para<br /><span>cada movimento.</span></h2><p>Reúna os ativos que acompanha, personalize as consultas e explore tendências com estatística explicável.</p><div className="login-features"><span>01 / Acompanhamento pessoal</span><span>02 / Tendências e projeções</span><span>03 / Preferências salvas</span></div><p className="muted">Dados de mercado continuam disponíveis no terminal sem login.</p></section>
    <section className="panel account-card login-form"><div className="account-tabs"><button type="button" className={!register ? "selected" : ""} onClick={() => { setRegister(false); setError(""); }}>Entrar</button><button type="button" className={register ? "selected" : ""} onClick={() => { setRegister(true); setError(""); }}>Criar conta</button></div><h2>{register ? "Crie seu acesso" : "Acesse sua conta"}</h2><p>{register ? "Seu perfil e suas preferências ficam salvos." : "Continue acompanhando o mercado."}</p><form onSubmit={submit} className="account-form">
      {register && <div className="field"><label htmlFor="auth-name">Nome</label><input id="auth-name" name="nome" autoComplete="name" minLength={2} maxLength={80} required /></div>}
      <div className="field"><label htmlFor="auth-email">E-mail</label><input id="auth-email" name="email" type="email" autoComplete="email" maxLength={254} required /></div>
      <div className="field"><label htmlFor="auth-password">Senha{register ? " · mínimo de 10 caracteres" : ""}</label><div className="password-field"><input id="auth-password" name="senha" type={showPassword ? "text" : "password"} autoComplete={register ? "new-password" : "current-password"} minLength={register ? 10 : 1} maxLength={128} required /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-pressed={showPassword}>{showPassword ? "Ocultar" : "Mostrar"}</button></div></div>
      {error && <p role="alert" className="form-error">{error}</p>}<button className="action-button primary-action" disabled={busy}>{busy ? "Aguarde…" : register ? "Criar conta e entrar →" : "Entrar no terminal →"}</button>
    </form><p className="account-footnote">O acesso administrativo depende do perfil atribuído no servidor.</p></section>
  </div>;
}
