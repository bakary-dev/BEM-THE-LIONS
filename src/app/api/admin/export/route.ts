import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { listCandidates, type CandidateFilters } from "@/modules/recruitment/service";
import { candidatesToCsv, candidatesToXlsx } from "@/modules/recruitment/export";
import { jsonError } from "@/lib/http";

/** Export CSV / Excel des candidats (respecte les filtres de la liste). */
export async function GET(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;
  const url = new URL(req.url);
  const format = url.searchParams.get("format");
  const filters: CandidateFilters = {
    q: url.searchParams.get("q") ?? undefined,
    status: (url.searchParams.get("status") ?? "") as CandidateFilters["status"],
    gender: url.searchParams.get("gender") ?? undefined,
    studyYear: url.searchParams.get("studyYear") ?? undefined,
    scanned: (url.searchParams.get("scanned") ?? "") as CandidateFilters["scanned"],
  };
  const candidates = await listCandidates(filters);
  const { season } = await getSettings();
  const stamp = new Date().toISOString().slice(0, 10);
  const base = `BEM-THE-LIONS_candidats_${season}_${stamp}`;
  const headers = { "Cache-Control": "no-store" };

  if (format === "csv") {
    return new Response(candidatesToCsv(candidates), {
      headers: { ...headers, "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${base}.csv"` },
    });
  }
  if (format === "xlsx") {
    const buffer = await candidatesToXlsx(candidates, season);
    return new Response(new Uint8Array(buffer), {
      headers: {
        ...headers,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${base}.xlsx"`,
      },
    });
  }
  return jsonError("Format inconnu (csv ou xlsx)", 400);
}
