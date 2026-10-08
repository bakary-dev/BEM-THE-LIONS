import type { Settings } from "@prisma/client";
import { prisma } from "./db";

/** Retourne les paramètres (crée la ligne avec les valeurs par défaut au premier appel). */
export async function getSettings(): Promise<Settings> {
  return prisma.settings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
}

/** Sous-ensemble sans risque à exposer aux pages publiques. */
export type PublicSettings = Pick<
  Settings,
  | "teamName"
  | "city"
  | "season"
  | "teamMembersCount"
  | "winsCount"
  | "lossesCount"
  | "previousSeason"
  | "responsibleName"
  | "responsibleWhatsapp"
  | "responsiblePhone"
  | "coachName"
  | "coachWhatsapp"
  | "coachPhone"
>;

export function toPublicSettings(s: Settings): PublicSettings {
  return {
    teamName: s.teamName,
    city: s.city,
    season: s.season,
    teamMembersCount: s.teamMembersCount,
    winsCount: s.winsCount,
    lossesCount: s.lossesCount,
    previousSeason: s.previousSeason,
    responsibleName: s.responsibleName,
    responsibleWhatsapp: s.responsibleWhatsapp,
    responsiblePhone: s.responsiblePhone,
    coachName: s.coachName,
    coachWhatsapp: s.coachWhatsapp,
    coachPhone: s.coachPhone,
  };
}
