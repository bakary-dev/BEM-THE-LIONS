import { z } from "zod";
import { GENDERS, STUDY_YEARS } from "./constants";

/**
 * Normalise un numéro de téléphone.
 * - Côte d'Ivoire : 10 chiffres (ex. 07 00 00 00 00) avec ou sans +225 → +2250700000000
 * - International : +<indicatif><numéro> (8 à 15 chiffres)
 */
export function normalizePhone(raw: string): string | null {
  const trimmed = raw.trim();
  if (!/^[+\d\s().-]+$/.test(trimmed)) return null;
  let digits = trimmed.replace(/\D/g, "");
  const international = trimmed.startsWith("+") || trimmed.startsWith("00");
  if (trimmed.startsWith("00")) digits = digits.slice(2);

  if (!international) {
    return /^0[1579]\d{8}$|^2[157]\d{8}$/.test(digits) ? `+225${digits}` : null;
  }
  if (digits.startsWith("225")) {
    const local = digits.slice(3);
    return /^0[1579]\d{8}$|^2[157]\d{8}$/.test(local) ? `+${digits}` : null;
  }
  return /^[1-9]\d{7,14}$/.test(digits) ? `+${digits}` : null;
}

const name = (label: string) =>
  z
    .string({ required_error: `${label} est obligatoire` })
    .transform((v) => v.trim().replace(/\s+/g, " "))
    .pipe(
      z
        .string()
        .min(2, `${label} doit contenir au moins 2 caractères`)
        .max(60, `${label} est trop long`)
        .regex(/^[\p{L}][\p{L}' .-]*$/u, `${label} contient des caractères non autorisés`),
    );

const genderValues = GENDERS.map((g) => g.value) as [string, ...string[]];

export const candidateFieldsSchema = z.object({
  lastName: name("Le nom"),
  firstName: name("Le prénom"),
  gender: z.enum(genderValues as ["HOMME", "FEMME"], {
    errorMap: () => ({ message: "Le genre est obligatoire" }),
  }),
  phone: z
    .string({ required_error: "Le numéro de téléphone est obligatoire" })
    .min(1, "Le numéro de téléphone est obligatoire")
    .transform((v, ctx) => {
      const phone = normalizePhone(v);
      if (!phone) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Numéro invalide (ex. 07 00 00 00 00 ou +225 07 00 00 00 00)",
        });
        return z.NEVER;
      }
      return phone;
    }),
  email: z
    .string({ required_error: "L'email est obligatoire" })
    .trim()
    .toLowerCase()
    .min(1, "L'email est obligatoire")
    .max(120, "Email trop long")
    .email("Adresse email invalide"),
  studyYear: z.enum(STUDY_YEARS as unknown as [string, ...string[]], {
    errorMap: () => ({ message: "L'année d'étude est obligatoire" }),
  }),
  fieldOfStudy: z
    .string({ required_error: "La filière est obligatoire" })
    .transform((v) => v.trim().replace(/\s+/g, " "))
    .pipe(z.string().min(2, "La filière est obligatoire").max(80, "Filière trop longue")),
});

export const registrationSchema = candidateFieldsSchema.extend({
  consent: z.literal(true, {
    errorMap: () => ({ message: "Vous devez accepter l'utilisation de vos informations" }),
  }),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;
export type CandidateFields = z.infer<typeof candidateFieldsSchema>;
