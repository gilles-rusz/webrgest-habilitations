"use client";

import { AlertTriangle, CheckCircle2, Printer, RotateCcw, UserX } from "lucide-react";
import { useMemo } from "react";
import { statusOf } from "@/lib/model";
import { buildPlanning } from "@/lib/planning";
import { useStore } from "@/lib/store";

export function Planning() {
  const { stations, operators, settings, update } = useStore();
  const slots = useMemo(() => buildPlanning(stations, operators, settings), [stations, operators, settings]);
  const gaps = slots.flatMap((s, i) => s.gaps.map((g) => ({ ...g, slot: i, label: s.label })));
  const ops = [...operators].sort((a, b) => a.name.localeCompare(b.name));
  const name = (id: string) => stations.find((s) => s.id === id)?.name ?? "";
  const unsigned = operators
    .filter((o) => !o.absent)
    .flatMap((o) => stations.filter((s) => statusOf(o, s) === "unsigned").map((s) => `${o.name} (${s.name})`));
  const set = (patch: Partial<typeof settings>) => update((s) => ({ ...s, settings: { ...s.settings, ...patch } }));

  return (
    <div className="space-y-3">
      <section className="rounded-2xl bg-white p-4 shadow-sm print:hidden">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-bold">Présents aujourd&apos;hui</h2>
          <button onClick={() => update((s) => ({ ...s, operators: s.operators.map((o) => ({ ...o, absent: false })) }))} className="flex items-center gap-1 text-sm font-semibold text-teal-700">
            <RotateCcw size={14} /> Tout le monde présent
          </button>
        </div>
        <p className="mb-2 text-xs text-slate-500">Touchez un nom pour le passer absent : le planning se recalcule tout seul.</p>
        <div className="flex flex-wrap gap-2">
          {ops.map((o) => (
            <button
              key={o.id}
              onClick={() => update((s) => ({ ...s, operators: s.operators.map((x) => (x.id === o.id ? { ...x, absent: !x.absent } : x)) }))}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold ${o.absent ? "border-slate-300 bg-slate-100 text-slate-400 line-through" : "border-teal-200 bg-teal-50 text-teal-800"}`}
            >
              {o.absent && <UserX size={14} />}
              {o.name}
            </button>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
          <label className="font-semibold text-slate-500">
            Début
            <input type="time" value={settings.shiftStart} onChange={(e) => set({ shiftStart: e.target.value || "06:00" })} className="mt-1 w-full rounded-xl border border-slate-300 px-2 py-2 text-base text-slate-900" />
          </label>
          <label className="font-semibold text-slate-500">
            Durée (h)
            <input type="number" min={1} max={12} value={settings.shiftHours} onChange={(e) => set({ shiftHours: Math.min(12, Math.max(1, Number(e.target.value) || 8)) })} className="mt-1 w-full rounded-xl border border-slate-300 px-2 py-2 text-base text-slate-900" />
          </label>
          <label className="font-semibold text-slate-500">
            Rotations
            <select value={settings.rotations} onChange={(e) => set({ rotations: Number(e.target.value) })} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-2 py-2 text-base text-slate-900">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {gaps.length > 0 ? (
        <section className="rounded-2xl border-2 border-red-300 bg-red-50 p-4">
          <h2 className="flex items-center gap-2 font-black text-red-700">
            <AlertTriangle size={20} /> Attention, {new Set(gaps.map((g) => g.stationId)).size === 1 ? "un poste n'est pas couvert" : "des postes ne sont pas couverts"}
          </h2>
          <ul className="mt-2 space-y-1.5 text-sm text-red-800">
            {gaps.map((g) => (
              <li key={`${g.slot}-${g.stationId}`}>
                <strong>
                  {g.label}, {name(g.stationId)} :
                </strong>{" "}
                {`on ne peut mettre personne (${g.reason}).`}
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-4 font-bold text-emerald-800">
          <CheckCircle2 size={20} /> Tous les postes sont couverts, avec des personnes habilitées et signées.
        </p>
      )}

      {unsigned.length > 0 && (
        <p className="flex items-start gap-2 rounded-2xl bg-amber-50 p-3 text-sm text-amber-900">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>
            <strong>Pas planifiés car papier non signé :</strong> {unsigned.join(", ")}.
          </span>
        </p>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {slots.map((slot, i) => (
          <section key={i} className="break-inside-avoid rounded-2xl bg-white p-4 shadow-sm">
            <h3 className="mb-2 flex items-baseline justify-between font-black">
              Rotation {i + 1}
              <span className="text-sm font-semibold text-slate-500">{slot.label}</span>
            </h3>
            <ul className="divide-y divide-slate-100">
              {stations
                .filter((s) => s.needed > 0)
                .map((s) => {
                  const names = slot.seats[s.id] ?? [];
                  const missing = s.needed - names.length;
                  return (
                    <li key={s.id} className="flex items-start justify-between gap-3 py-2 text-sm">
                      <span className="text-slate-600">{s.name}</span>
                      <span className="text-right font-bold">
                        {names.join(", ")}
                        {missing > 0 && (
                          <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-xs text-white">
                            <AlertTriangle size={12} /> {missing > 1 ? `${missing} manquants` : "Personne"}
                          </span>
                        )}
                      </span>
                    </li>
                  );
                })}
            </ul>
            {slot.spare.length > 0 && <p className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">En renfort : {slot.spare.join(", ")}</p>}
          </section>
        ))}
      </div>

      <button onClick={() => window.print()} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white font-semibold shadow-sm print:hidden">
        <Printer size={18} /> Imprimer le planning
      </button>
    </div>
  );
}
