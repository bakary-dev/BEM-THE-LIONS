import ExcelJS from "exceljs";
import type { Candidate } from "@prisma/client";
import { genderLabel, isStatus, STATUS_LABELS } from "./constants";

export const EXPORT_COLUMNS = [
  { header: "Numéro candidat", key: "candidateNumber", width: 18 },
  { header: "Nom", key: "lastName", width: 20 },
  { header: "Prénom", key: "firstName", width: 20 },
  { header: "Genre", key: "gender", width: 10 },
  { header: "Année", key: "studyYear", width: 14 },
  { header: "Filière", key: "fieldOfStudy", width: 24 },
  { header: "Téléphone", key: "phone", width: 18 },
  { header: "Email", key: "email", width: 30 },
  { header: "Date d'inscription", key: "registrationDate", width: 20 },
  { header: "Statut", key: "status", width: 14 },
] as const;

type Row = Record<(typeof EXPORT_COLUMNS)[number]["key"], string>;

function formatDate(d: Date): string {
  return d.toLocaleString("fr-FR", { timeZone: "Africa/Abidjan", dateStyle: "short", timeStyle: "short" });
}

export function toExportRow(c: Candidate): Row {
  return {
    candidateNumber: c.candidateNumber,
    lastName: c.lastName,
    firstName: c.firstName,
    gender: genderLabel(c.gender),
    studyYear: c.studyYear,
    fieldOfStudy: c.fieldOfStudy,
    phone: c.phone,
    email: c.email,
    registrationDate: formatDate(c.registrationDate),
    status: isStatus(c.status) ? STATUS_LABELS[c.status] : "",
  };
}

function csvCell(value: string): string {
  // Neutralise les injections de formules dans les tableurs.
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[";\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/** CSV séparé par « ; » (compatible Excel FR) avec BOM UTF-8 pour les accents. */
export function candidatesToCsv(candidates: Candidate[]): string {
  const lines = [EXPORT_COLUMNS.map((c) => csvCell(c.header)).join(";")];
  for (const candidate of candidates) {
    const row = toExportRow(candidate);
    lines.push(EXPORT_COLUMNS.map((c) => csvCell(row[c.key])).join(";"));
  }
  return "﻿" + lines.join("\r\n") + "\r\n";
}

export async function candidatesToXlsx(candidates: Candidate[], season: string): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "BEM THE LIONS";
  workbook.created = new Date();
  const sheet = workbook.addWorksheet(`Candidats ${season}`);
  sheet.columns = EXPORT_COLUMNS.map((c) => ({ header: c.header, key: c.key, width: c.width }));
  sheet.getRow(1).font = { bold: true, color: { argb: "FF000000" } };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5B700" } };
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  for (const candidate of candidates) sheet.addRow(toExportRow(candidate));
  sheet.autoFilter = { from: "A1", to: `J${candidates.length + 1}` };
  return Buffer.from(await workbook.xlsx.writeBuffer());
}
