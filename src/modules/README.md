# Modules métier

| Module | État | Description |
| --- | --- | --- |
| `recruitment/` | ✅ Actif | Recrutement BEM THE LIONS 2026-2027 : inscription, numéro candidat, QR Code, scan, évaluation, décision, exports. |
| `players/` | 🔜 Futur | Gestion des joueurs BEM THE LIONS : joueurs, entraînements, présences, absences, matchs, convocations, statistiques, annonces. **Non développé.** |

## Conventions pour un nouveau module

- La logique métier vit dans `src/modules/<module>/` (validation zod, services Prisma, constantes).
- Les routes HTTP (`src/app/api/...`) et les pages (`src/app/...`) restent fines et appellent le service.
- Les routes d'administration passent par `requireAdmin()` (`src/lib/auth.ts`) et se placent sous `/admin` et `/api/admin`, déjà protégées par le middleware.
- Les candidats `RETENU` pourront servir de point de départ au futur module `players` (référence `Candidate.id`).
