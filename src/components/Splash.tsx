"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BRAND } from "@/config/brand";
import { Logo } from "./Logo";

const DURATION_MS = 3200;

/**
 * Écran d'introduction (~3 s) : apparition du logo → léger zoom → fondu → apparition du texte,
 * puis redirection automatique vers l'accueil.
 */
export function Splash({ season }: { season: string }) {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    router.prefetch("/accueil");
    const fade = setTimeout(() => setLeaving(true), DURATION_MS - 400);
    const go = setTimeout(() => router.replace("/accueil"), DURATION_MS);
    return () => {
      clearTimeout(fade);
      clearTimeout(go);
    };
  }, [router]);

  const seasonLabel = season.replace("-", " — ");

  return (
    <main
      className={`court-bg fixed inset-0 flex flex-col items-center justify-center overflow-hidden px-6 text-center transition-opacity duration-500 ${leaving ? "opacity-0" : "opacity-100"}`}
      data-testid="splash"
    >
      <div className="pointer-events-none absolute h-72 w-72 animate-glow rounded-full bg-gold/30 blur-3xl" aria-hidden />
      <div className="relative animate-splash-logo">
        <Logo size={168} priority />
      </div>
      <h1 className="relative mt-8 animate-slide-up font-display text-5xl tracking-wider [animation-delay:900ms] sm:text-7xl">
        {BRAND.name}
      </h1>
      <p className="relative mt-2 animate-slide-up text-sm font-bold uppercase tracking-[0.3em] text-gold [animation-delay:1200ms] sm:text-base">
        🏀 Recrutement Basketball
      </p>
      <p className="relative mt-1 animate-slide-up font-display text-3xl tracking-widest text-white/90 [animation-delay:1400ms]">
        {seasonLabel}
      </p>
      <p className="relative mt-6 animate-fade-in text-lg font-semibold text-mist-300 [animation-delay:1900ms]">{BRAND.tagline}</p>
      <button
        type="button"
        onClick={() => router.replace("/accueil")}
        className="absolute bottom-8 text-xs font-semibold uppercase tracking-widest text-mist-500 hover:text-gold"
      >
        Passer l&apos;intro →
      </button>
    </main>
  );
}
