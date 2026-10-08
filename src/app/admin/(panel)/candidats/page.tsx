import Link from "next/link";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { GENDERS, STUDY_YEARS, genderLabel } from "@/modules/recruitment/constants";
import { listCandidates, SORT_KEYS, type CandidateFilters, type SortKey } from "@/modules/recruitment/service";

export const metadata = { title: "Candidats" };

type SP = Record<string, string | undefined>;

const COLUMNS: { key: SortKey | null; label: string }[] = [
  { key: "candidateNumber", label: "N° candidat" },
  { key: "lastName", label: "Nom" },
  { key: "firstName", label: "Prénom" },
  { key: "gender", label: "Genre" },
  { key: "studyYear", label: "Année" },
  { key: "fieldOfStudy", label: "Filière" },
  { key: null, label: "Téléphone" },
  { key: null, label: "Email" },
  { key: "registrationDate", label: "Inscription" },
  { key: "status", label: "Statut" },
];

function qs(params: SP, patch: SP = {}): string {
  const merged = { ...params, ...patch };
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) if (v) s.set(k, v);
  const str = s.toString();
  return str ? `?${str}` : "";
}

export default async function CandidatesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const filters: CandidateFilters = {
    q: sp.q,
    status: (sp.status ?? "") as CandidateFilters["status"],
    gender: sp.gender,
    studyYear: sp.studyYear,
    scanned: (sp.scanned ?? "") as CandidateFilters["scanned"],
    sort: SORT_KEYS.includes(sp.sort as SortKey) ? (sp.sort as SortKey) : "candidateNumber",
    dir: sp.dir === "desc" ? "desc" : "asc",
  };
  const candidates = await listCandidates(filters);
  const filterParams: SP = { q: sp.q, status: sp.status, gender: sp.gender, studyYear: sp.studyYear, scanned: sp.scanned };
  const date = (d: Date) => d.toLocaleDateString("fr-FR", { timeZone: "Africa/Abidjan" });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl tracking-wide sm:text-5xl">Candidats</h1>
          <p className="text-sm text-mist-400" data-testid="candidates-count">{candidates.length} résultat(s)</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`/api/admin/export${qs(filterParams, { format: "xlsx" })}`} className="btn-secondary" data-testid="export-xlsx">Exporter Excel</a>
          <a href={`/api/admin/export${qs(filterParams, { format: "csv" })}`} className="btn-secondary" data-testid="export-csv">Exporter CSV</a>
        </div>
      </div>

      <form method="GET" className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6" role="search">
        <input type="search" name="q" defaultValue={sp.q} placeholder="Rechercher : nom, n°, email, téléphone…" className="input lg:col-span-2" aria-label="Rechercher" />
        <select name="status" defaultValue={sp.status ?? ""} className="input" aria-label="Filtrer par statut">
          <option value="">Tous les statuts</option>
          <option value="RETENU">RETENU</option>
          <option value="NON_RETENU">NON RETENU</option>
          <option value="NONE">Sans décision</option>
        </select>
        <select name="gender" defaultValue={sp.gender ?? ""} className="input" aria-label="Filtrer par genre">
          <option value="">Tous les genres</option>
          {GENDERS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
        </select>
        <select name="studyYear" defaultValue={sp.studyYear ?? ""} className="input" aria-label="Filtrer par année">
          <option value="">Toutes les années</option>
          {STUDY_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select name="scanned" defaultValue={sp.scanned ?? ""} className="input" aria-label="Filtrer par passage au scanner">
          <option value="">Scannés ou non</option>
          <option value="yes">Scannés</option>
          <option value="no">Non scannés</option>
        </select>
        <input type="hidden" name="sort" value={filters.sort} />
        <input type="hidden" name="dir" value={filters.dir} />
        <div className="flex gap-2 sm:col-span-2 lg:col-span-6">
          <button type="submit" className="btn-primary">Appliquer</button>
          <Link href="/admin/candidats" className="btn-secondary">Réinitialiser</Link>
        </div>
      </form>

      {/* Tableau (tablette / ordinateur) */}
      <div className="card hidden overflow-x-auto md:block">
        <table className="w-full min-w-[1000px] text-left text-sm" data-testid="candidates-table">
          <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-mist-400">
            <tr>
              {COLUMNS.map((c) => (
                <th key={c.label} className="px-3 py-3 font-semibold">
                  {c.key ? (
                    <Link
                      href={qs({ ...filterParams, sort: c.key, dir: filters.sort === c.key && filters.dir === "asc" ? "desc" : "asc" })}
                      className={`hover:text-gold ${filters.sort === c.key ? "text-gold" : ""}`}
                    >
                      {c.label} {filters.sort === c.key ? (filters.dir === "asc" ? "▲" : "▼") : ""}
                    </Link>
                  ) : (
                    c.label
                  )}
                </th>
              ))}
              <th className="px-3 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {candidates.map((c) => (
              <tr key={c.id} className="transition hover:bg-white/[.03]">
                <td className="whitespace-nowrap px-3 py-3 font-mono text-gold">{c.candidateNumber}</td>
                <td className="px-3 py-3 font-semibold">{c.lastName}</td>
                <td className="px-3 py-3">{c.firstName}</td>
                <td className="px-3 py-3">{genderLabel(c.gender)}</td>
                <td className="whitespace-nowrap px-3 py-3">{c.studyYear}</td>
                <td className="px-3 py-3">{c.fieldOfStudy}</td>
                <td className="whitespace-nowrap px-3 py-3">{c.phone}</td>
                <td className="px-3 py-3">{c.email}</td>
                <td className="whitespace-nowrap px-3 py-3">{date(c.registrationDate)}</td>
                <td className="px-3 py-3"><StatusBadge status={c.status} /></td>
                <td className="whitespace-nowrap px-3 py-3 text-right">
                  <Link href={`/admin/candidats/${c.id}`} className="font-semibold text-gold hover:underline">Consulter →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {candidates.length === 0 && <p className="p-6 text-center text-mist-400">Aucun candidat ne correspond.</p>}
      </div>

      {/* Cartes (smartphone) */}
      <ul className="space-y-3 md:hidden">
        {candidates.map((c) => (
          <li key={c.id}>
            <Link href={`/admin/candidats/${c.id}`} className="card block p-4 active:scale-[.99]">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-sm text-gold">{c.candidateNumber}</p>
                  <p className="text-lg font-bold">{c.lastName} {c.firstName}</p>
                </div>
                <StatusBadge status={c.status} />
              </div>
              <p className="mt-1 text-sm text-mist-400">{genderLabel(c.gender)} · {c.studyYear} · {c.fieldOfStudy}</p>
              <p className="text-sm text-mist-500">{c.phone} · inscrit le {date(c.registrationDate)}</p>
            </Link>
          </li>
        ))}
        {candidates.length === 0 && <li className="card p-6 text-center text-mist-400">Aucun candidat ne correspond.</li>}
      </ul>
    </div>
  );
}
