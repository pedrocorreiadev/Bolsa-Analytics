import { useCallback, useRef, useState, type ReactNode } from "react";
import { buscarHistoricoMercado, listarAtivos } from "../services/marketService";
import { MarketOverviewContext, type MarketRow, type OverviewState } from "../context/MarketOverviewContext";

export function MarketOverviewProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OverviewState>({ status: "idle", rows: [], error: "" });
  const inFlight = useRef<Promise<void> | null>(null);
  const loaded = useRef(false);
  const load = useCallback((force = false): Promise<void> => {
    if (inFlight.current) return inFlight.current;
    if (!force && loaded.current) return Promise.resolve();
    const request = async () => {
      setState((current) => ({ ...current, status: "loading", error: "" }));
      try {
        const assets = await listarAtivos({ force });
        setState({ status: "loading", rows: assets.map((asset) => ({ asset, loading: true })), error: "" });
        await Promise.all(assets.map(async (asset) => {
          let row: MarketRow;
          try {
            row = { asset, history: await buscarHistoricoMercado(asset.id, "1mo", "1d", { force }), loading: false };
          } catch (error) {
            row = { asset, loading: false, error: error instanceof Error ? error.message : "Histórico indisponível." };
          }
          setState((current) => ({ ...current, rows: current.rows.map((item) => item.asset.id === asset.id ? row : item) }));
        }));
        loaded.current = true;
        setState((current) => ({ ...current, status: "ready" }));
      } catch (error) {
        loaded.current = true;
        setState({ status: "ready", rows: [], error: error instanceof Error ? error.message : "Não foi possível acessar os ativos." });
      }
    };
    inFlight.current = request().finally(() => { inFlight.current = null; });
    return inFlight.current;
  }, []);
  return <MarketOverviewContext.Provider value={{ ...state, load }}>{children}</MarketOverviewContext.Provider>;
}
