"use client";

import { AlertTriangle, CalendarClock, Search, UserPlus } from "lucide-react";
import { useState } from "react";
import { audits, dueSoon, fmtDate, statusOf, uid } from "@/lib/model";
import { useStore } from "@/lib/store";
import { DOT, input, norm } from "./ui";

export function Operators({ open }: { open: (id: string) => void }) {
  const { operators, stations, update } = useStore();
  const [q, setQ] = useState("");
  const [name, setName] = useState("");
  const list = operators.filter((o) => norm(o.name).includes(norm(q))).sort((a, b) => a.name.localeCompare(b.name));

  function add(e: React.FormEvent) {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    const id = uid();
    update((s) => ({ ...s, operators: [...s.operators, { id, name: n, quals: [], absent: false }] }));
    setName("");
    open(id);
  }

  const todo = audits(operators, stations);

  return (
    <div className="space-y-3">
      {todo.length > 0 && (
        <section className="rounded-2xl border border-orange-300 bg-orange-50 p-3">
          <h2 className="mb-2 flex items-center gap-2 font-black text-orange-800">
            <CalendarClock size={20} /> Audits d&apos;habilitation à prévoir
          </h2>
          <ul className="space-y-1.5">
            {todo.map(({ op, st, end, left }) => (
              <li key={op.id + st.id}>
                <button onClick={() => open(op.id)} className={`w-full rounded-xl bg-white px-3 py-2 text-left text-sm ${left < 0 ? "text-red-700" : "text-orange-900"}`}>
                  <strong>
                    {op.name}, {st.name} :
                  </strong>{" "}
                  {left < 0
                    ? `habilitation expirée depuis le ${fmtDate(end)}. Ne peut plus travailler sur ce poste avant un nouvel audit.`
                    : `vous pouvez commencer l'audit, l'habilitation ne sera plus valide le ${fmtDate(end)} (${left === 0 ? "aujourd'hui" : left === 1 ? "demain" : `dans ${left} jours`}).`}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un opérateur, ex : Marie" className={`${input} pl-10`} />
      </div>

      {list.map((o) => {
        const quals = o.quals
          .map((qu) => ({ qu, st: stations.find((s) => s.id === qu.stationId) }))
          .filter((x): x is { qu: typeof x.qu; st: NonNullable<typeof x.st> } => !!x.st);
        const unsigned = quals.filter(({ st }) => statusOf(o, st) === "unsigned").map(({ st }) => st.name);
        const expired = quals.filter(({ st }) => statusOf(o, st) === "expired").map(({ st }) => st.name);
        return (
          <button key={o.id} onClick={() => open(o.id)} className="block w-full rounded-2xl bg-white p-4 text-left shadow-sm active:bg-slate-50">
            <div className="flex items-center justify-between gap-2">
              <p className="text-base font-bold">{o.name}</p>
              {o.absent && <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-600">Absent</span>}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {quals.length === 0 && <span className="text-sm text-slate-400">Aucun poste pour le moment</span>}
              {quals.map(({ qu, st }) => {
                const status = statusOf(o, st)!;
                return (
                  <span key={st.id} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    <span className={`h-2 w-2 rounded-full ${status === "ok" && dueSoon(qu, st) ? "bg-orange-500" : DOT[status]}`} />
                    {st.name}
                  </span>
                );
              })}
            </div>
            {unsigned.length > 0 && (
              <p className="mt-2 flex items-start gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                Papier non signé : {unsigned.join(", ")}. Ne peut pas y travailler.
              </p>
            )}
            {expired.length > 0 && (
              <p className="mt-2 flex items-start gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                Audit dépassé : {expired.join(", ")}. Ne peut plus y travailler.
              </p>
            )}
          </button>
        );
      })}
      {list.length === 0 && <p className="py-6 text-center text-sm text-slate-500">Aucun opérateur trouvé.</p>}

      <form onSubmit={add} className="flex gap-2 rounded-2xl bg-white p-3 shadow-sm">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom du nouvel opérateur" className={input} />
        <button className="flex shrink-0 items-center gap-1.5 rounded-xl bg-teal-600 px-4 font-bold text-white disabled:opacity-40" disabled={!name.trim()}>
          <UserPlus size={18} /> Ajouter
        </button>
      </form>
    </div>
  );
}

