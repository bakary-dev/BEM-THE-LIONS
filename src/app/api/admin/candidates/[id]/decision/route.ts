import { NextResponse } from "next/server";
import { z } from "zod";
import { actorOf, requireAdmin } from "@/lib/auth";
import { STATUSES } from "@/modules/recruitment/constants";
import { NotFoundError, decide } from "@/modules/recruitment/service";
import { jsonError, readJson } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };
const schema = z.object({ status: z.enum(STATUSES), confirm: z.literal(true) });

/** Décision RETENU / NON_RETENU — administrateurs uniquement, confirmation explicite requise. */
export async function POST(req: Request, { params }: Ctx) {
  const { admin, error } = await requireAdmin("ADMIN");
  if (error) return error;
  const parsed = schema.safeParse(await readJson(req));
  if (!parsed.success) return jsonError("Décision invalide : RETENU ou NON_RETENU avec confirmation.", 400);
  try {
    const c = await decide((await params).id, parsed.data.status, actorOf(admin));
    return NextResponse.json({ ok: true, status: c.status, decidedAt: c.decidedAt });
  } catch (err) {
    if (err instanceof NotFoundError) return jsonError(err.message, 404);
    throw err;
  }
}
