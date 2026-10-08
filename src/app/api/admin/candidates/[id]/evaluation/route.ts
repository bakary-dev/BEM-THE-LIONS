import { NextResponse } from "next/server";
import { actorOf, requireAdmin } from "@/lib/auth";
import { evaluationSchema } from "@/modules/recruitment/evaluation";
import { NotFoundError, saveEvaluation } from "@/modules/recruitment/service";
import { jsonError, readJson, zodFieldErrors } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  const { admin, error } = await requireAdmin();
  if (error) return error;
  const parsed = evaluationSchema.safeParse(await readJson(req));
  if (!parsed.success) return jsonError("Évaluation invalide", 400, { fields: zodFieldErrors(parsed.error) });
  try {
    const c = await saveEvaluation((await params).id, parsed.data, actorOf(admin));
    return NextResponse.json({ ok: true, evaluatedAt: c.evaluatedAt });
  } catch (err) {
    if (err instanceof NotFoundError) return jsonError(err.message, 404);
    throw err;
  }
}
