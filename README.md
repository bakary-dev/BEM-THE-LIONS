# 🦁 BEM THE LIONS — Recrutement Basketball 2026-2027

Application web de recrutement de l'équipe de basketball **BEM THE LIONS — Abidjan**, pour l'année académique 2026-2027.

```
Splash → Accueil → Inscription → Numéro candidat → QR Code → Jour de sélection
→ Scan QR (admin) → Candidat vérifié → Profil → Évaluation → Décision → RETENU / NON RETENU
```

## Stack

| Couche | Choix |
| --- | --- |
| Framework | Next.js 15 (App Router) + React 19 + TypeScript |
| UI | Tailwind CSS (thème noir / or / orange basket, animations CSS légères) |
| Base de données | Prisma ORM — SQLite en local, PostgreSQL recommandé en production |
| Validation | zod (mêmes schémas côté navigateur et serveur) |
| Auth admin | Session JWT signée (jose) en cookie httpOnly + mots de passe bcrypt |
| QR Code | `qrcode` (génération) · `html5-qrcode` (scan caméra) |
| Exports | CSV (séparateur `;`, compatible Excel FR) · Excel `.xlsx` (exceljs) |
| Tests | Vitest (unitaires + intégration base) · Playwright (parcours complets mobile + desktop) |

## Démarrage

```bash
npm install
cp .env.example .env          # puis renseigner AUTH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npx prisma db push            # crée la base
npm run db:seed               # paramètres + compte admin (+ données fictives si SEED_DEMO_DATA=true)
npm run dev                   # http://localhost:3000
```

Puis **déposer le logo officiel** dans `public/brand/logo-bem-the-lions.png` (voir `public/brand/README.md`).

### Variables d'environnement (`.env`)

| Variable | Rôle |
| --- | --- |
| `DATABASE_URL` | `file:./dev.db` en local ; URL PostgreSQL en production |
| `AUTH_SECRET` | Secret de signature des sessions admin, **32 caractères minimum** (`node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | Compte administrateur créé par le seed (mot de passe ≥ 10 caractères) |
| `SEED_DEMO_DATA` | `true` pour créer des candidats et contacts **fictifs** (développement uniquement, refusé en production) |

Aucun secret n'est présent dans le code. `.env` est ignoré par git.

## Pages

**Public**

| Route | Contenu |
| --- | --- |
| `/` | Splash screen (~3 s) puis redirection vers `/accueil` |
| `/accueil` | Bienvenue, « Prêt à rejoindre la meute ? 🦁 », statistiques animées, section Recrutement |
| `/inscription` | Formulaire, confirmation « INSCRIPTION RÉUSSIE ✅ », numéro, carte candidat + QR Code téléchargeables |
| `/statut` | « J'ai déjà un numéro candidat » → carte (avant décision), page RETENU ou NON RETENU |
| `/aide` | 🆘 Besoin d'aide ? — Responsable/Capitaine et Coach avec boutons WhatsApp et Appeler (`tel:`) |

**Administration** (protégée)

| Route | Contenu |
| --- | --- |
| `/admin/login` | Connexion |
| `/admin` | Dashboard : inscrits, retenus, non retenus, scannés, évalués, graphiques |
| `/admin/candidats` | Tableau : recherche, filtres, tri, exports Excel/CSV |
| `/admin/candidats/[id]` | Profil, évaluation (9 critères /10 + observations), décision avec confirmation, QR Code, modification |
| `/admin/scanner` | Scanner caméra (caméra arrière par défaut) + saisie manuelle de secours |
| `/admin/parametres` | Équipe, statistiques, lien du groupe WhatsApp, contacts (réservé aux ADMIN) |

## Règles métier

- Deux statuts seulement : **RETENU** et **NON RETENU**. Avant la décision, le statut est vide (aucun statut intermédiaire n'est affiché) ; le candidat qui saisit son numéro revoit simplement sa carte et son QR Code.
- Numéros `BEM-2026-0001`, `BEM-2026-0002`… générés par un compteur atomique ; unicité garantie en base (numéro, QR Code, email, téléphone).
- Le QR Code encode le numéro candidat.
- La page NON RETENU affiche uniquement : « Désolé [Nom Prénom], vous n'avez pas été retenu. » — aucune note, aucun commentaire, aucune raison.
- Le lien du groupe WhatsApp est stocké une seule fois (table `settings`) et n'est envoyé qu'aux candidats RETENUS.
- Les statistiques de l'accueil, la saison, le lien WhatsApp et les contacts se modifient dans `/admin/parametres`.
- Rappels du règlement repris dans l'interface : l'inscription ne garantit pas la sélection ; la sélection est décidée par les responsables ; les communications officielles peuvent passer par WhatsApp.

## Sécurité

- Routes `/admin/*` et `/api/admin/*` protégées par middleware **et** revérifiées côté serveur (compte toujours existant en base).
- Rôles : `ADMIN` (tout) et `EVALUATOR` (scan + évaluation, sans décision, modification ni paramètres).
- Cookie de session `httpOnly`, `SameSite=Strict`, `Secure` en production ; contrôle d'origine sur les requêtes API en écriture (anti-CSRF).
- Validation zod côté client **et** serveur ; limitation de débit sur l'inscription, la recherche de statut et la connexion.
- Les API publiques ne renvoient jamais téléphone, email, évaluation ou observations.
- Exports CSV protégés contre l'injection de formules ; journal d'audit des décisions, modifications et paramètres (`audit_logs`).
- En-têtes de sécurité (`X-Frame-Options`, `nosniff`, `Permissions-Policy` caméra limitée au site).

> La caméra du scanner nécessite **HTTPS** (ou `localhost`). Le limiteur de débit est en mémoire : pour plusieurs instances, le remplacer par un store partagé (Redis…).

## Tests

```bash
npm test             # Vitest : validation, numéros, téléphone, doublons, concurrence, statut public, admin, exports
npm run test:e2e     # Playwright : parcours complets sur smartphone (Pixel 7) et desktop
```

Les tests utilisent des bases SQLite jetables (`prisma/test.db`, `prisma/e2e.db`). Dans un environnement où Chromium est déjà installé : `PW_CHROMIUM_PATH=/chemin/vers/chrome npm run test:e2e`.

Comptes de démonstration (si `SEED_DEMO_DATA=true`) : l'admin défini dans `.env`, et `evaluateur@bemthelions.local` / `Evaluateur2026!` (rôle évaluateur).

## Production

1. Dans `prisma/schema.prisma`, remplacer `provider = "sqlite"` par `"postgresql"` et renseigner `DATABASE_URL`.
2. `npx prisma db push && npm run db:seed` (avec `SEED_DEMO_DATA=false`).
3. `npm run build && npm start`, derrière HTTPS.

## Évolution future

L'architecture est modulaire (`src/modules/`) pour accueillir plus tard la **Gestion des joueurs BEM THE LIONS** (joueurs, entraînements, présences, matchs, convocations, statistiques, annonces). Ce module n'est pas développé ; voir `src/modules/README.md`.
