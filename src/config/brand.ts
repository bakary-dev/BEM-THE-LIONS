/**
 * Identité officielle. Le nom s'écrit toujours exactement « BEM THE LIONS ».
 * Les valeurs variables (saison, statistiques, contacts…) sont dans la table `settings`
 * et se modifient depuis /admin/parametres.
 */
export const BRAND = {
  name: "BEM THE LIONS",
  city: "Abidjan",
  sport: "Basketball",
  tagline: "Prêt à rejoindre la meute ? 🦁",
  /**
   * Logo officiel fourni par l'équipe.
   * Déposer le fichier dans public/brand/ (ex. public/brand/logo-bem-the-lions.png)
   * et ajuster ce chemin si le nom ou l'extension diffèrent.
   */
  logoSrc: "/brand/logo-bem-the-lions.png",
} as const;

/** Année utilisée dans les numéros candidats : BEM-2026-0001. */
export const CANDIDATE_NUMBER_PREFIX = "BEM";
export const CANDIDATE_NUMBER_YEAR = "2026";
