"use client";

import { AlertTriangle, ChevronRight, Plus } from "lucide-react";
import { useState } from "react";
import { canWork, uid, validityOf } from "@/lib/model";
import { useStore } from "@/lib/store";
import { input } from "./ui";

export function Stations({ open }: { open: (id: string) => void }) {
  const { stations, operators, update } = useStore();
  const [name, setName] = useState("");

  function add(e: React.FormEvent) {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    const id = uid();
    update((s) => ({ ...s, stations: [...s.stations, { id, name: n, standard: "", needed: 1, points: [], validityMonths: 2 }] }));
    setName("");
    open(id);
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">Chaque poste reprend les points à contrôler de son standard de poste. Adaptez-les à votre entreprise.</p>
      {stations.map((s) => {
        const ok = operators.filter((o) => canWork(o, s)).length;
        const margin = ok - s.needed;
        return (
          <button key={s.id} onClick={() => open(s.id)} className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left shadow-sm active:bg-slate-50">
            <div className="min-w-0 flex-1">
              <p className="font-bold">{s.name}</p>
              <p className="text-xs text-slate-500">
                {s.standard && `${s.standard}, `}
                {s.points.length} points à contrôler, effectif {s.needed}, audit {validityOf(s) ? `tous les ${validityOf(s)} mois` : "sans échéance"}
              </p>
              <p className={`mt-1.5 text-sm font-semibold ${margin < 0 ? "text-red-600" : margin === 0 ? "text-amber-700" : "text-emerald-700"}`}>
                {ok} personne{ok > 1 ? "s" : ""} habilitée{ok > 1 ? "s" : ""}
              </p>
              {margin <= 0 && (
                <p className="mt-1 flex items-start gap-1.5 text-xs font-semibold text-amber-800">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  {margin < 0 ? "Pas assez de personnes habilitées pour tenir ce poste." : "Aucune marge : une seule absence et le poste n'est plus couvert."}
                </p>
              )}
            </div>
            <ChevronRight size={20} className="shrink-0 text-slate-400" />
          </button>
        );
      })}
      <form onSubmit={add} className="flex gap-2 rounded-2xl bg-white p-3 shadow-sm">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom du nouveau poste" className={input} />
        <button className="flex shrink-0 items-center gap-1.5 rounded-xl bg-teal-600 px-4 font-bold text-white disabled:opacity-40" disabled={!name.trim()}>
          <Plus size={18} /> Ajouter
        </button>
      </form>
    </div>
  );
}
