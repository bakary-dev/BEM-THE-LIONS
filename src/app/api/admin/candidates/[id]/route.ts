import { NextResponse } from "next/server";
import { actorOf, requireAdmin } from "@/lib/auth";
import { candidateFieldsSchema } from "@/modules/recruitment/validation";
import { DuplicateCandidateError, NotFoundError, getCandidate, updateCandidate } from "@/modules/recruitment/service";
import { jsonError, readJson, zodFieldErrors } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { error } = await requireAdmin();
  if (error) return error;
  const candidate = await getCandidate((await params).id);
  return candidate ? NextResponse.json(candidate) : jsonError("Candidat introuvable", 404);
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { admin, error } = await requireAdmin("ADMIN");
  if (error) return error;
  const parsed = candidateFieldsSchema.safeParse(await readJson(req));
  if (!parsed.success) return jsonError("Données invalides", 400, { fields: zodFieldErrors(parsed.error) });
  try {
    return NextResponse.json(await updateCandidate((await params).id, parsed.data, actorOf(admin)));
  } catch (err) {
    if (err instanceof NotFoundError) return jsonError(err.message, 404);
    if (err instanceof DuplicateCandidateError) return jsonError(err.message, 409, { fields: err.fields });
    throw err;
  }
}
