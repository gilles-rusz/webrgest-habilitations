import { today } from "./model";
import type { Category, Operator, Qualification, State, Station } from "./types";

const station = (id: string, name: string, standard: string, needed: number, points: [Category, string][]): Station => ({
  id,
  name,
  standard,
  needed,
  points: points.map(([category, label], i) => ({ id: `${id}-p${i + 1}`, category, label })),
});

export const demoStations = (): Station[] => [
  station("rec", "Réception quai", "STD-REC-01", 1, [
    ["Sécurité", "Porte ses EPI : chaussures de sécurité, gilet haute visibilité, gants"],
    ["Qualité", "Contrôle les colis et le bon de livraison avant de signer le transporteur"],
    ["Méthode", "Saisit la réception dans le système avant de déplacer la marchandise"],
    ["Méthode", "Dépose les palettes dans la zone tampon marquée au sol"],
    ["Qualité", "Isole et signale les colis abîmés"],
  ]),
  station("cha", "Conduite chariot", "STD-CHA-01", 1, [
    ["Sécurité", "Autorisation de conduite et CACES à jour"],
    ["Sécurité", "Fait la check-list du chariot en début de poste"],
    ["Sécurité", "Respecte les allées piétons et la vitesse"],
    ["Méthode", "Met en place et reprend les palettes en hauteur selon le standard"],
    ["Environnement", "Remet le chariot en charge en fin de poste"],
  ]),
  station("pre", "Préparation de commandes", "STD-PRE-01", 2, [
    ["Méthode", "Scanne l'emplacement et l'article à chaque prélèvement"],
    ["Qualité", "Prélève la bonne référence au bon emplacement"],
    ["Sécurité", "Applique les gestes et postures pour les charges lourdes"],
    ["Qualité", "Contrôle les quantités avant de fermer la commande"],
    ["Méthode", "Filme et étiquette la palette terminée"],
  ]),
  station("qua", "Contrôle qualité", "STD-QUA-01", 1, [
    ["Qualité", "Contrôle par échantillonnage selon la fiche de contrôle"],
    ["Qualité", "Identifie et isole les produits non conformes"],
    ["Méthode", "Remplit la fiche de contrôle et la transmet au chef d'équipe"],
  ]),
  station("exp", "Expédition", "STD-EXP-01", 1, [
    ["Qualité", "Vérifie l'étiquette et le transporteur de chaque palette"],
    ["Méthode", "Charge le camion selon le plan de chargement"],
    ["Sécurité", "Cale la charge et contrôle la fermeture du camion"],
    ["Méthode", "Fait signer le bon de transport"],
  ]),
];

export function demoState(): State {
  const stations = demoStations();
  const by = Object.fromEntries(stations.map((s) => [s.id, s]));
  const date = today();
  const q = (id: string, done: number | "all", signed = true): Qualification => {
    const pts = by[id].points;
    const checked = pts.slice(0, done === "all" ? pts.length : done).map((p) => p.id);
    const complete = checked.length === pts.length;
    return {
      stationId: id,
      checked,
      validatedBy: complete ? "Responsable d'équipe" : "",
      validatedAt: complete ? date : null,
      signed: complete && signed,
      signedAt: complete && signed ? date : null,
    };
  };
  const op = (id: string, name: string, quals: Qualification[]): Operator => ({ id, name, quals, absent: false });
  return {
    settings: { site: "Entrepôt démo", shiftStart: "06:00", shiftHours: 8, rotations: 4 },
    stations,
    operators: [
      op("o1", "Marie Laurent", [q("rec", "all"), q("pre", "all"), q("exp", "all"), q("qua", "all")]),
      op("o2", "Karim Benali", [q("cha", "all"), q("rec", "all"), q("exp", "all")]),
      op("o3", "Sophie Muller", [q("qua", "all"), q("pre", "all")]),
      op("o4", "Lucas Weber", [q("pre", "all"), q("cha", "all", false)]),
      op("o5", "Ana Ferreira", [q("pre", "all"), q("exp", "all"), q("qua", 1)]),
      op("o6", "Thomas Klein", [q("cha", "all"), q("rec", "all"), q("pre", "all")]),
      op("o7", "Julie Schmit", [q("pre", "all"), q("rec", 3)]),
      op("o8", "Nicolas Roth", [q("exp", "all"), q("pre", "all"), q("cha", 2)]),
    ],
  };
}
