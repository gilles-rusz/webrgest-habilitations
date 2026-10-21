import type { Operator, Qualification, Station, Status } from "./types";

export const pad = (n: number) => String(n).padStart(2, "0");

export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const fmtDate = (s: string | null) => (s ? s.split("-").reverse().join("/") : "");

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

export const progress = (q: Qualification, s: Station) => s.points.filter((p) => q.checked.includes(p.id)).length;

export function qualStatus(q: Qualification, s: Station): Status {
  if (progress(q, s) < s.points.length) return "training";
  return q.signed ? "ok" : "unsigned";
}

export function findQual(op: Operator, stationId: string) {
  return op.quals.find((q) => q.stationId === stationId);
}

export function statusOf(op: Operator, s: Station): Status | null {
  const q = findQual(op, s.id);
  return q ? qualStatus(q, s) : null;
}

export const canWork = (op: Operator, s: Station) => statusOf(op, s) === "ok";

export function unsignedCount(ops: Operator[], stations: Station[]) {
  return ops.reduce((n, op) => n + stations.filter((s) => statusOf(op, s) === "unsigned").length, 0);
}

export const newQual = (stationId: string): Qualification => ({
  stationId,
  checked: [],
  validatedBy: "",
  validatedAt: null,
  signed: false,
  signedAt: null,
});
