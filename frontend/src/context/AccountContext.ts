import { createContext } from "react";
import type { User } from "../services/accountService";

export type Account = { user: User | null; loading: boolean; error: string; setUser: (user: User | null) => void; refresh: () => Promise<void>; logout: () => Promise<void> };
export const AccountContext = createContext<Account | null>(null);
