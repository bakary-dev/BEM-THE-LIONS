import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./db";
import { jsonError } from "./http";
import { SESSION_COOKIE, verifySession, type AdminRole, type SessionPayload } from "./auth-token";

export type Admin = SessionPayload;

/** Session admin courante, revérifiée contre la base (compte supprimé → session invalide). */
export async function getAdmin(): Promise<Admin | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);
  if (!session) return null;
  const user = await prisma.adminUser.findUnique({ where: { id: session.sub } });
  if (!user) return null;
  const role: AdminRole = user.role === "EVALUATOR" ? "EVALUATOR" : "ADMIN";
  return { sub: user.id, email: user.email, name: user.name, role };
}

/** Pour les pages serveur de /admin : redirige vers la connexion si nécessaire. */
export async function requireAdminPage(role?: AdminRole): Promise<Admin> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  if (role === "ADMIN" && admin.role !== "ADMIN") redirect("/admin?forbidden=1");
  return admin;
}

/** Pour les routes /api/admin : retourne l'admin ou une réponse 401/403. */
export async function requireAdmin(
  role?: AdminRole,
): Promise<{ admin: Admin; error: null } | { admin: null; error: Response }> {
  const admin = await getAdmin();
  if (!admin) return { admin: null, error: jsonError("Authentification requise", 401) };
  if (role === "ADMIN" && admin.role !== "ADMIN") {
    return { admin: null, error: jsonError("Action réservée aux administrateurs", 403) };
  }
  return { admin, error: null };
}

export function actorOf(admin: Admin) {
  return { id: admin.sub, email: admin.email };
}
