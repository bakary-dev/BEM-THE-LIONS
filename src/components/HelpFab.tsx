import Link from "next/link";

/** Accès rapide « Besoin d'aide ? » présent sur les pages publiques importantes. */
export function HelpFab() {
  return (
    <Link
      href="/aide"
      className="fixed bottom-4 right-4 z-30 inline-flex min-h-[52px] items-center gap-2 rounded-full border border-gold/40 bg-ink-800/95 px-5 text-sm font-bold text-gold shadow-xl shadow-black/50 backdrop-blur transition hover:-translate-y-0.5 hover:border-gold"
      aria-label="Besoin d'aide ? Contacter un responsable"
    >
      🆘 <span>Besoin d&apos;aide ?</span>
    </Link>
  );
}
