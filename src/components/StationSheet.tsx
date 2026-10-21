"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { statusOf, uid } from "@/lib/model";
import { useStore } from "@/lib/store";
import { CATEGORIES, type Category, type Station } from "@/lib/types";
import { BottomSheet } from "./BottomSheet";
import { StatusChip, input } from "./ui";

export function StationSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { stations, operators, update } = useStore();
  const st = stations.find((s) => s.id === id);
  if (!st) return null;

  const edit = (fn: (s: Station) => Station) => update((s) => ({ ...s, stations: s.stations.map((x) => (x.id === st.id ? fn(x) : x)) }));
  const people = operators
    .map((o) => ({ o, status: statusOf(o, st) }))
    .filter((x) => x.status)
    .sort((a, b) => a.o.name.localeCompare(b.o.name));

  return (
    <BottomSheet open onClose={onClose} validate="Valider" title={st.name || "Poste"}>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="mb-1 block text-sm font-semibold text-slate-500">Nom du poste</label>
          <input value={st.name} onChange={(e) => edit((s) => ({ ...s, name: e.target.value }))} className={input} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-500">Réf. standard</label>
          <input value={st.standard} onChange={(e) => edit((s) => ({ ...s, standard: e.target.value }))} placeholder="STD-01" className={input} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-500">Personnes au poste</label>
          <div className="flex items-center gap-2">
            <button aria-label="Moins" onClick={() => edit((s) => ({ ...s, needed: Math.max(0, s.needed - 1) }))} className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100">
              <Minus size={18} />
            </button>
            <span className="w-6 text-center text-lg font-bold">{st.needed}</span>
            <button aria-label="Plus" onClick={() => edit((s) => ({ ...s, needed: Math.min(9, s.needed + 1) }))} className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100">
              <Plus size={18} />
            </button>
          </div>
        </div>
      </div>

      <h3 className="mb-2 mt-5 text-sm font-bold uppercase tracking-wide text-slate-500">Points à contrôler</h3>
      <p className="mb-2 text-xs text-slate-500">Modifier un point demande de revalider les personnes qui ne l&apos;ont pas encore coché.</p>
      <ul className="space-y-2">
        {st.points.map((p) => (
          <li key={p.id} className="rounded-xl bg-slate-50 p-2">
            <div className="mb-1.5 flex items-center gap-2">
              <select
                value={p.category}
                onChange={(e) => edit((s) => ({ ...s, points: s.points.map((x) => (x.id === p.id ? { ...x, category: e.target.value as Category } : x)) }))}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm font-semibold"
              >
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <button
                aria-label="Supprimer le point"
                onClick={() => edit((s) => ({ ...s, points: s.points.filter((x) => x.id !== p.id) }))}
                className="ml-auto grid h-8 w-8 place-items-center rounded-lg text-red-600 active:bg-red-50"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <textarea
              value={p.label}
              rows={2}
              onChange={(e) => edit((s) => ({ ...s, points: s.points.map((x) => (x.id === p.id ? { ...x, label: e.target.value } : x)) }))}
              className={`${input} resize-none text-sm`}
            />
          </li>
        ))}
      </ul>
      <button
        onClick={() => edit((s) => ({ ...s, points: [...s.points, { id: uid(), category: "Sécurité", label: "" }] }))}
        className="mt-2 flex h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-teal-500 font-semibold text-teal-700"
      >
        <Plus size={18} /> Ajouter un point à contrôler
      </button>

      <h3 className="mb-2 mt-5 text-sm font-bold uppercase tracking-wide text-slate-500">Personnes sur ce poste</h3>
      <ul className="space-y-1.5">
        {people.map(({ o, status }) => (
          <li key={o.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold">
            {o.name}
            <StatusChip status={status!} />
          </li>
        ))}
        {people.length === 0 && <li className="text-sm text-slate-500">Personne pour le moment. Ajoutez ce poste depuis la fiche d&apos;un opérateur.</li>}
      </ul>

      <button
        onClick={() => {
          if (confirm(`Supprimer le poste ${st.name} et toutes ses habilitations ?`)) {
            update((s) => ({
              ...s,
              stations: s.stations.filter((x) => x.id !== st.id),
              operators: s.operators.map((o) => ({ ...o, quals: o.quals.filter((q) => q.stationId !== st.id) })),
            }));
            onClose();
          }
        }}
        className="mt-6 h-12 w-full rounded-xl border border-red-200 font-semibold text-red-600 active:bg-red-50"
      >
        Supprimer ce poste
      </button>
    </BottomSheet>
  );
}
