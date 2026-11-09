import { useEffect, useState } from "react";
import { api, type User } from "../services/accountService";
import MarketDataState from "../components/MarketDataState";

type Dashboard = {
  usuarios: Pick<User, "id" | "nome" | "email" | "papel" | "criado_em">[];
  total_usuarios: number; total_admins: number; ativos: number;
  coleta: { consultas_fonte: number; acertos_cache: number; falhas: number; registros_validos: number; registros_descartados: number; entradas_cache: number; ttl_segundos: number; escopo: string;
    eventos: { ativo: string; periodo: string; intervalo: string; em: string; status: string; registros: number; duracao_ms: number }[] };
};

export default function AdminPage() {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ attempt: number; data: Dashboard | null; error: string }>({ attempt: -1, data: null, error: "" });
  const [message, setMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    api<Dashboard>("/api/admin/dashboard").then((data) => { if (active) setResult({ attempt, data, error: "" }); }).catch((error) => { if (active) setResult({ attempt, data: null, error: error instanceof Error ? error.message : "Painel indisponível." }); });
    return () => { active = false; };
  }, [attempt]);
  async function clearCache() {
    setBusy(true); setActionError(""); setMessage("");
    try { await api<void>("/api/admin/cache/clear", { method: "POST" }); setMessage("Cache limpo. As próximas consultas buscarão a fonte novamente."); setAttempt((n) => n + 1); }
    catch (error) { setActionError(error instanceof Error ? error.message : "Não foi possível limpar o cache."); }
    finally { setBusy(false); }
  }
  const loading = result.attempt !== attempt;
  const data = !loading ? result.data : null;
  return <div className="admin-page"><div className="page-actions"><p className="source-note">Visão operacional · acesso validado pela API</p><button className="action-button" disabled={loading} onClick={() => setAttempt((n) => n + 1)}>Atualizar painel</button></div>{!data ? <section className="panel"><MarketDataState loading={loading} error={!loading ? result.error : ""} retry={() => setAttempt((n) => n + 1)} /></section> : <><div className="analysis-metrics">{[["Contas cadastradas", data.total_usuarios], ["Administradores", data.total_admins], ["Ativos disponíveis", data.ativos], ["Falhas na coleta", data.coleta.falhas]].map(([label, value]) => <div className="panel metric-card" key={label}><span className="eyebrow">{label}</span><strong>{value}</strong></div>)}</div><section className="panel"><div className="panel-header"><h2>Coleta e qualidade dos dados</h2><span className="panel-meta">Cache: {data.coleta.ttl_segundos}s</span></div><div className="admin-collection"><dl className="coverage-list">{[["Consultas à fonte", data.coleta.consultas_fonte], ["Consultas atendidas pelo cache", data.coleta.acertos_cache], ["Entradas válidas no cache", data.coleta.entradas_cache], ["Registros válidos coletados", data.coleta.registros_validos], ["Registros descartados ou duplicados", data.coleta.registros_descartados]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><div className="account-card"><h3>Atualização da fonte</h3><p>O cache reduz consultas repetidas e expira automaticamente. Limpe-o para que a próxima solicitação consulte a fonte.</p><button className="action-button" disabled={busy} onClick={() => void clearCache()}>{busy ? "Limpando…" : "Limpar cache da API"}</button><p className="account-footnote">{data.coleta.escopo}</p>{message && <p role="status" className="form-success">{message}</p>}{actionError && <p role="alert" className="form-error">{actionError}</p>}</div></div></section><section className="panel"><div className="panel-header"><h2>Usuários cadastrados</h2><span className="panel-meta">Perfis de acesso</span></div><div className="admin-table-scroll" role="region" aria-label="Usuários" tabIndex={0}><table><thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Cadastro</th></tr></thead><tbody>{data.usuarios.map((user) => <tr key={user.id}><td>{user.nome}</td><td>{user.email}</td><td><span className={`role-badge ${user.papel}`}>{user.papel === "admin" ? "Administrador" : "Usuário"}</span></td><td>{new Date(user.criado_em).toLocaleString("pt-BR")}</td></tr>)}</tbody></table></div></section><section className="panel"><div className="panel-header"><h2>Últimas coletas</h2><span className="panel-meta">Até 50 consultas à fonte</span></div>{data.coleta.eventos.length ? <div className="admin-table-scroll" role="region" aria-label="Histórico operacional de coletas" tabIndex={0}><table><thead><tr><th>Ativo</th><th>Consulta</th><th>Resultado</th><th>Registros</th><th>Duração</th><th>Horário</th></tr></thead><tbody>{data.coleta.eventos.map((event, i) => <tr key={`${event.em}:${i}`}><td>{event.ativo}</td><td>{event.periodo} / {event.intervalo}</td><td className={event.status === "ok" ? "positive" : "negative"}>{event.status === "ok" ? "Sucesso" : "Falha"}</td><td>{event.registros}</td><td>{event.duracao_ms} ms</td><td>{new Date(event.em).toLocaleString("pt-BR")}</td></tr>)}</tbody></table></div> : <p className="account-card muted">As consultas à fonte aparecerão aqui conforme o terminal for utilizado.</p>}</section></>}</div>;
}
