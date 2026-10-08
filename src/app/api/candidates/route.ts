import { NextResponse } from "next/server";
import { registrationSchema } from "@/modules/recruitment/validation";
import { DuplicateCandidateError, registerCandidate } from "@/modules/recruitment/service";
import { getSettings } from "@/lib/settings";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { jsonError, readJson, zodFieldErrors } from "@/lib/http";

/** Inscription publique d'un candidat. */
export async function POST(req: Request) {
  if (!rateLimit(`register:${clientIp(req)}`, 10, 10 * 60_000)) {
    return jsonError("Trop de tentatives. Réessayez dans quelques minutes.", 429);
  }
  const parsed = registrationSchema.safeParse(await readJson(req));
  if (!parsed.success) {
    return jsonError("Formulaire invalide", 400, { fields: zodFieldErrors(parsed.error) });
  }
  try {
    const candidate = await registerCandidate(parsed.data);
    const settings = await getSettings();
    // Réponse limitée au strict nécessaire pour la confirmation et la carte candidat.
    return NextResponse.json(
      {
        candidate: {
          candidateNumber: candidate.candidateNumber,
          firstName: candidate.firstName,
          lastName: candidate.lastName,
          qrCode: candidate.qrCode,
          season: settings.season,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof DuplicateCandidateError) {
      return jsonError("Une candidature existe déjà avec ces informations.", 409, { fields: err.fields });
    }
    throw err;
  }
}
