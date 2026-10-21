"use client";

import { AlertTriangle, Check, ChevronDown, ClipboardCheck, FileSignature, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { daysLeft, dueSoon, expiryOf, fmtDate, newQual, progress, qualStatus, today, validityOf } from "@/lib/model";
import { useStore } from "@/lib/store";
import { CATEGORY_STYLE, type Operator, type Qualification } from "@/lib/types";
import { BottomSheet } from "./BottomSheet";
import { StatusChip, input } from "./ui";

export function OperatorSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { operators, stations, update } = useStore();
  const op = operators.find((o) => o.id === id);
  const [openSt, setOpenSt] = useState<string | null>(null);
  const [adding, setAdding] = useState("");

  if (!op) return null;

  const edit = (fn: (o: Operator) => Operator) => update((s) => ({ ...s, operators: s.operators.map((o) => (o.id === op.id ? fn(o) : o)) }));
  const editQual = (stationId: string, fn: (q: Qualification) => Qualification) =>
    edit((o) => ({ ...o, quals: o.quals.map((q) => (q.stationId === stationId ? fn(q) : q)) }));
  const free = stations.filter((s) => !op.quals.some((q) => q.stationId === s.id));

  return (
    <BottomSheet open onClose={onClose} validate="Valider" title={op.name || "Opérateur"}>
      <label className="mb-1 block text-sm font-semibold text-slate-500" htmlFor="opname">
        Nom
      </label>
      <input id="opname" value={op.name} onChange={(e) => edit((o) => ({ ...o, name: e.target.value }))} className={`${input} mb-3`} />
      <label className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
        <input type="checkbox" checked={op.absent} onChange={(e) => edit((o) => ({ ...o, absent: e.target.checked }))} className="h-5 w-5 accent-teal-600" />
        Absent aujourd&apos;hui (retiré du planning)
      </label>

      <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">Postes et habilitations</h3>
      <div className="space-y-2">
        {op.quals.map((q) => {
          const st = stations.find((s) => s.id === q.stationId);
          if (!st) return null;
          const status = qualStatus(q, st);
          const done = progress(q, st);
          const isOpen = openSt === st.id;
          const end = expiryOf(q, st);
          const left = daysLeft(q, st);
          const soon = dueSoon(q, st);
          const renew = () => editQual(st.id, (x) => ({ ...x, signed: true, signedAt: today(), validatedAt: today() }));
          return (
            <div key={st.id} className={`rounded-2xl border ${status === "unsigned" || status === "expired" ? "border-red-300" : soon ? "border-orange-300" : "border-slate-200"}`}>
              <button onClick={() => setOpenSt(isOpen ? null : st.id)} className="flex w-full items-center gap-3 p-3 text-left">
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{st.name}</p>
                  <p className="text-xs text-slate-500">
                    {st.standard && `${st.standard}, `}
                    {done}/{st.points.length} points validés
                  </p>
                </div>
                <StatusChip status={status} />
                <ChevronDown size={18} className={`shrink-0 text-slate-400 transition ${isOpen ? "rotate-180" : ""}`} />
              </button>

              {status === "unsigned" && !isOpen && (
                <p className="mx-3 mb-3 flex items-start gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" /> Papier non signé : ne peut pas travailler sur ce poste.
                </p>
              )}
              {status === "expired" && !isOpen && (
                <p className="mx-3 mb-3 flex items-start gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" /> Habilitation expirée le {fmtDate(end)} : nouvel audit nécessaire.
                </p>
              )}
              {soon && !isOpen && (
                <p className="mx-3 mb-3 flex items-start gap-1.5 rounded-xl bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-800">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" /> Audit à refaire avant le {fmtDate(end)}.
                </p>
              )}

              {isOpen && (
                <div className="space-y-3 border-t border-slate-100 p-3">
                  <ul className="space-y-1.5">
                    {st.points.map((p) => {
                      const on = q.checked.includes(p.id);
                      return (
                        <li key={p.id}>
                          <button
                            onClick={() =>
                              editQual(st.id, (x) => {
                                const checked = on ? x.checked.filter((c) => c !== p.id) : [...x.checked, p.id];
                                const complete = st.points.every((pt) => checked.includes(pt.id));
                                return {
                                  ...x,
                                  checked,
                                  validatedAt: complete ? x.validatedAt ?? today() : null,
                                  signed: complete && x.signed,
                                  signedAt: complete ? x.signedAt : null,
                                };
                              })
                            }
                            className={`flex w-full items-start gap-3 rounded-xl p-2.5 text-left ${on ? "bg-emerald-50" : "bg-slate-50"}`}
                          >
                            <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md border-2 ${on ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300 bg-white"}`}>
                              {on && <Check size={16} strokeWidth={3} />}
                            </span>
                            <span className="min-w-0 flex-1 text-sm">
                              <span className={`mr-1.5 inline-block rounded px-1.5 text-[11px] font-bold ${CATEGORY_STYLE[p.category]}`}>{p.category}</span>
                              {p.label}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                    {st.points.length === 0 && <li className="text-sm text-slate-500">Aucun point à contrôler sur ce poste. Ajoutez-les dans l&apos;onglet Postes.</li>}
                  </ul>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-500">Validé par (responsable)</label>
                    <input value={q.validatedBy} onChange={(e) => editQual(st.id, (x) => ({ ...x, validatedBy: e.target.value }))} placeholder="Nom du responsable" className={input} />
                  </div>

                  {status === "training" && (
                    <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
                      Formation en cours : il reste {st.points.length - done} point{st.points.length - done > 1 ? "s" : ""} à valider avant la signature.
                    </p>
                  )}
                  {status === "unsigned" && (
                    <div className="rounded-xl border border-red-300 bg-red-50 p-3">
                      <p className="flex items-start gap-1.5 text-sm font-bold text-red-700">
                        <AlertTriangle size={18} className="shrink-0" />
                        {`Attention : ${op.name} n'a pas signé l'habilitation. Il ou elle n'est pas en mesure de travailler sur ce poste.`}
                      </p>
                      <button
                        onClick={() => editQual(st.id, (x) => ({ ...x, signed: true, signedAt: today() }))}
                        className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-600 font-bold text-white active:bg-red-700"
                      >
                        <FileSignature size={20} /> Papier signé
                      </button>
                    </div>
                  )}
                  {status === "expired" && (
                    <div className="rounded-xl border border-red-300 bg-red-50 p-3">
                      <p className="flex items-start gap-1.5 text-sm font-bold text-red-700">
                        <AlertTriangle size={18} className="shrink-0" />
                        {`Habilitation expirée le ${fmtDate(end)} (audit tous les ${validityOf(st)} mois). ${op.name} ne peut plus travailler sur ce poste avant un nouvel audit.`}
                      </p>
                      <button onClick={renew} className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-600 font-bold text-white active:bg-red-700">
                        <ClipboardCheck size={20} /> Audit refait, papier signé
                      </button>
                    </div>
                  )}
                  {status === "ok" && soon && (
                    <div className="rounded-xl border border-orange-300 bg-orange-50 p-3">
                      <p className="text-sm font-bold text-orange-800">
                        {`Audit à prévoir : l'habilitation ne sera plus valide le ${fmtDate(end)} (${left === 0 ? "aujourd'hui" : left === 1 ? "demain" : `dans ${left} jours`}).`}
                      </p>
                      <button onClick={renew} className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 font-bold text-white active:bg-orange-600">
                        <ClipboardCheck size={20} /> Audit refait, papier signé
                      </button>
                    </div>
                  )}
                  {status === "ok" && (
                    <div className="flex items-center justify-between gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
                      <span>
                        Habilitation signée le {fmtDate(q.signedAt)}
                        {q.validatedBy && `, validée par ${q.validatedBy}`}
                        {end && `. Valable jusqu'au ${fmtDate(end)}`}
                      </span>
                      <button onClick={() => editQual(st.id, (x) => ({ ...x, signed: false, signedAt: null }))} className="shrink-0 text-xs font-bold text-emerald-700 underline">
                        Annuler
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => confirm(`Retirer le poste ${st.name} pour ${op.name} ?`) && edit((o) => ({ ...o, quals: o.quals.filter((x) => x.stationId !== st.id) }))}
                    className="flex items-center gap-1.5 text-sm font-semibold text-red-600"
                  >
                    <Trash2 size={16} /> Retirer ce poste
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {op.quals.length === 0 && <p className="text-sm text-slate-500">Ajoutez les postes sur lesquels cette personne est formée ou en formation.</p>}
      </div>

      {free.length > 0 && (
        <div className="mt-3 flex gap-2">
          <select value={adding} onChange={(e) => setAdding(e.target.value)} className={input}>
            <option value="">Ajouter un poste...</option>
            {free.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <button
            disabled={!adding}
            onClick={() => {
              edit((o) => ({ ...o, quals: [...o.quals, newQual(adding)] }));
              setOpenSt(adding);
              setAdding("");
            }}
            className="grid w-12 shrink-0 place-items-center rounded-xl bg-teal-600 text-white disabled:opacity-40"
            aria-label="Ajouter le poste"
          >
            <Plus size={22} />
          </button>
        </div>
      )}

      <button
        onClick={() => {
          if (confirm(`Supprimer ${op.name} ?`)) {
            update((s) => ({ ...s, operators: s.operators.filter((o) => o.id !== op.id) }));
            onClose();
          }
        }}
        className="mt-6 h-12 w-full rounded-xl border border-red-200 font-semibold text-red-600 active:bg-red-50"
      >
        Supprimer cet opérateur
      </button>
    </BottomSheet>
  );
}
