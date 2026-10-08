import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth-token";

/**
 * Protège l'espace administrateur :
 * - /admin/* (sauf /admin/login) → redirection vers la connexion sans session valide ;
 * - /api/admin/* (sauf login) → 401 sans session valide ;
 * - toute requête API qui modifie des données doit venir de la même origine (anti-CSRF).
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith("/api/");

  if (isApi && !["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    const origin = req.headers.get("origin");
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    if (origin && host && new URL(origin).host !== host) {
      return NextResponse.json({ error: "Origine non autorisée" }, { status: 403 });
    }
  }

  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminApi = pathname.startsWith("/api/admin/");
  const isPublicAdminRoute = pathname === "/admin/login" || pathname === "/api/admin/login";
  if ((!isAdminPage && !isAdminApi) || isPublicAdminRoute) return NextResponse.next();

  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (session) return NextResponse.next();

  if (isAdminApi) return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
