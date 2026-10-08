import { NextResponse } from "next/server";
import { z } from "zod";
import { getPublicStatus } from "@/modules/recruitment/service";
import { parseCandidateNumber } from "@/modules/recruitment/candidate-number";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { jsonError, readJson } from "@/lib/http";

const schema = z.object({ candidateNumber: z.string().max(40) });

/** Recherche publique du résultat par numéro candidat (limitée pour éviter l'énumération). */
export async function POST(req: Request) {
  if (!rateLimit(`status:${clientIp(req)}`, 20, 10 * 60_000)) {
    return jsonError("Trop de recherches. Réessayez dans quelques minutes.", 429);
  }
  const parsed = schema.safeParse(await readJson(req));
  if (!parsed.success || !parseCandidateNumber(parsed.data.candidateNumber)) {
    return jsonError("Numéro candidat invalide. Format attendu : BEM-2026-XXXX", 400);
  }
  const result = await getPublicStatus(parsed.data.candidateNumber);
  return NextResponse.json(result, { status: result.kind === "NOT_FOUND" ? 404 : 200 });
}
