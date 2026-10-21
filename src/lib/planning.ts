import { canWork, pad, statusOf } from "./model";
import type { Operator, Settings, Station } from "./types";

export type Gap = { stationId: string; reason: string };
export type Slot = { label: string; seats: Record<string, string[]>; gaps: Gap[]; spare: string[] };

const BIG = 1_000;
const NO = 1_000_000;

function hungarian(cost: number[][]): number[] {
  const n = cost.length;
  const m = cost[0]?.length ?? 0;
  const u = new Array(n + 1).fill(0);
  const v = new Array(m + 1).fill(0);
  const p = new Array(m + 1).fill(0);
  const way = new Array(m + 1).fill(0);
  for (let i = 1; i <= n; i++) {
    p[0] = i;
    let j0 = 0;
    const minv = new Array(m + 1).fill(Infinity);
    const used = new Array(m + 1).fill(false);
    do {
      used[j0] = true;
      const i0 = p[j0];
      let delta = Infinity;
      let j1 = 0;
      for (let j = 1; j <= m; j++) {
        if (used[j]) continue;
        const cur = cost[i0 - 1][j - 1] - u[i0] - v[j];
        if (cur < minv[j]) {
          minv[j] = cur;
          way[j] = j0;
        }
        if (minv[j] < delta) {
          delta = minv[j];
          j1 = j;
        }
      }
      for (let j = 0; j <= m; j++) {
        if (used[j]) {
          u[p[j]] += delta;
          v[j] -= delta;
        } else minv[j] -= delta;
      }
      j0 = j1;
    } while (p[j0] !== 0);
    do {
      const j1 = way[j0];
      p[j0] = p[j1];
      j0 = j1;
    } while (j0);
  }
  const rowToCol = new Array(n).fill(-1);
  for (let j = 1; j <= m; j++) if (p[j]) rowToCol[p[j] - 1] = j - 1;
  return rowToCol;
}

export function slotLabels(s: Settings) {
  const [h, m] = s.shiftStart.split(":").map(Number);
  const start = (h || 0) * 60 + (m || 0);
  const len = (s.shiftHours * 60) / s.rotations;
  const at = (min: number) => {
    const t = Math.round(min) % 1440;
    return `${pad(Math.floor(t / 60))}:${pad(t % 60)}`;
  };
  return Array.from({ length: s.rotations }, (_, i) => `${at(start + i * len)} - ${at(start + (i + 1) * len)}`);
}

function gapReason(st: Station, ops: Operator[], taken: Set<string>) {
  const names = (list: Operator[]) => list.map((o) => o.name).join(", ");
  const absent = ops.filter((o) => o.absent && canWork(o, st));
  const unsigned = ops.filter((o) => !o.absent && statusOf(o, st) === "unsigned");
  const busy = ops.filter((o) => !o.absent && canWork(o, st) && taken.has(o.id));
  const parts: string[] = [];
  if (absent.length) parts.push(`habilité absent : ${names(absent)}`);
  if (busy.length) parts.push(`déjà sur un autre poste : ${names(busy)}`);
  if (unsigned.length) parts.push(`formé mais papier non signé : ${names(unsigned)}`);
  return parts.length ? parts.join(" ; ") : "personne n'est habilité sur ce poste";
}

export function buildPlanning(stations: Station[], operators: Operator[], settings: Settings): Slot[] {
  const present = operators.filter((o) => !o.absent);
  const seats = stations.flatMap((s) => Array.from({ length: Math.max(0, s.needed) }, () => s));
  const times = new Map<string, number>();
  let prev = new Map<string, string>();
  const key = (op: string, st: string) => `${op}|${st}`;

  return slotLabels(settings).map((label, slot) => {
    const result: Slot = { label, seats: Object.fromEntries(stations.map((s) => [s.id, []])), gaps: [], spare: [] };
    if (!seats.length) {
      result.spare = present.map((o) => o.name);
      return result;
    }
    const cols = present.length + seats.length;
    const cost = seats.map((st, i) =>
      Array.from({ length: cols }, (_, j) => {
        if (j >= present.length) return BIG;
        const op = present[j];
        if (!canWork(op, st)) return NO;
        const rotate = (times.get(key(op.id, st.id)) ?? 0) * 10 + (prev.get(op.id) === st.id ? 5 : 0);
        return rotate + ((i + j + slot) % cols) * 0.001;
      }),
    );
    const match = hungarian(cost);
    const next = new Map<string, string>();
    const taken = new Set<string>();
    match.forEach((j, i) => {
      if (j >= 0 && j < present.length && cost[i][j] < BIG) taken.add(present[j].id);
    });
    match.forEach((j, i) => {
      const st = seats[i];
      if (j >= 0 && j < present.length && cost[i][j] < BIG) {
        const op = present[j];
        result.seats[st.id].push(op.name);
        next.set(op.id, st.id);
        times.set(key(op.id, st.id), (times.get(key(op.id, st.id)) ?? 0) + 1);
      } else if (!result.gaps.some((g) => g.stationId === st.id)) {
        result.gaps.push({ stationId: st.id, reason: gapReason(st, operators, taken) });
      }
    });
    result.spare = present.filter((o) => !next.has(o.id)).map((o) => o.name);
    prev = next;
    return result;
  });
}
