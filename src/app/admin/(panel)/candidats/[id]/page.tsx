import Link from "next/link";
import { notFound } from "next/navigation";
import { CandidateCard } from "@/components/CandidateCard";
import { CandidateEditForm } from "@/components/admin/CandidateEditForm";
import { DecisionPanel } from "@/components/admin/DecisionPanel";
import { EvaluationForm } from "@/components/admin/EvaluationForm";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { requireAdminPage } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { displayName, genderLabel, isStatus } from "@/modules/recruitment/constants";
import { averageScore, parseScores } from "@/modules/recruitment/evaluation";
import { getCandidate } from "@/modules/recruitment/service";

export const metadata = { title: "Profil candidat" };

const fmt = (d: Date | null) => (d ? d.toLocaleString("fr-FR", { timeZone: "Africa/Abidjan", dateStyle: "short", timeStyle: "short" }) : "—");

export default async function CandidatePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ verified?: string }> }) {
  const [{ id }, { verified }, admin, settings] = await Promise.all([params, searchParams, requireAdminPage(), getSettings()]);
  const c = await getCandidate(id);
  if (!c) notFound();
  const scores = parseScores(c.evaluation);
  const avg = averageScore(scores);
  const name = displayName(c);

  const info: [string, string][] = [
    ["Nom", c.lastName],
    ["Prénom", c.firstName],
    ["Genre", genderLabel(c.gender)],
    ["Année", c.studyYear],
    ["Filière", c.fieldOfStudy],
    ["Téléphone", c.phone],
    ["Email", c.email],
    ["Numéro candidat", c.candidateNumber],
    ["Inscription", fmt(c.registrationDate)],
    ["Scans", c.scanCount ? `${c.scanCount} (dernier : ${fmt(c.lastScannedAt)})` : "Jamais scanné"],
  ];

  return (
    <div className="space-y-6">
      <Link href="/admin/candidats" className="text-sm font-semibold text-mist-400 hover:text-gold">← Retour à la liste</Link>

      {verified && (
        <p className="rounded-xl border border-success/40 bg-success/10 p-3 font-bold text-green-300" role="status">✅ CANDIDAT VÉRIFIÉ</p>
      )}

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-gold">{c.candidateNumber}</p>
          <h1 className="font-display text-4xl tracking-wide sm:text-5xl" data-testid="candidate-name">{name}</h1>
        </div>
        <StatusBadge status={c.status} />
      </header>

      <nav className="flex gap-2 overflow-x-auto text-sm" aria-label="Sections du profil">
        {[["#profil", "Profil"], ["#evaluation", "Évaluation"], ["#decision", "Décision"], ["#qr", "QR Code"], ["#modifier", "Modifier"]].map(([href, label]) => (
          <a key={href} href={href} className="whitespace-nowrap rounded-full border border-white/10 px-4 py-2 font-semibold text-mist-300 hover:border-gold hover:text-gold">{label}</a>
        ))}
      </nav>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section id="profil" className="card scroll-mt-24 p-5">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-mist-300">Profil</h2>
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {info.map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs uppercase tracking-wider text-mist-500">{k}</dt>
                  <dd className="break-words font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section id="evaluation" className="card scroll-mt-24 p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-mist-300">Évaluation</h2>
              {c.evaluatedAt && <p className="text-xs text-mist-500">Dernière : {fmt(c.evaluatedAt)} par {c.evaluatedBy} · moyenne {avg}/10</p>}
            </div>
            <EvaluationForm candidateId={c.id} initialScores={scores} initialNotes={c.notes ?? ""} />
          </section>

          <section id="decision" className="card scroll-mt-24 p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-mist-300">Décision</h2>
              {c.decidedAt && <p className="text-xs text-mist-500">{fmt(c.decidedAt)} par {c.decidedBy}</p>}
            </div>
            <DecisionPanel candidateId={c.id} candidateName={name} current={isStatus(c.status) ? c.status : null} canDecide={admin.role === "ADMIN"} />
          </section>
        </div>

        <aside className="space-y-6">
          <section id="qr" className="scroll-mt-24">
            <CandidateCard data={{ candidateNumber: c.candidateNumber, firstName: c.firstName, lastName: c.lastName, qrCode: c.qrCode, season: settings.season }} />
          </section>
        </aside>
      </div>

      {admin.role === "ADMIN" && (
        <section id="modifier" className="card scroll-mt-24 p-5">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-mist-300">Modifier les informations</h2>
          <CandidateEditForm
            candidateId={c.id}
            initial={{ lastName: c.lastName, firstName: c.firstName, gender: c.gender, phone: c.phone, email: c.email, studyYear: c.studyYear, fieldOfStudy: c.fieldOfStudy }}
          />
        </section>
      )}
    </div>
  );
}
