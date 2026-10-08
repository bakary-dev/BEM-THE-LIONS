/**
 * Jetons de session admin (JWT HS256 signé avec AUTH_SECRET).
 * Fichier compatible Edge : utilisé par le middleware, sans accès base de données.
 */
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "bem_admin_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 10; // 10 h : une journée de sélection

export type AdminRole = "ADMIN" | "EVALUATOR";
export type SessionPayload = { sub: string; email: string; name: string; role: AdminRole };

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET manquant ou trop court (32 caractères minimum). Voir .env.example.");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ email: payload.email, name: payload.name, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    if (!payload.sub || typeof payload.email !== "string") return null;
    const role: AdminRole = payload.role === "EVALUATOR" ? "EVALUATOR" : "ADMIN";
    return { sub: payload.sub, email: payload.email, name: String(payload.name ?? ""), role };
  } catch {
    return null;
  }
}
