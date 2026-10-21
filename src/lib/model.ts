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

export const DEFAULT_VALIDITY = 2;
export const WARN_DAYS = 15;

export const validityOf = (s: Station) => s.validityMonths ?? DEFAULT_VALIDITY;

export function addMonths(iso: string, months: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const last = new Date(y, m - 1 + months + 1, 0).getDate();
  const t = new Date(y, m - 1 + months, Math.min(d, last));
  return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
}

export const daysBetween = (from: string, to: string) =>
  Math.round((Date.UTC(...ymd(to)) - Date.UTC(...ymd(from))) / 86400000);

function ymd(iso: string): [number, number, number] {
  const [y, m, d] = iso.split("-").map(Number);
  return [y, m - 1, d];
}

export function expiryOf(q: Qualification, s: Station) {
  const months = validityOf(s);
  return q.signed && q.signedAt && months > 0 ? addMonths(q.signedAt, months) : null;
}

export function daysLeft(q: Qualification, s: Station) {
  const end = expiryOf(q, s);
  return end ? daysBetween(today(), end) : null;
}

export function qualStatus(q: Qualification, s: Station): Status {
  if (progress(q, s) < s.points.length) return "training";
  if (!q.signed) return "unsigned";
  const left = daysLeft(q, s);
  return left !== null && left < 0 ? "expired" : "ok";
}

export function dueSoon(q: Qualification, s: Station) {
  const left = daysLeft(q, s);
  return qualStatus(q, s) === "ok" && left !== null && left <= WARN_DAYS;
}

export type AuditItem = { op: Operator; st: Station; q: Qualification; end: string; left: number };

export function audits(ops: Operator[], stations: Station[]) {
  const out: AuditItem[] = [];
  for (const op of ops)
    for (const q of op.quals) {
      const st = stations.find((s) => s.id === q.stationId);
      if (!st) continue;
      const status = qualStatus(q, st);
      const end = expiryOf(q, st);
      const left = daysLeft(q, st);
      if (end && left !== null && (status === "expired" || dueSoon(q, st))) out.push({ op, st, q, end, left });
    }
  return out.sort((a, b) => a.left - b.left);
}

export function findQual(op: Operator, stationId: string) {
  return op.quals.find((q) => q.stationId === stationId);
}

export function statusOf(op: Operator, s: Station): Status | null {
  const q = findQual(op, s.id);
  return q ? qualStatus(q, s) : null;
}

export const canWork = (op: Operator, s: Station) => statusOf(op, s) === "ok";

export function alertCount(ops: Operator[], stations: Station[]) {
  const unsigned = ops.reduce((n, op) => n + stations.filter((s) => statusOf(op, s) === "unsigned").length, 0);
  return unsigned + audits(ops, stations).length;
}

export const newQual = (stationId: string): Qualification => ({
  stationId,
  checked: [],
  validatedBy: "",
  validatedAt: null,
  signed: false,
  signedAt: null,
});
