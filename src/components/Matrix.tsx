"use client";

import { Lightbulb } from "lucide-react";
import { canWork, findQual, progress, qualStatus } from "@/lib/model";
import { useStore } from "@/lib/store";
import { CHIP } from "./ui";

export function Matrix({ open }: { open: (id: string) => void }) {
  const { stations, operators } = useStore();
  const ops = [...operators].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="w-full min-w-max border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-white p-2 text-left text-xs font-bold uppercase text-slate-500">Opérateur</th>
              {stations.map((s) => (
                <th key={s.id} className="max-w-24 p-2 text-center text-xs font-bold leading-tight text-slate-700">
                  {s.name}
                </th>
              ))}
              <th className="p-2 text-center text-xs font-bold uppercase text-slate-500">Postes</th>
            </tr>
          </thead>
          <tbody>
            {ops.map((o) => (
              <tr key={o.id} className="border-t border-slate-100">
                <th className="sticky left-0 z-10 bg-white p-2 text-left font-semibold">
                  <button onClick={() => open(o.id)} className="text-left underline-offset-2 hover:underline">
                    {o.name}
                  </button>
                </th>
                {stations.map((s) => {
                  const q = findQual(o, s.id);
                  if (!q) return <td key={s.id} className="p-1" />;
                  const status = qualStatus(q, s);
                  return (
                    <td key={s.id} className="p-1 text-center">
                      <button onClick={() => open(o.id)} className={`h-9 w-full min-w-14 rounded-lg border text-xs font-black ${CHIP[status]}`}>
                        {status === "ok" ? "✓" : status === "unsigned" ? "À signer" : `${progress(q, s)}/${s.points.length}`}
                      </button>
                    </td>
                  );
                })}
                <td className="p-2 text-center font-bold">{stations.filter((s) => canWork(o, s)).length}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-200">
              <th className="sticky left-0 z-10 bg-white p-2 text-left text-xs font-bold uppercase text-slate-500">Habilités</th>
              {stations.map((s) => {
                const n = operators.filter((o) => canWork(o, s)).length;
                const margin = n - s.needed;
                return (
                  <td key={s.id} className={`p-2 text-center font-black ${margin < 0 ? "text-red-600" : margin === 0 ? "text-amber-600" : "text-emerald-700"}`}>
                    {n}/{s.needed}
                  </td>
                );
              })}
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex flex-wrap gap-3 text-xs font-semibold text-slate-600">
        <span className={`rounded-lg border px-2 py-1 ${CHIP.ok}`}>✓ Habilité et signé</span>
        <span className={`rounded-lg border px-2 py-1 ${CHIP.unsigned}`}>À signer : formé, papier non signé</span>
        <span className={`rounded-lg border px-2 py-1 ${CHIP.training}`}>3/5 : en formation</span>
      </div>

      <div className="flex gap-2.5 rounded-2xl bg-sky-50 p-3 text-sm text-sky-900">
        <Lightbulb size={18} className="mt-0.5 shrink-0 text-sky-600" />
        <p>
          <strong>Bon à savoir :</strong> en bas de chaque colonne, le nombre d&apos;habilités sur l&apos;effectif du poste. Visez au moins une personne de plus que
          l&apos;effectif : c&apos;est ce qui permet de couvrir une absence et de faire tourner l&apos;équipe.
        </p>
      </div>
    </div>
  );
}
