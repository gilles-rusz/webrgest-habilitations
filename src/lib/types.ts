export const CATEGORIES = ["Sécurité", "Qualité", "Méthode", "Environnement"] as const;
export type Category = (typeof CATEGORIES)[number];

export type Point = { id: string; label: string; category: Category };

export type Station = {
  id: string;
  name: string;
  standard: string;
  needed: number;
  points: Point[];
  validityMonths?: number;
};

export type Qualification = {
  stationId: string;
  checked: string[];
  validatedBy: string;
  validatedAt: string | null;
  signed: boolean;
  signedAt: string | null;
};

export type Operator = { id: string; name: string; quals: Qualification[]; absent: boolean };

export type Settings = { site: string; shiftStart: string; shiftHours: number; rotations: number };

export type State = { settings: Settings; stations: Station[]; operators: Operator[] };

export type Status = "training" | "unsigned" | "ok" | "expired";

export const STATUS_LABEL: Record<Status, string> = {
  training: "En formation",
  unsigned: "Papier non signé",
  ok: "Habilité",
  expired: "Audit dépassé",
};

export const CATEGORY_STYLE: Record<Category, string> = {
  Sécurité: "bg-red-50 text-red-700",
  Qualité: "bg-sky-50 text-sky-700",
  Méthode: "bg-violet-50 text-violet-700",
  Environnement: "bg-emerald-50 text-emerald-700",
};
