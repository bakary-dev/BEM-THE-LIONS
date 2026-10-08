import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { findCandidateByNumber, recordScan } from "@/modules/recruitment/service";
import { parseCandidateNumber } from "@/modules/recruitment/candidate-number";
import { jsonError, readJson } from "@/lib/http";

/**
 * Vérification d'un candidat à partir du contenu d'un QR Code (ou d'une saisie manuelle).
 * Enregistre le passage au scanner.
 */
export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;
  const body = (await readJson(req)) as { code?: unknown } | null;
  const code = typeof body?.code === "string" ? body.code.slice(0, 200) : "";
  if (!parseCandidateNumber(code)) return NextResponse.json({ found: false, reason: "INVALID_CODE" }, { status: 404 });
  const candidate = await findCandidateByNumber(code);
  if (!candidate) return NextResponse.json({ found: false, reason: "NOT_FOUND" }, { status: 404 });
  const scanned = await recordScan(candidate.id);
  return NextResponse.json({
    found: true,
    candidate: {
      id: scanned.id,
      candidateNumber: scanned.candidateNumber,
      lastName: scanned.lastName,
      firstName: scanned.firstName,
      gender: scanned.gender,
      studyYear: scanned.studyYear,
      fieldOfStudy: scanned.fieldOfStudy,
      phone: scanned.phone,
      email: scanned.email,
      status: scanned.status,
      scanCount: scanned.scanCount,
      evaluated: scanned.evaluation !== null,
    },
  });
}

export function GET() {
  return jsonError("Méthode non autorisée", 405);
}
