import { CANDIDATE_NUMBER_PREFIX, CANDIDATE_NUMBER_YEAR } from "@/config/brand";

const PATTERN = new RegExp(`^${CANDIDATE_NUMBER_PREFIX}\\s*[-_ ]?\\s*(\\d{4})\\s*[-_ ]?\\s*(\\d{1,6})$`, "i");

/** 1 → BEM-2026-0001 */
export function formatCandidateNumber(sequence: number, year = CANDIDATE_NUMBER_YEAR): string {
  if (!Number.isInteger(sequence) || sequence < 1) throw new Error("Séquence invalide");
  return `${CANDIDATE_NUMBER_PREFIX}-${year}-${String(sequence).padStart(4, "0")}`;
}

/**
 * Normalise une saisie ou un contenu de QR Code (« bem-2026-47 », « BEM 2026 0047 »…)
 * en numéro canonique « BEM-2026-0047 ». Retourne null si le format est invalide.
 */
export function parseCandidateNumber(input: string): string | null {
  const match = input.trim().match(PATTERN);
  if (!match) return null;
  const sequence = Number(match[2]);
  if (sequence < 1) return null;
  return formatCandidateNumber(sequence, match[1]);
}
