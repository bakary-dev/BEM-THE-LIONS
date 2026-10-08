import { z } from "zod";

const text = (max: number) => z.string().trim().max(max);
const count = z.coerce.number({ invalid_type_error: "Nombre invalide" }).int("Nombre entier attendu").min(0).max(100000);
const phone = text(25).refine((v) => v === "" || /^[+\d\s().-]{8,25}$/.test(v), "Numéro invalide");

export const settingsSchema = z.object({
  teamName: text(60).min(2, "Nom requis"),
  city: text(60).min(2, "Ville requise"),
  season: text(20).regex(/^\d{4}\s?-\s?\d{4}$/, "Format attendu : 2026-2027"),
  teamMembersCount: count,
  winsCount: count,
  lossesCount: count,
  previousSeason: text(20).regex(/^\d{4}\s?-\s?\d{4}$/, "Format attendu : 2025-2026"),
  whatsappGroupLink: text(300).refine(
    (v) => v === "" || /^https:\/\/(chat\.whatsapp\.com|wa\.me|whatsapp\.com)\//.test(v),
    "Lien WhatsApp invalide (https://chat.whatsapp.com/...)",
  ),
  responsibleName: text(80),
  responsibleWhatsapp: phone,
  responsiblePhone: phone,
  coachName: text(80),
  coachWhatsapp: phone,
  coachPhone: phone,
});

export type SettingsInput = z.infer<typeof settingsSchema>;
