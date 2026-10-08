"use client";

import { useState } from "react";
import Link from "next/link";
import type { PublicSettings } from "@/lib/settings";
import type { PublicStatusResult } from "@/modules/recruitment/service";
import { parseCandidateNumber } from "@/modules/recruitment/candidate-number";
import { displayName } from "@/modules/recruitment/constants";
import { CandidateCard } from "./CandidateCard";
import { HelpContacts } from "./HelpContacts";
import { Logo } from "./Logo";

type Found = Exclude<PublicStatusResult, { kind: "NOT_FOUND" }>;

export function StatusLookup({ settings }: { settings: PublicSettings }) {
  const [number, setNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Found | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const normalized = parseCandidateNumber(number);
    if (!normalized) {
      setError("Numéro invalide. Format attendu : BEM-2026-XXXX");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateNumber: normalized }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.status === 404) setError("Aucune candidature ne correspond à ce numéro. Vérifiez votre saisie.");
      else if (!res.ok) setError(body.error ?? "Une erreur est survenue. Réessayez.");
      else {
        setResult(body as Found);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch {
      setError("Connexion impossible. Vérifiez votre réseau et réessayez.");
    } finally {
      setLoading(false);
    }
  }

  if (result?.kind === "RETENU") return <RetenuView result={result} settings={settings} />;
  if (result?.kind === "NON_RETENU") return <NonRetenuView result={result} />;
  if (result?.kind === "REGISTERED") {
    return (
      <section className="mx-auto max-w-2xl text-center" data-testid="status-registered">
        <h1 className="font-display text-4xl tracking-wide sm:text-5xl">Votre carte candidat</h1>
        <p className="mt-2 text-mist-300">{displayName(result.card)}</p>
        <div className="mt-8">
          <CandidateCard data={result.card} />
        </div>
        <button type="button" onClick={() => setResult(null)} className="btn-secondary mt-8">
          Nouvelle recherche
        </button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-lg text-center">
      <Logo size={80} className="mx-auto" />
      <h1 className="mt-5 font-display text-4xl tracking-wide sm:text-5xl">J&apos;ai déjà un numéro candidat</h1>
      <p className="mt-2 text-mist-300">Saisissez votre numéro candidat pour consulter votre dossier.</p>
      <form onSubmit={onSubmit} noValidate className="card mt-8 space-y-4 p-5 text-left sm:p-7" data-testid="status-form">
        <div>
          <label htmlFor="candidateNumber" className="label">
            Numéro candidat
          </label>
          <input
            id="candidateNumber"
            name="candidateNumber"
            value={number}
            onChange={(e) => setNumber(e.target.value.toUpperCase())}
            placeholder="BEM-2026-XXXX"
            autoCapitalize="characters"
            autoComplete="off"
            className={`input font-mono text-lg tracking-wider ${error ? "input-error" : ""}`}
            aria-invalid={!!error}
          />
          {error && (
            <p className="field-error" role="alert" data-testid="status-error">
              {error}
            </p>
          )}
        </div>
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Recherche…" : "Rechercher mon dossier"}
        </button>
      </form>
      <p className="mt-6 text-sm text-mist-400">
        Pas encore inscrit ?{" "}
        <Link href="/inscription" className="font-semibold text-gold hover:underline">
          Commencer mon inscription
        </Link>
      </p>
    </section>
  );
}

function RetenuView({ result, settings }: { result: Extract<Found, { kind: "RETENU" }>; settings: PublicSettings }) {
  const name = displayName(result);
  return (
    <div className="mx-auto max-w-3xl space-y-12" data-testid="status-retenu">
      <section className="relative overflow-hidden rounded-3xl border border-gold/40 bg-gradient-to-br from-gold/20 via-ink-800 to-ink p-6 text-center sm:p-12">
        <div className="pointer-events-none absolute inset-0 animate-glow bg-[radial-gradient(circle_at_50%_0%,rgba(245,183,0,.35),transparent_60%)]" aria-hidden />
        <Logo size={110} className="relative mx-auto animate-pop-in" />
        <h1 className="relative mt-6 animate-slide-up font-display text-4xl leading-tight tracking-wide text-gold sm:text-6xl">
          🎉 FÉLICITATIONS {name} !
        </h1>
        <p className="relative mt-5 animate-slide-up text-lg text-white [animation-delay:200ms] sm:text-xl">
          Vous avez été retenu(e) et êtes désormais membre de l&apos;équipe de basketball {settings.teamName} – {settings.city}, pour
          l&apos;année académique {result.season}.
        </p>
        <p className="relative mt-6 animate-slide-up font-display text-3xl tracking-wider [animation-delay:400ms] sm:text-5xl">
          BIENVENUE DANS L&apos;ÉQUIPE ! 🦁🏀
        </p>
      </section>

      <section className="card p-6 text-center sm:p-10" aria-labelledby="wa-title">
        <h2 id="wa-title" className="font-display text-3xl tracking-wide sm:text-4xl">
          REJOIGNEZ LE GROUPE WHATSAPP OFFICIEL
        </h2>
        <p className="mt-2 text-sm text-mist-400">Les communications officielles de l&apos;équipe peuvent passer par WhatsApp.</p>
        {result.whatsappGroupLink ? (
          <a
            href={result.whatsappGroupLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp mt-6 w-full text-base sm:w-auto sm:px-10"
            data-testid="whatsapp-group"
          >
            🟢 REJOINDRE LE GROUPE WHATSAPP
          </a>
        ) : (
          <p className="mt-6 text-mist-300">Le lien du groupe sera communiqué très prochainement par les responsables.</p>
        )}
      </section>

      <HelpContacts settings={settings} compact />
    </div>
  );
}

function NonRetenuView({ result }: { result: Extract<Found, { kind: "NON_RETENU" }> }) {
  return (
    <section className="card mx-auto max-w-xl p-8 text-center sm:p-12" data-testid="status-non-retenu">
      <Logo size={80} className="mx-auto" />
      <p className="mt-6 text-xl font-semibold sm:text-2xl">Désolé {displayName(result)}, vous n&apos;avez pas été retenu.</p>
    </section>
  );
}
