import Link from "next/link";

/** Accès rapide « Besoin d'aide ? » présent sur les pages publiques importantes. */
export function HelpFab() {
  return (
    <Link
      href="/aide"
      className="fixed bottom-4 right-4 z-30 inline-flex h-14 w-14 items-center justify-center gap-2 rounded-full md:h-auto md:min-h-[52px] md:w-auto border border-gold/40 bg-ink-800/95 text-xl md:px-5 md:text-sm font-bold text-gold shadow-xl shadow-black/50 backdrop-blur transition hover:-translate-y-0.5 hover:border-gold"
      aria-label="Besoin d'aide ? Contacter un responsable"
    >
      🆘 <span className="hidden md:inline">Besoin d&apos;aide ?</span>
    </Link>
  );
}
