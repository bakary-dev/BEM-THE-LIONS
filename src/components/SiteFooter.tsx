import Link from "next/link";
import { BRAND } from "@/config/brand";
import { Logo } from "./Logo";

export function SiteFooter({ season }: { season: string }) {
  return (
    <footer className="mt-20 border-t border-white/5 bg-ink-800/50">
      <div className="container-page flex flex-col items-center gap-4 py-10 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-3">
          <Logo size={44} />
          <div>
            <p className="font-display text-xl tracking-wide">{BRAND.name}</p>
            <p className="text-sm text-mist-400">
              {BRAND.city} · {BRAND.sport} · Saison {season}
            </p>
          </div>
        </div>
        <nav className="flex flex-wrap justify-center gap-4 text-sm text-mist-400" aria-label="Liens du pied de page">
          <Link href="/inscription" className="hover:text-gold">Inscription</Link>
          <Link href="/statut" className="hover:text-gold">Mon résultat</Link>
          <Link href="/aide" className="hover:text-gold">Besoin d&apos;aide ?</Link>
          <Link href="/admin" className="hover:text-gold">Espace responsables</Link>
        </nav>
      </div>
      <p className="pb-6 text-center text-xs text-mist-500">
        © {new Date().getFullYear()} {BRAND.name} — {BRAND.city}
      </p>
    </footer>
  );
}
