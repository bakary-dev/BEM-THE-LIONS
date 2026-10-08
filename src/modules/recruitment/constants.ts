/** Les deux seuls statuts possibles. Avant décision, le statut est vide (null). */
export const STATUSES = ["RETENU", "NON_RETENU"] as const;
export type CandidateStatus = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<CandidateStatus, string> = {
  RETENU: "RETENU",
  NON_RETENU: "NON RETENU",
};

export const GENDERS = [
  { value: "HOMME", label: "Homme" },
  { value: "FEMME", label: "Femme" },
] as const;
export type Gender = (typeof GENDERS)[number]["value"];

export const STUDY_YEARS = [
  "Licence 1",
  "Licence 2",
  "Licence 3",
  "Master 1",
  "Master 2",
  "Doctorat",
  "Autre",
] as const;

export function genderLabel(value: string): string {
  return GENDERS.find((g) => g.value === value)?.label ?? value;
}

export function isStatus(value: unknown): value is CandidateStatus {
  return typeof value === "string" && (STATUSES as readonly string[]).includes(value);
}

/** « Nom Prénom » tel qu'affiché dans les messages personnalisés. */
export function displayName(c: { lastName: string; firstName: string }): string {
  return `${c.lastName} ${c.firstName}`.trim();
}
