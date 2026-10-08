import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { actorOf, requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { settingsSchema } from "@/lib/settings-schema";
import { jsonError, readJson, zodFieldErrors } from "@/lib/http";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  return NextResponse.json(await getSettings());
}

export async function PUT(req: Request) {
  const { admin, error } = await requireAdmin("ADMIN");
  if (error) return error;
  const parsed = settingsSchema.safeParse(await readJson(req));
  if (!parsed.success) return jsonError("Paramètres invalides", 400, { fields: zodFieldErrors(parsed.error) });
  const data = { ...parsed.data, season: parsed.data.season.replace(/\s/g, ""), previousSeason: parsed.data.previousSeason.replace(/\s/g, "") };
  const settings = await prisma.settings.upsert({ where: { id: 1 }, update: data, create: { id: 1, ...data } });
  const actor = actorOf(admin);
  await prisma.auditLog.create({
    data: { actorId: actor.id, actorEmail: actor.email, action: "settings.update", details: JSON.stringify(data) },
  });
  return NextResponse.json(settings);
}
