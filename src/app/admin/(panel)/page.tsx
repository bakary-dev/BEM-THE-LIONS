import Link from "next/link";
import { BarList } from "@/components/admin/BarList";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { getAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { prisma } from "@/lib/db";
import { genderLabel } from "@/modules/recruitment/constants";
import { getDashboardStats } from "@/modules/recruitment/service";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ forbidden?: string }> }) {
  const [stats, settings, admin, recent, { forbidden }] = await Promise.all([
    getDashboardStats(),
    getSettings(),
    getAdmin(),
    prisma.candidate.findMany({ orderBy: { registrationDate: "desc" }, take: 5 }),
    searchParams,
  ]);
  const pct = (n: number) => (stats.total ? `${Math.round((n / stats.total) * 100)} %` : "0 %");
  const tiles = [
    { label: "Candidats inscrits", value: stats.total, sub: `Saison ${settings.season}`, accent: "text-gold" },
    { label: "Retenus", value: stats.retenus, sub: pct(stats.retenus), accent: "text-green-300" },
    { label: "Non retenus", value: stats.nonRetenus, sub: pct(stats.nonRetenus), accent: "text-red-300" },
    { label: "Candidats scannés", value: stats.scanned, sub: pct(stats.scanned), accent: "text-white" },
    { label: "Évalués", value: stats.evaluated, sub: pct(stats.evaluated), accent: "text-white" },
    { label: "Sans décision", value: stats.undecided, sub: pct(stats.undecided), accent: "text-mist-300" },
  ];

  return (
    <div className="space-y-8">
      {forbidden && (
        <p className="rounded-xl border border-danger/40 bg-danger/10 p-4 text-sm text-red-300" role="alert">
          Cette section est réservée aux administrateurs.
        </p>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Recrutement {settings.season}</p>
          <h1 className="font-display text-4xl tracking-wide sm:text-5xl">Bonjour {admin?.name} 👋</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/scanner" className="btn-primary">📷 Scanner un candidat</Link>
          <a href="/api/admin/export?format=xlsx" className="btn-secondary">Exporter Excel</a>
          <a href="/api/admin/export?format=csv" className="btn-secondary">Exporter CSV</a>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-6" data-testid="dashboard-stats">
        {tiles.map((t) => (
          <div key={t.label} className="card p-4">
            <dt className="text-xs font-semibold uppercase tracking-wider text-mist-400">{t.label}</dt>
            <dd className={`mt-1 font-display text-5xl ${t.accent}`}>{t.value}</dd>
            <dd className="text-xs text-mist-500">{t.sub}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-4 lg:grid-cols-3">
        <BarList title="Répartition par genre" data={stats.byGender.map((g) => ({ label: genderLabel(g.label), value: g.value }))} />
        <BarList title="Par année d'étude" data={stats.byStudyYear} />
        <BarList
          title="Inscriptions par jour (14 derniers jours)"
          data={stats.byDay.map((d) => ({ label: new Date(d.label).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }), value: d.value }))}
        />
      </div>

      <section className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-mist-300">Dernières inscriptions</h2>
          <Link href="/admin/candidats" className="text-sm font-semibold text-gold hover:underline">Voir tout →</Link>
        </div>
        <ul className="divide-y divide-white/5">
          {recent.map((c) => (
            <li key={c.id}>
              <Link href={`/admin/candidats/${c.id}`} className="flex items-center justify-between gap-3 py-3 hover:text-gold">
                <span className="min-w-0">
                  <span className="font-mono text-sm text-gold">{c.candidateNumber}</span>{" "}
                  <span className="font-semibold">{c.lastName} {c.firstName}</span>
                </span>
                <StatusBadge status={c.status} />
              </Link>
            </li>
          ))}
          {recent.length === 0 && <li className="py-3 text-sm text-mist-500">Aucun candidat pour le moment.</li>}
        </ul>
      </section>
    </div>
  );
}
