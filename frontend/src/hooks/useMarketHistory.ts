import { useCallback, useEffect, useRef, useState } from "react";
import { buscarHistoricoMercado, MarketApiError } from "../services/marketService";
import type { MarketHistory, MarketInterval, MarketPeriod } from "../types/market";

export function useMarketHistory(id: string | null, period: MarketPeriod, interval: MarketInterval) {
  const [attempt, setAttempt] = useState(0);
  const forceKey = useRef<string | null>(null);
  const key = id === null ? "" : `${id}:${period}:${interval}:${attempt}`;
  const [result, setResult] = useState<{ key: string; history: MarketHistory | null; error: string; errorStatus: number | null }>({ key: "", history: null, error: "", errorStatus: null });

  useEffect(() => {
    if (id === null) return;
    let active = true;
    const force = forceKey.current === `${id}:${period}:${interval}`;
    forceKey.current = null;
    buscarHistoricoMercado(id, period, interval, { force }).then((history) => {
      if (active) setResult({ key, history, error: "", errorStatus: null });
    }).catch((error: unknown) => {
      if (active) setResult({ key, history: null, error: error instanceof Error ? error.message : "Não foi possível carregar o histórico.", errorStatus: error instanceof MarketApiError ? error.status : null });
    });
    return () => { active = false; };
  }, [id, period, interval, key]);

  const reload = useCallback(() => {
    forceKey.current = `${id}:${period}:${interval}`;
    setAttempt((value) => value + 1);
  }, [id, period, interval]);
  const current = id !== null && result.key === key;
  return {
    history: current ? result.history : null,
    loading: id !== null && !current,
    error: current ? result.error : "",
    errorStatus: current ? result.errorStatus : null,
    reload,
  };
}

export default useMarketHistory;
