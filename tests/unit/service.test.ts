import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { registrationSchema } from "@/modules/recruitment/validation";
import {
  DuplicateCandidateError,
  decide,
  getDashboardStats,
  getPublicStatus,
  listCandidates,
  recordScan,
  registerCandidate,
  saveEvaluation,
  updateCandidate,
} from "@/modules/recruitment/service";
import { candidatesToCsv, candidatesToXlsx } from "@/modules/recruitment/export";
import ExcelJS from "exceljs";

const actor = { id: "test", email: "admin@test.local" };
let seq = 0;
function input(over: Record<string, unknown> = {}) {
  seq++;
  return registrationSchema.parse({
    lastName: "Kouassi",
    firstName: `Aya${String.fromCharCode(96 + seq)}`,
    gender: "FEMME",
    phone: `07010203${String(seq).padStart(2, "0")}`,
    email: `candidat${seq}@test.local`,
    studyYear: "Licence 2",
    fieldOfStudy: "Marketing",
    consent: true,
    ...over,
  });
}

beforeEach(async () => {
  await prisma.auditLog.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.counter.deleteMany();
  await prisma.settings.deleteMany();
});
afterAll(() => prisma.$disconnect());

describe("inscription", () => {
  it("crée des numéros séquentiels uniques et un QR Code", async () => {
    const a = await registerCandidate(input());
    const b = await registerCandidate(input());
    expect(a.candidateNumber).toBe("BEM-2026-0001");
    expect(b.candidateNumber).toBe("BEM-2026-0002");
    expect(a.qrCode).toBe(a.candidateNumber);
    expect(a.status).toBeNull();
  });

  it("reste unique sous inscriptions concurrentes", async () => {
    const results = await Promise.all(Array.from({ length: 8 }, () => registerCandidate(input())));
    const numbers = new Set(results.map((r) => r.candidateNumber));
    expect(numbers.size).toBe(8);
  });

  it("refuse les doublons d'email et de téléphone", async () => {
    const first = input();
    await registerCandidate(first);
    await expect(registerCandidate({ ...input(), email: first.email })).rejects.toBeInstanceOf(DuplicateCandidateError);
    await expect(registerCandidate({ ...input(), phone: first.phone })).rejects.toMatchObject({ fields: { phone: expect.any(String) } });
    expect(await prisma.candidate.count()).toBe(1);
  });
});

describe("statut public", () => {
  it("retourne la carte, RETENU ou NON_RETENU sans données sensibles", async () => {
    const c = await registerCandidate(input());
    await saveEvaluation(c.id, { scores: { technique: 1, tir: 1, dribble: 1, passe: 1, defense: 1, physique: 1, comprehension: 1, espritEquipe: 1, motivation: 1 }, notes: "secret" }, actor);

    const registered = await getPublicStatus("bem-2026-1");
    expect(registered.kind).toBe("REGISTERED");

    await decide(c.id, "RETENU", actor);
    const retenu = await getPublicStatus(c.candidateNumber);
    expect(retenu).toMatchObject({ kind: "RETENU", lastName: "Kouassi" });
    expect(JSON.stringify(retenu)).not.toMatch(/secret|evaluation|phone|email/);

    await decide(c.id, "NON_RETENU", actor);
    const non = await getPublicStatus(c.candidateNumber);
    expect(non).toEqual({ kind: "NON_RETENU", firstName: c.firstName, lastName: "Kouassi" });

    expect((await getPublicStatus("BEM-2026-9999")).kind).toBe("NOT_FOUND");
  });
});

describe("administration", () => {
  it("recherche, filtre, trie, scanne, évalue et décide", async () => {
    const a = await registerCandidate(input({ lastName: "Traoré", gender: "HOMME" }));
    const b = await registerCandidate(input({ lastName: "Bamba", studyYear: "Master 1" }));
    expect((await listCandidates({ q: "traor" })).map((c) => c.id)).toEqual([a.id]);
    expect((await listCandidates({ q: "bem-2026-2" })).map((c) => c.id)).toEqual([b.id]);
    expect((await listCandidates({ gender: "HOMME" })).length).toBe(1);
    expect((await listCandidates({ sort: "lastName" }))[0].id).toBe(b.id);

    await recordScan(a.id);
    const scanned = await recordScan(a.id);
    expect(scanned.scanCount).toBe(2);
    expect((await listCandidates({ scanned: "yes" })).length).toBe(1);

    await decide(a.id, "RETENU", actor);
    expect((await listCandidates({ status: "RETENU" })).length).toBe(1);
    expect((await listCandidates({ status: "NONE" })).length).toBe(1);

    const stats = await getDashboardStats();
    expect(stats).toMatchObject({ total: 2, retenus: 1, nonRetenus: 0, scanned: 1, undecided: 1 });
    expect(await prisma.auditLog.count({ where: { action: "candidate.decision" } })).toBe(1);
  });

  it("modifie un candidat en empêchant les doublons", async () => {
    const a = await registerCandidate(input());
    const b = await registerCandidate(input());
    const { consent: _c, ...fields } = input();
    void _c;
    await expect(updateCandidate(b.id, { ...fields, email: a.email }, actor)).rejects.toBeInstanceOf(DuplicateCandidateError);
    const updated = await updateCandidate(b.id, { ...fields, fieldOfStudy: "Finance" }, actor);
    expect(updated.fieldOfStudy).toBe("Finance");
  });
});

describe("exports", () => {
  it("génère CSV et Excel avec les bonnes colonnes", async () => {
    const c = await registerCandidate(input({ fieldOfStudy: "=HYPERLINK(evil)" }));
    await decide(c.id, "NON_RETENU", actor);
    const rows = await listCandidates();
    const csv = candidatesToCsv(rows);
    const [header, line] = csv.replace("﻿", "").split("\r\n");
    expect(header).toBe("Numéro candidat;Nom;Prénom;Genre;Année;Filière;Téléphone;Email;Date d'inscription;Statut");
    expect(line).toContain("BEM-2026-0001;Kouassi");
    expect(line).toContain("NON RETENU");
    expect(line).toContain("'=HYPERLINK(evil)");

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load((await candidatesToXlsx(rows, "2026-2027")) as unknown as ArrayBuffer);
    const sheet = wb.worksheets[0];
    expect(sheet.getRow(1).getCell(1).value).toBe("Numéro candidat");
    expect(sheet.getRow(2).getCell(1).value).toBe("BEM-2026-0001");
    expect(sheet.getRow(2).getCell(10).value).toBe("NON RETENU");
  });
});
