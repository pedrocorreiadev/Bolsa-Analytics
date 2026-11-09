import type { MarketPeriod } from "../types/market";

const API_BASE = (import.meta.env?.VITE_API_BASE_URL || "/").replace(/\/$/, "");

export type Preferences = {
  ativo: string; periodo: MarketPeriod; horizonte: number; atualizacao: number; favoritos: string[];
};
export type User = {
  id: number; nome: string; email: string; papel: "usuario" | "admin"; criado_em: string; preferencias: Preferences;
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.status = status; }
}

export async function api<T>(path: string, options: { method?: string; body?: unknown; signal?: AbortSignal } = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? "GET", credentials: "include", signal: options.signal ?? AbortSignal.timeout(25_000),
    headers: { Accept: "application/json", "X-Bolsa-Client": "web", ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}) },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  }).catch(() => { throw new ApiError("Não foi possível acessar a API. Verifique a conexão e tente novamente.", 0); });
  if (response.status === 204) return undefined as T;
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = typeof data?.detail === "string" ? data.detail : Array.isArray(data?.detail) ? "Verifique os campos e os limites informados." : "Não foi possível concluir a solicitação.";
    if (response.status === 401 && !path.endsWith("/login") && !path.endsWith("/me")) window.dispatchEvent(new Event("bolsa:session-expired"));
    throw new ApiError(detail, response.status);
  }
  if (data === null) throw new ApiError("A API devolveu uma resposta inválida.", response.status);
  return data as T;
}
