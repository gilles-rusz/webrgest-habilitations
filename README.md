# Web RG Est / Habilitations

Suivi des habilitations du personnel par poste, avec planning de rotation automatique.

- **Postes** : chaque poste reprend les points à contrôler de son standard de poste (sécurité, qualité, méthode, environnement), son nombre de personnes et sa référence. Les postes de démo sont génériques, à adapter à chaque entreprise.
- **Opérateurs** : par nom, plusieurs postes par personne. Le responsable coche les points validés, puis "Papier signé" une fois le papier d'habilitation signé. Tant que ce n'est pas signé, un point rouge indique que la personne ne peut pas travailler sur le poste.
- **Matrice** : opérateurs x postes, nombre d'habilités par poste et alerte quand il n'y a aucune marge pour couvrir une absence.
- **Planning** : rotations sur la journée, uniquement sur les postes où la personne est habilitée et signée. On marque les absents, le planning se recalcule et signale les postes que personne ne peut tenir, avec la raison.

Prototype : les données restent dans le navigateur (localStorage). Accès protégé par code, jeton valable 24 h (même principe que Web RG Est / Traduction).

## Lancer en local

```bash
npm install
npm run dev   # http://localhost:3000, sans ACCESS_CODES l'accès est libre
```

## Variables d'environnement (Vercel)

| Variable | Rôle |
| --- | --- |
| `ACCESS_CODES` | codes d'accès, un par client : `Garage Martin:GM2026,Demo:RG2026`. Vide = accès libre |
| `AUTH_SECRET` | longue chaîne au hasard qui signe les jetons |
| `TOKEN_HOURS` | durée d'un accès, défaut 24 h |

L'algorithme de planning est dans `src/lib/planning.ts` : affectation optimale (méthode hongroise) qui couvre d'abord un maximum de postes, puis fait tourner chacun sur des postes différents d'une rotation à l'autre.
