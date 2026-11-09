import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AccountContext } from "../context/AccountContext";
import { api, ApiError, type User } from "../services/accountService";

export function AccountProvider({ children }: { children: ReactNode }) {
  const [user, storeUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const version = useRef(0);
  const setUser = useCallback((account: User | null) => {
    version.current += 1;
    storeUser(account); setError(""); setLoading(false);
  }, []);
  const loadSession = useCallback(() => {
    const requestVersion = ++version.current;
    return api<User>("/api/auth/me").then((account) => {
      if (requestVersion === version.current) { storeUser(account); setError(""); }
    }).catch((cause: unknown) => {
      if (requestVersion !== version.current) return;
      storeUser(null);
      if (!(cause instanceof ApiError && cause.status === 401)) setError(cause instanceof Error ? cause.message : "Não foi possível verificar sua sessão.");
      else setError("");
    }).finally(() => { if (requestVersion === version.current) setLoading(false); });
  }, []);
  const refresh = useCallback(async () => { setLoading(true); setError(""); await loadSession(); }, [loadSession]);
  useEffect(() => {
    void loadSession();
    const expire = () => setUser(null);
    window.addEventListener("bolsa:session-expired", expire);
    return () => window.removeEventListener("bolsa:session-expired", expire);
  }, [loadSession, setUser]);
  const logout = async () => { await api<void>("/api/auth/logout", { method: "POST" }); setUser(null); };
  return <AccountContext.Provider value={{ user, loading, error, setUser, refresh, logout }}>{children}</AccountContext.Provider>;
}
