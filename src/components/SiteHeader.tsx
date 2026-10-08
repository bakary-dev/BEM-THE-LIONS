import Link from "next/link";
import { BRAND } from "@/config/brand";
import { Logo } from "./Logo";

const links = [
  { href: "/accueil", label: "Accueil" },
  { href: "/inscription", label: "Inscription" },
  { href: "/statut", label: "Mon résultat" },
  { href: "/aide", label: "Besoin d'aide ?" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-ink/80 backdrop-blur-lg">
      <div className="container-page flex h-16 items-center justify-between gap-3">
        <Link href="/accueil" className="flex min-w-0 items-center gap-2.5" aria-label={`${BRAND.name} — accueil`}>
          <Logo size={40} priority />
          <span className="truncate font-display text-2xl tracking-wide">{BRAND.name}</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Navigation principale">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-lg px-3 py-2 text-sm font-semibold text-mist-300 transition hover:bg-white/5 hover:text-gold">
              {l.label}
            </Link>
          ))}
        </nav>
        <Link href="/aide" className="rounded-lg border border-white/10 px-3 py-2 text-sm font-bold text-gold md:hidden">
          🆘 Aide
        </Link>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-white/5 px-2 py-1.5 md:hidden" aria-label="Navigation mobile">
        {links.slice(0, 3).map((l) => (
          <Link key={l.href} href={l.href} className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold text-mist-300 hover:text-gold">
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
