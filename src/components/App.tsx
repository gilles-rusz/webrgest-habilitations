"use client";

import { CalendarClock, ClipboardList, Grid3x3, LogOut, Menu, Users } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { alertCount } from "@/lib/model";
import { buildPlanning } from "@/lib/planning";
import { useStore } from "@/lib/store";
import { BottomSheet } from "./BottomSheet";
import { Login } from "./Login";
import { Matrix } from "./Matrix";
import { OperatorSheet } from "./OperatorSheet";
import { Operators } from "./Operators";
import { Planning } from "./Planning";
import { StationSheet } from "./StationSheet";
import { Stations } from "./Stations";

export type Session = { name: string; exp: number };

const TABS = [
  { id: "ops", label: "Opérateurs", icon: Users },
  { id: "stations", label: "Postes", icon: ClipboardList },
  { id: "matrix", label: "Matrice", icon: Grid3x3 },
  { id: "planning", label: "Planning", icon: CalendarClock },
] as const;

type Tab = (typeof TABS)[number]["id"];

export function App() {
  const [auth, setAuth] = useState<"loading" | "open" | "login" | Session>("loading");

  useEffect(() => {
    fetch("/api/session")
      .then((r) => r.json())
      .then((d) => setAuth(!d.required ? "open" : d.session ?? "login"))
      .catch(() => setAuth("login"));
  }, []);

  if (auth === "loading") return <div className="min-h-dvh bg-[#141729]" />;
  if (auth === "login") return <Login expired={false} onLogin={setAuth} />;
  return (
    <Workspace
      session={auth === "open" ? null : auth}
      onLogout={async () => {
        await fetch("/api/session", { method: "DELETE" });
        setAuth("login");
      }}
    />
  );
}

function Workspace({ session, onLogout }: { session: Session | null; onLogout: () => void }) {
  const store = useStore();
  const [tab, setTab] = useState<Tab>("ops");
  const [op, setOp] = useState<string | null>(null);
  const [st, setSt] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  const unsigned = alertCount(store.operators, store.stations);
  const gaps = useMemo(
    () => buildPlanning(store.stations, store.operators, store.settings).reduce((n, s) => n + s.gaps.length, 0),
    [store.stations, store.operators, store.settings],
  );
  const badge: Partial<Record<Tab, number>> = { ops: unsigned, planning: gaps };

  if (!store.ready) return <div className="min-h-dvh bg-slate-100" />;

  return (
    <div className="min-h-dvh bg-slate-100 pb-[calc(5.5rem+env(safe-area-inset-bottom))] text-slate-900 print:bg-white print:pb-0">
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between bg-[#141729] px-4 text-white print:hidden">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-teal-300/20 bg-[#141729] shadow-[0_0_20px_rgba(45,212,191,0.15)]">
            <Image src="/globe.png" alt="" width={36} height={36} priority />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-black leading-tight tracking-wide">
              WEB RG EST <span className="font-semibold italic tracking-normal text-[#E8B84B]">/ Habilitations</span>
            </p>
            <p className="truncate text-xs text-slate-400">{store.settings.site || "Mon site"}</p>
          </div>
        </div>
        <button onClick={() => setMenu(true)} aria-label="Réglages" className="grid h-10 w-10 place-items-center rounded-full active:bg-white/10">
          <Menu size={22} />
        </button>
      </header>

      <main className="mx-auto max-w-5xl px-4 pt-3">
        <h1 className="mb-3 hidden text-xl font-black print:block">
          Planning de rotation, {store.settings.site}, {new Date().toLocaleDateString("fr-FR")}
        </h1>
        {tab === "ops" && <Operators open={setOp} />}
        {tab === "stations" && <Stations open={setSt} />}
        {tab === "matrix" && <Matrix open={setOp} />}
        {tab === "planning" && <Planning />}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] print:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-4">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`relative flex h-16 flex-col items-center justify-center gap-1 text-xs font-bold ${tab === id ? "text-teal-600" : "text-slate-500"}`}
            >
              <Icon size={24} strokeWidth={tab === id ? 2.5 : 2} />
              {label}
              {!!badge[id] && (
                <span className="absolute right-[calc(50%-24px)] top-2 grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[10px] text-white">{badge[id]}</span>
              )}
            </button>
          ))}
        </div>
      </nav>

      <OperatorSheet key={op ?? "none"} id={op} onClose={() => setOp(null)} />
      <StationSheet id={st} onClose={() => setSt(null)} />

      <BottomSheet open={menu} onClose={() => setMenu(false)} title="Réglages">
        <label className="mb-2 block text-sm font-semibold text-slate-500" htmlFor="site">
          Nom du site ou de l&apos;équipe
        </label>
        <input
          id="site"
          value={store.settings.site}
          onChange={(e) => store.update((s) => ({ ...s, settings: { ...s.settings, site: e.target.value } }))}
          className="mb-5 w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-teal-600"
        />
        <div className="space-y-2">
          <button
            onClick={() => {
              store.resetDemo();
              setMenu(false);
            }}
            className="h-12 w-full rounded-xl bg-slate-100 font-semibold active:bg-slate-200"
          >
            Recharger les données de démonstration
          </button>
          <button
            onClick={() => {
              if (confirm("Effacer tous les postes et tous les opérateurs ?")) {
                store.clearAll();
                setMenu(false);
              }
            }}
            className="h-12 w-full rounded-xl border border-red-200 font-semibold text-red-600 active:bg-red-50"
          >
            Tout effacer et partir de zéro
          </button>
          {session && (
            <button onClick={onLogout} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-100 font-semibold active:bg-slate-200">
              <LogOut size={18} /> Se déconnecter
            </button>
          )}
        </div>
        <p className="mt-4 text-xs text-slate-400">
          {session && `Accès ${session.name} jusqu'au ${new Date(session.exp).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}. `}
          Démo : les données restent sur cet appareil.
        </p>
      </BottomSheet>
    </div>
  );
}
