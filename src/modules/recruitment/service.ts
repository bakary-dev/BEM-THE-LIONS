import { Prisma, type Candidate } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { CANDIDATE_NUMBER_YEAR } from "@/config/brand";
import { formatCandidateNumber, parseCandidateNumber } from "./candidate-number";
import { STATUSES, type CandidateStatus } from "./constants";
import type { CandidateFields, RegistrationInput } from "./validation";
import type { EvaluationInput } from "./evaluation";

export class DuplicateCandidateError extends Error {
  constructor(public readonly fields: Partial<Record<"email" | "phone", string>>) {
    super("Candidature déjà enregistrée");
  }
}

export class NotFoundError extends Error {
  constructor() {
    super("Candidat introuvable");
  }
}

export type Actor = { id: string; email: string };

const COUNTER_KEY = `candidate-${CANDIDATE_NUMBER_YEAR}`;

const DUPLICATE_MESSAGES = {
  email: "Cet email est déjà utilisé pour une candidature.",
  phone: "Ce numéro de téléphone est déjà utilisé pour une candidature.",
} as const;

async function findDuplicates(
  data: Pick<CandidateFields, "email" | "phone">,
  excludeId?: string,
): Promise<DuplicateCandidateError["fields"]> {
  const existing = await prisma.candidate.findMany({
    where: {
      OR: [{ email: data.email }, { phone: data.phone }],
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    select: { email: true, phone: true },
  });
  const fields: DuplicateCandidateError["fields"] = {};
  for (const c of existing) {
    if (c.email === data.email) fields.email = DUPLICATE_MESSAGES.email;
    if (c.phone === data.phone) fields.phone = DUPLICATE_MESSAGES.phone;
  }
  return fields;
}

function duplicateFromPrismaError(err: unknown): DuplicateCandidateError | null {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    const target = String(err.meta?.target ?? "");
    const fields: DuplicateCandidateError["fields"] = {};
    if (target.includes("email")) fields.email = DUPLICATE_MESSAGES.email;
    if (target.includes("phone")) fields.phone = DUPLICATE_MESSAGES.phone;
    if (Object.keys(fields).length) return new DuplicateCandidateError(fields);
  }
  return null;
}

/** Réserve le prochain numéro de séquence (incrément atomique en une seule requête). */
async function nextSequence(): Promise<number> {
  try {
    const counter = await prisma.counter.update({ where: { key: COUNTER_KEY }, data: { value: { increment: 1 } } });
    return counter.value;
  } catch (err) {
    if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025")) throw err;
    // Premier candidat : on crée le compteur (une création concurrente échoue en P2002 → on réessaie l'incrément).
    try {
      await prisma.counter.create({ data: { key: COUNTER_KEY, value: 0 } });
    } catch (e) {
      if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")) throw e;
    }
    return nextSequence();
  }
}

/**
 * Crée un candidat avec un numéro unique (BEM-2026-XXXX) et son QR Code.
 * Le numéro provient d'un compteur incrémenté atomiquement ; les contraintes d'unicité
 * de la base (numéro, QR Code, email, téléphone) garantissent l'absence de doublon.
 */
export async function registerCandidate(input: RegistrationInput): Promise<Candidate> {
  const duplicates = await findDuplicates(input);
  if (Object.keys(duplicates).length) throw new DuplicateCandidateError(duplicates);

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const candidateNumber = formatCandidateNumber(await nextSequence());
      return await prisma.candidate.create({
        data: {
          candidateNumber,
          qrCode: candidateNumber,
          firstName: input.firstName,
          lastName: input.lastName,
          gender: input.gender,
          studyYear: input.studyYear,
          fieldOfStudy: input.fieldOfStudy,
          phone: input.phone,
          email: input.email,
          consentAt: new Date(),
        },
      });
    } catch (err) {
      const dup = duplicateFromPrismaError(err);
      if (dup) throw dup;
      // Conflit sur candidate_number (course concurrente) → on réessaie avec le numéro suivant.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") continue;
      throw err;
    }
  }
  throw new Error("Impossible de générer un numéro candidat unique");
}

export async function findCandidateByNumber(input: string): Promise<Candidate | null> {
  const number = parseCandidateNumber(input);
  if (!number) return null;
  return prisma.candidate.findUnique({ where: { candidateNumber: number } });
}

export type PublicCard = {
  candidateNumber: string;
  firstName: string;
  lastName: string;
  qrCode: string;
  season: string;
};

/**
 * Résultat public d'une recherche par numéro candidat.
 * N'expose jamais : notes, observations, évaluation, coordonnées du candidat.
 */
export type PublicStatusResult =
  | { kind: "NOT_FOUND" }
  | { kind: "REGISTERED"; card: PublicCard }
  | { kind: "RETENU"; firstName: string; lastName: string; season: string; whatsappGroupLink: string }
  | { kind: "NON_RETENU"; firstName: string; lastName: string };

export async function getPublicStatus(input: string): Promise<PublicStatusResult> {
  const candidate = await findCandidateByNumber(input);
  if (!candidate) return { kind: "NOT_FOUND" };
  const settings = await getSettings();
  const { firstName, lastName } = candidate;

  if (candidate.status === "RETENU") {
    return { kind: "RETENU", firstName, lastName, season: settings.season, whatsappGroupLink: settings.whatsappGroupLink };
  }
  if (candidate.status === "NON_RETENU") {
    return { kind: "NON_RETENU", firstName, lastName };
  }
  return {
    kind: "REGISTERED",
    card: { candidateNumber: candidate.candidateNumber, firstName, lastName, qrCode: candidate.qrCode, season: settings.season },
  };
}

export type CandidateFilters = {
  q?: string;
  status?: CandidateStatus | "NONE" | "";
  gender?: string;
  studyYear?: string;
  scanned?: "yes" | "no" | "";
  sort?: SortKey;
  dir?: "asc" | "desc";
};

export const SORT_KEYS = [
  "candidateNumber",
  "lastName",
  "firstName",
  "gender",
  "studyYear",
  "fieldOfStudy",
  "registrationDate",
  "status",
] as const;
export type SortKey = (typeof SORT_KEYS)[number];

export async function listCandidates(filters: CandidateFilters = {}): Promise<Candidate[]> {
  const where: Prisma.CandidateWhereInput = {};
  const q = filters.q?.trim();
  if (q) {
    const number = parseCandidateNumber(q);
    where.OR = [
      { candidateNumber: { contains: number ?? q.toUpperCase() } },
      { lastName: { contains: q } },
      { firstName: { contains: q } },
      { email: { contains: q.toLowerCase() } },
      { phone: { contains: q.replace(/\s/g, "") } },
      { fieldOfStudy: { contains: q } },
    ];
  }
  if (filters.status === "NONE") where.status = null;
  else if (filters.status && (STATUSES as readonly string[]).includes(filters.status)) where.status = filters.status;
  if (filters.gender) where.gender = filters.gender;
  if (filters.studyYear) where.studyYear = filters.studyYear;
  if (filters.scanned === "yes") where.scanCount = { gt: 0 };
  if (filters.scanned === "no") where.scanCount = 0;

  const sort: SortKey = filters.sort && SORT_KEYS.includes(filters.sort) ? filters.sort : "candidateNumber";
  const dir = filters.dir === "desc" ? "desc" : "asc";
  return prisma.candidate.findMany({ where, orderBy: [{ [sort]: dir }, { candidateNumber: "asc" }] });
}

export type DashboardStats = {
  total: number;
  retenus: number;
  nonRetenus: number;
  undecided: number;
  scanned: number;
  evaluated: number;
  byGender: { label: string; value: number }[];
  byStudyYear: { label: string; value: number }[];
  byDay: { label: string; value: number }[];
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const [total, retenus, nonRetenus, scanned, evaluated, genders, years, dates] = await Promise.all([
    prisma.candidate.count(),
    prisma.candidate.count({ where: { status: "RETENU" } }),
    prisma.candidate.count({ where: { status: "NON_RETENU" } }),
    prisma.candidate.count({ where: { scanCount: { gt: 0 } } }),
    prisma.candidate.count({ where: { evaluation: { not: null } } }),
    prisma.candidate.groupBy({ by: ["gender"], _count: { _all: true } }),
    prisma.candidate.groupBy({ by: ["studyYear"], _count: { _all: true } }),
    prisma.candidate.findMany({ select: { registrationDate: true }, orderBy: { registrationDate: "asc" } }),
  ]);

  const dayCounts = new Map<string, number>();
  for (const { registrationDate } of dates) {
    const key = registrationDate.toISOString().slice(0, 10);
    dayCounts.set(key, (dayCounts.get(key) ?? 0) + 1);
  }

  return {
    total,
    retenus,
    nonRetenus,
    undecided: total - retenus - nonRetenus,
    scanned,
    evaluated,
    byGender: genders.map((g) => ({ label: g.gender, value: g._count._all })),
    byStudyYear: years.map((y) => ({ label: y.studyYear, value: y._count._all })).sort((a, b) => b.value - a.value),
    byDay: [...dayCounts.entries()].slice(-14).map(([label, value]) => ({ label, value })),
  };
}

async function audit(actor: Actor, action: string, targetId: string | null, details?: unknown) {
  await prisma.auditLog.create({
    data: {
      actorId: actor.id,
      actorEmail: actor.email,
      action,
      targetId,
      details: details === undefined ? null : JSON.stringify(details),
    },
  });
}

export async function getCandidate(id: string): Promise<Candidate | null> {
  return prisma.candidate.findUnique({ where: { id } });
}

/** Enregistre le passage du candidat au scanner le jour de la sélection. */
export async function recordScan(id: string): Promise<Candidate> {
  const now = new Date();
  const existing = await prisma.candidate.findUnique({ where: { id }, select: { firstScannedAt: true } });
  if (!existing) throw new NotFoundError();
  return prisma.candidate.update({
    where: { id },
    data: { scanCount: { increment: 1 }, lastScannedAt: now, firstScannedAt: existing.firstScannedAt ?? now },
  });
}

export async function updateCandidate(id: string, data: CandidateFields, actor: Actor): Promise<Candidate> {
  if (!(await getCandidate(id))) throw new NotFoundError();
  const duplicates = await findDuplicates(data, id);
  if (Object.keys(duplicates).length) throw new DuplicateCandidateError(duplicates);
  try {
    const updated = await prisma.candidate.update({ where: { id }, data });
    await audit(actor, "candidate.update", id, data);
    return updated;
  } catch (err) {
    throw duplicateFromPrismaError(err) ?? err;
  }
}

export async function saveEvaluation(id: string, input: EvaluationInput, actor: Actor): Promise<Candidate> {
  if (!(await getCandidate(id))) throw new NotFoundError();
  const updated = await prisma.candidate.update({
    where: { id },
    data: {
      evaluation: JSON.stringify(input.scores),
      notes: input.notes || null,
      evaluatedAt: new Date(),
      evaluatedBy: actor.email,
    },
  });
  await audit(actor, "candidate.evaluate", id, input.scores);
  return updated;
}

/** Décision finale : RETENU ou NON_RETENU. Réservée aux administrateurs. */
export async function decide(id: string, status: CandidateStatus, actor: Actor): Promise<Candidate> {
  const candidate = await getCandidate(id);
  if (!candidate) throw new NotFoundError();
  const updated = await prisma.candidate.update({
    where: { id },
    data: { status, decidedAt: new Date(), decidedBy: actor.email },
  });
  await audit(actor, "candidate.decision", id, { from: candidate.status, to: status });
  return updated;
}
