"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BRAND } from "@/config/brand";
import { Logo } from "../Logo";

const items = [
  { href: "/admin", label: "Dashboard", icon: "📊", adminOnly: false },
  { href: "/admin/candidats", label: "Candidats", icon: "👥", adminOnly: false },
  { href: "/admin/scanner", label: "Scanner", icon: "📷", adminOnly: false },
  { href: "/admin/parametres", label: "Paramètres", icon: "⚙️", adminOnly: true },
];

export function AdminNav({ name, role }: { name: string; role: "ADMIN" | "EVALUATOR" }) {
  const pathname = usePathname();
  const router = useRouter();
  const visible = items.filter((i) => !i.adminOnly || role === "ADMIN");
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/5 bg-ink/90 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4">
          <Link href="/admin" className="flex min-w-0 items-center gap-2.5">
            <Logo size={38} />
            <span className="truncate font-display text-xl tracking-wide">
              {BRAND.name} <span className="text-gold">Admin</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Navigation administrateur">
            {visible.map((i) => (
              <Link
                key={i.href}
                href={i.href}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${isActive(i.href) ? "bg-gold/15 text-gold" : "text-mist-300 hover:bg-white/5 hover:text-white"}`}
              >
                {i.icon} {i.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <span className="hidden text-right text-xs text-mist-400 lg:block">
              {name}
              <br />
              {role === "ADMIN" ? "Administrateur" : "Évaluateur"}
            </span>
            <button type="button" onClick={logout} className="rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold text-mist-300 hover:border-danger hover:text-red-300">
              Déconnexion
            </button>
          </div>
        </div>
      </header>
      {/* Barre d'onglets mobile, accessible au pouce */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid border-t border-white/10 bg-ink-800/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden" style={{ gridTemplateColumns: `repeat(${visible.length}, minmax(0, 1fr))` }} aria-label="Navigation administrateur mobile">
        {visible.map((i) => (
          <Link key={i.href} href={i.href} className={`flex min-h-[60px] flex-col items-center justify-center text-xs font-semibold ${isActive(i.href) ? "text-gold" : "text-mist-400"}`}>
            <span className="text-xl">{i.icon}</span>
            {i.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
