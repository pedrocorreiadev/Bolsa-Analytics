import { useCallback, useEffect, useState } from "react";
import { listarAtivos } from "../services/marketService";
import type { MarketAsset } from "../types/market";

export function useMarketAssets() {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ attempt: number; assets: MarketAsset[]; error: string }>({ attempt: -1, assets: [], error: "" });
  useEffect(() => {
    let active = true;
    listarAtivos({ force: attempt > 0 }).then((assets) => {
      if (active) setResult({ attempt, assets, error: "" });
    }).catch((error: unknown) => {
      if (active) setResult({ attempt, assets: [], error: error instanceof Error ? error.message : "Não foi possível carregar os ativos." });
    });
    return () => { active = false; };
  }, [attempt]);
  const reload = useCallback(() => setAttempt((value) => value + 1), []);
  const loading = result.attempt !== attempt;
  return { assets: loading ? [] : result.assets, loading, error: loading ? "" : result.error, reload };
}

export default useMarketAssets;
