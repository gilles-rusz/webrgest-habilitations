import type { Status } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/types";

export const DOT: Record<Status, string> = {
  ok: "bg-emerald-500",
  training: "bg-amber-400",
  unsigned: "bg-red-600 animate-pulse",
  expired: "bg-red-600 animate-pulse",
};

export const CHIP: Record<Status, string> = {
  ok: "border-emerald-200 bg-emerald-50 text-emerald-800",
  training: "border-amber-200 bg-amber-50 text-amber-800",
  unsigned: "border-red-300 bg-red-50 text-red-700",
  expired: "border-red-300 bg-red-50 text-red-700",
};

export function StatusChip({ status }: { status: Status }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${CHIP[status]}`}>
      <span className={`h-2 w-2 rounded-full ${DOT[status]}`} />
      {STATUS_LABEL[status]}
    </span>
  );
}

export const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export const input = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base outline-none focus:border-teal-600";
