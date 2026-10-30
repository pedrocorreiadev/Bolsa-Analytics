import {
  isMarketInterval, isMarketPeriod,
  type MarketAsset, type MarketHistory, type MarketInterval, type MarketPeriod, type OHLCVPoint,
} from "../types/market.ts";

const API_BASE = (import.meta.env?.VITE_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
const CACHE_TTL = 60_000;
const cache = new Map<string, { expires: number; value: unknown }>();
const pending = new Map<string, Promise<unknown>>();

export class MarketApiError extends Error {
  status: number | null;
  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = "MarketApiError";
    this.status = status;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function fetchJSON(path: string): Promise<unknown> {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), 25_000);
  try {
    const response = await fetch(`${API_BASE}${path}`, { signal: controller.signal, headers: { Accept: "application/json" } });
    const data: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const detail = isRecord(data) && typeof data.detail === "string" ? data.detail : "A API não conseguiu atender à consulta.";
      throw new MarketApiError(detail, response.status);
    }
    if (data === null) throw new MarketApiError("A API devolveu uma resposta inválida.");
    return data;
  } catch (error) {
    if (error instanceof MarketApiError) throw error;
    if (controller.signal.aborted) throw new MarketApiError("A fonte demorou para responder. Tente novamente em alguns instantes.");
    throw new MarketApiError("Não foi possível acessar a API. Verifique se o backend está em execução.");
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

function cachedRequest<T>(key: string, load: () => Promise<T>, force = false): Promise<T> {
  const inFlight = pending.get(key);
  if (inFlight) return inFlight as Promise<T>;
  const stored = cache.get(key);
  if (!force && stored && stored.expires > Date.now()) return Promise.resolve(stored.value as T);
  const request = load().then((value) => {
    cache.set(key, { value, expires: Date.now() + CACHE_TTL });
    return value;
  }).finally(() => pending.delete(key));
  pending.set(key, request);
  return request;
}

export function validarAtivos(value: unknown): MarketAsset[] {
  if (!Array.isArray(value)) throw new MarketApiError("O catálogo de ativos recebido é inválido.");
  return value.map((asset): MarketAsset => {
    if (!isRecord(asset) || ![asset.id, asset.ticker, asset.name, asset.category, asset.currency].every((item) => typeof item === "string" && item.length > 0) || (asset.unit !== "currency" && asset.unit !== "points")) {
      throw new MarketApiError("O catálogo não contém os metadados necessários. Verifique a versão do backend.");
    }
    return {
      id: asset.id as string, ticker: asset.ticker as string, name: asset.name as string,
      category: asset.category as string, currency: asset.currency as string, unit: asset.unit,
      timezone: typeof asset.timezone === "string" ? asset.timezone : null,
    };
  });
}

function validDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validarHistorico(value: unknown): MarketHistory {
  if (!isRecord(value) || !Array.isArray(value.data) || typeof value.asset !== "string" || typeof value.ticker !== "string" || typeof value.period !== "string" || !isMarketPeriod(value.period) || typeof value.interval !== "string" || !isMarketInterval(value.interval) || typeof value.currency !== "string" || (value.unit !== "currency" && value.unit !== "points")) {
    throw new MarketApiError("O histórico recebido não possui OHLC e metadados compatíveis com o gráfico.");
  }
  const byDate = new Map<string, OHLCVPoint>();
  let discarded = 0;
  for (const row of value.data) {
    if (!isRecord(row) || !validDate(row.date) || ![row.open, row.high, row.low, row.close].every((price) => typeof price === "number" && Number.isFinite(price))) {
      discarded += 1;
      continue;
    }
    const open = row.open as number;
    const high = row.high as number;
    const low = row.low as number;
    const close = row.close as number;
    if (high < Math.max(open, close, low) || low > Math.min(open, close, high)) {
      discarded += 1;
      continue;
    }
    if (byDate.has(row.date)) discarded += 1;
    byDate.set(row.date, {
      date: row.date, open, high, low, close,
      volume: typeof row.volume === "number" && Number.isFinite(row.volume) && row.volume >= 0 ? row.volume : null,
    });
  }
  const data = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  if (value.data.length > 0 && data.length === 0) throw new MarketApiError("A fonte não devolveu registros OHLC válidos para este ativo.");
  return {
    asset: value.asset, ticker: value.ticker, period: value.period, interval: value.interval,
    currency: value.currency, unit: value.unit,
    timezone: typeof value.timezone === "string" ? value.timezone : null,
    source: typeof value.source === "string" ? value.source : "Fonte não informada",
    count: data.length, data, discarded,
  };
}

export const listarAtivos = (options: { force?: boolean } = {}): Promise<MarketAsset[]> =>
  cachedRequest("assets", async () => validarAtivos(await fetchJSON("/api/assets")), options.force);

export const buscarHistoricoMercado = (
  id: string, period: MarketPeriod, interval: MarketInterval,
  options: { force?: boolean } = {},
): Promise<MarketHistory> => {
  const params = new URLSearchParams({ period, interval });
  return cachedRequest(`history:${id}:${period}:${interval}`, async () => {
    const history = validarHistorico(await fetchJSON(`/api/assets/${encodeURIComponent(id)}/history?${params}`));
    if (history.asset !== id || history.period !== period || history.interval !== interval) {
      throw new MarketApiError("A fonte devolveu um histórico diferente da consulta solicitada.");
    }
    return history;
  }, options.force);
};
