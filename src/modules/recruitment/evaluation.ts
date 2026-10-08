import { z } from "zod";

export const EVALUATION_CRITERIA = [
  { key: "technique", label: "Technique" },
  { key: "tir", label: "Tir" },
  { key: "dribble", label: "Dribble" },
  { key: "passe", label: "Passe" },
  { key: "defense", label: "Défense" },
  { key: "physique", label: "Physique" },
  { key: "comprehension", label: "Compréhension du jeu" },
  { key: "espritEquipe", label: "Esprit d'équipe" },
  { key: "motivation", label: "Motivation" },
] as const;

export type CriterionKey = (typeof EVALUATION_CRITERIA)[number]["key"];
export const SCORE_MIN = 0;
export const SCORE_MAX = 10;

const score = z.coerce
  .number({ invalid_type_error: "Note invalide" })
  .int("La note doit être un entier")
  .min(SCORE_MIN, `Note minimale : ${SCORE_MIN}`)
  .max(SCORE_MAX, `Note maximale : ${SCORE_MAX}`);

export const evaluationSchema = z.object({
  scores: z.object(
    Object.fromEntries(EVALUATION_CRITERIA.map((c) => [c.key, score])) as Record<CriterionKey, typeof score>,
  ),
  notes: z
    .string()
    .max(2000, "Observations trop longues (2000 caractères max.)")
    .optional()
    .transform((v) => v?.trim() ?? ""),
});

export type EvaluationInput = z.infer<typeof evaluationSchema>;
export type Scores = Record<CriterionKey, number>;

export function parseScores(json: string | null): Scores | null {
  if (!json) return null;
  try {
    const parsed = evaluationSchema.shape.scores.safeParse(JSON.parse(json));
    return parsed.success ? (parsed.data as Scores) : null;
  } catch {
    return null;
  }
}

export function averageScore(scores: Scores | null): number | null {
  if (!scores) return null;
  const values = EVALUATION_CRITERIA.map((c) => scores[c.key]);
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}
