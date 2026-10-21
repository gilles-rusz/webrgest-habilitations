"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { demoState } from "./demo";
import type { State } from "./types";

type Store = State & { ready: boolean; update: (fn: (s: State) => State) => void; resetDemo: () => void; clearAll: () => void };

const KEY = "webrgest-habilitations:v1";
const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(demoState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState(JSON.parse(raw) as State);
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(state));
  }, [state, ready]);

  const update = useCallback((fn: (s: State) => State) => setState(fn), []);
  const resetDemo = useCallback(() => setState(demoState()), []);
  const clearAll = useCallback(() => setState((s) => ({ settings: s.settings, stations: [], operators: [] })), []);

  const value = useMemo(() => ({ ...state, ready, update, resetDemo, clearAll }), [state, ready, update, resetDemo, clearAll]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore doit être utilisé dans StoreProvider");
  return ctx;
}

export function useActions() {
  const { update } = useStore();
  return useMemo(() => {
    const ops = (fn: (o: State["operators"][number]) => State["operators"][number], id: string) =>
      update((s) => ({ ...s, operators: s.operators.map((o) => (o.id === id ? fn(o) : o)) }));
    return { update, ops };
  }, [update]);
}
