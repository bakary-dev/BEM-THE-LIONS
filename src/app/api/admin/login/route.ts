import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, signSession } from "@/lib/auth-token";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { jsonError, readJson } from "@/lib/http";

const schema = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1).max(200) });
// Hash factice : le temps de réponse reste identique si l'email n'existe pas.
const DUMMY_HASH = "$2b$12$oQ2enbEPDwrjnRavBGgQ6eKqHZqV6vsPOcOkXsI93wMMSP6vcX1zi";

export async function POST(req: Request) {
  const parsed = schema.safeParse(await readJson(req));
  if (!parsed.success) return jsonError("Email ou mot de passe incorrect", 401);
  const { email, password } = parsed.data;
  if (!rateLimit(`login:${clientIp(req)}`, 10, 15 * 60_000) || !rateLimit(`login:${email}`, 10, 15 * 60_000)) {
    return jsonError("Trop de tentatives de connexion. Réessayez dans 15 minutes.", 429);
  }

  const user = await prisma.adminUser.findUnique({ where: { email } });
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) return jsonError("Email ou mot de passe incorrect", 401);

  await prisma.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  const token = await signSession({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role === "EVALUATOR" ? "EVALUATOR" : "ADMIN",
  });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return res;
}
