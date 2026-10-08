import Link from "next/link";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { Logo } from "@/components/Logo";
import { BRAND } from "@/config/brand";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "Accueil" };

export default async function HomePage() {
  const s = await getSettings();
  const stats = [
    { value: <AnimatedCounter value={s.teamMembersCount} prefix="+" />, label: "Membres dans l'équipe" },
    { value: <AnimatedCounter value={s.winsCount} prefix="+" />, label: "Victoires" },
    { value: <AnimatedCounter value={s.lossesCount} />, label: "Défaites" },
    { value: <span className="whitespace-nowrap text-4xl sm:text-5xl">{s.previousSeason}</span>, label: "Saison précédente" },
  ];

  return (
    <main>
      {/* HERO */}
      <section className="container-page flex flex-col items-center pb-12 pt-12 text-center sm:pt-20">
        <div className="relative animate-pop-in">
          <div className="absolute inset-0 animate-glow rounded-full bg-gold/30 blur-3xl" aria-hidden />
          <Logo size={140} priority className="relative" />
        </div>
        <p className="eyebrow mt-8 animate-fade-in">Bienvenue · {s.city}</p>
        <h1 className="mt-3 animate-slide-up font-display text-6xl leading-none tracking-wide sm:text-8xl">{s.teamName}</h1>
        <p className="mt-3 animate-slide-up text-sm font-bold uppercase tracking-[0.2em] text-gold [animation-delay:150ms] sm:text-lg">
          Recrutement Basketball — <span className="whitespace-nowrap">{s.season}</span>
        </p>
        <p className="mt-6 animate-slide-up text-2xl font-extrabold [animation-delay:300ms] sm:text-3xl">{BRAND.tagline}</p>

        <div className="mt-8 flex w-full max-w-md animate-slide-up flex-col gap-3 [animation-delay:450ms] sm:max-w-none sm:flex-row sm:justify-center">
          <Link href="/inscription" className="btn-primary text-base sm:px-8">
            🏀 Commencer mon inscription
          </Link>
          <Link href="/statut" className="btn-secondary text-base sm:px-8">
            J&apos;ai déjà un numéro candidat
          </Link>
        </div>
      </section>

      {/* STATISTIQUES */}
      <section className="container-page" aria-label="Statistiques de l'équipe">
        <dl className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {stats.map((st, i) => (
            <div
              key={st.label}
              className="card group animate-slide-up p-5 text-center transition hover:-translate-y-1 hover:border-gold/40 sm:p-6"
              style={{ animationDelay: `${500 + i * 120}ms` }}
            >
              <dd className="font-display text-5xl text-gold transition group-hover:scale-105 sm:text-6xl">{st.value}</dd>
              <dt className="mt-1 text-sm font-semibold text-mist-300">{st.label}</dt>
            </div>
          ))}
        </dl>
      </section>

      {/* RECRUTEMENT */}
      <section className="container-page mt-16" id="recrutement">
        <div className="card relative overflow-hidden p-6 sm:p-10">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-ball/20 blur-3xl" aria-hidden />
          <p className="eyebrow">🏀 Sélection</p>
          <h2 className="mt-2 font-display text-4xl tracking-wide sm:text-5xl">Recrutement {s.season}</h2>
          <p className="mt-4 max-w-2xl text-lg text-mist-300">
            Tu souhaites intégrer l&apos;équipe de basketball de {s.teamName} à {s.city} ? Inscris-toi pour participer à la sélection{" "}
            {s.season}.
          </p>
          <p className="mt-4 inline-flex rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-sm font-semibold text-gold-300">
            ⚠️ L&apos;inscription ne garantit pas la sélection dans l&apos;équipe.
          </p>
          <ol className="mt-8 grid gap-3 text-sm sm:grid-cols-4">
            {["Inscription en ligne", "Numéro candidat + QR Code", "Jour de sélection : scan du QR Code", "Décision des responsables"].map(
              (step, i) => (
                <li key={step} className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold font-bold text-ink">{i + 1}</span>
                  <span className="font-semibold text-mist-300">{step}</span>
                </li>
              ),
            )}
          </ol>
          <Link href="/inscription" className="btn-primary mt-8 w-full sm:w-auto">
            Commencer le recrutement
          </Link>
        </div>
      </section>
    </main>
  );
}
