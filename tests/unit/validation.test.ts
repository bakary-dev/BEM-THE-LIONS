import { describe, expect, it } from "vitest";
import { normalizePhone, registrationSchema } from "@/modules/recruitment/validation";
import { formatCandidateNumber, parseCandidateNumber } from "@/modules/recruitment/candidate-number";
import { telLink, whatsappLink } from "@/lib/contact";
import { evaluationSchema, averageScore } from "@/modules/recruitment/evaluation";
import { settingsSchema } from "@/lib/settings-schema";

const valid = {
  lastName: "  Kouassi ",
  firstName: "Aya",
  gender: "FEMME",
  phone: "07 01 02 03 04",
  email: " Aya.Kouassi@Email.com ",
  studyYear: "Licence 2",
  fieldOfStudy: "Marketing",
  consent: true,
};

describe("numéro candidat", () => {
  it("formate BEM-2026-0001", () => {
    expect(formatCandidateNumber(1)).toBe("BEM-2026-0001");
    expect(formatCandidateNumber(47)).toBe("BEM-2026-0047");
    expect(formatCandidateNumber(12345)).toBe("BEM-2026-12345");
  });
  it("normalise les saisies", () => {
    expect(parseCandidateNumber("bem-2026-47")).toBe("BEM-2026-0047");
    expect(parseCandidateNumber(" BEM 2026 0047 ")).toBe("BEM-2026-0047");
    expect(parseCandidateNumber("BEM-2026-0000")).toBeNull();
    expect(parseCandidateNumber("XYZ-2026-0001")).toBeNull();
    expect(parseCandidateNumber("https://evil.example")).toBeNull();
  });
});

describe("téléphone", () => {
  it("accepte les numéros ivoiriens", () => {
    expect(normalizePhone("07 01 02 03 04")).toBe("+2250701020304");
    expect(normalizePhone("+225 05 01 02 03 04")).toBe("+2250501020304");
    expect(normalizePhone("00225 0101020304")).toBe("+2250101020304");
    expect(normalizePhone("27 22 00 00 00")).toBe("+2252722000000");
  });
  it("accepte l'international et refuse l'invalide", () => {
    expect(normalizePhone("+33 6 12 34 56 78")).toBe("+33612345678");
    expect(normalizePhone("12345")).toBeNull();
    expect(normalizePhone("0801020304")).toBeNull();
    expect(normalizePhone("+225 12")).toBeNull();
    expect(normalizePhone("abc")).toBeNull();
  });
  it("génère les liens WhatsApp et tel:", () => {
    expect(whatsappLink("+225 07 00 00 00 01")).toBe("https://wa.me/2250700000001");
    expect(whatsappLink("0700000001")).toBe("https://wa.me/2250700000001");
    expect(telLink("+2250700000001")).toBe("tel:+2250700000001");
    expect(whatsappLink("")).toBeNull();
  });
});

describe("formulaire d'inscription", () => {
  it("valide et normalise", () => {
    const r = registrationSchema.parse(valid);
    expect(r.lastName).toBe("Kouassi");
    expect(r.email).toBe("aya.kouassi@email.com");
    expect(r.phone).toBe("+2250701020304");
  });
  it("exige tous les champs", () => {
    const r = registrationSchema.safeParse({});
    expect(r.success).toBe(false);
    const paths = new Set(r.error!.issues.map((i) => i.path[0]));
    for (const f of ["lastName", "firstName", "gender", "phone", "email", "studyYear", "fieldOfStudy", "consent"]) expect(paths).toContain(f);
  });
  it("refuse email, téléphone, genre invalides et consentement absent", () => {
    expect(registrationSchema.safeParse({ ...valid, email: "pas-un-email" }).success).toBe(false);
    expect(registrationSchema.safeParse({ ...valid, phone: "123" }).success).toBe(false);
    expect(registrationSchema.safeParse({ ...valid, gender: "AUTRE" }).success).toBe(false);
    expect(registrationSchema.safeParse({ ...valid, consent: false }).success).toBe(false);
    expect(registrationSchema.safeParse({ ...valid, lastName: "<script>" }).success).toBe(false);
  });
});

describe("évaluation et paramètres", () => {
  const scores = { technique: 8, tir: 7, dribble: 6, passe: 9, defense: 5, physique: 7, comprehension: 8, espritEquipe: 10, motivation: 9 };
  it("valide les notes 0-10", () => {
    expect(evaluationSchema.safeParse({ scores }).success).toBe(true);
    expect(evaluationSchema.safeParse({ scores: { ...scores, tir: 11 } }).success).toBe(false);
    expect(evaluationSchema.safeParse({ scores: { ...scores, tir: undefined } }).success).toBe(false);
    expect(averageScore(scores)).toBe(7.7);
  });
  it("valide le lien WhatsApp du groupe", () => {
    const base = {
      teamName: "BEM THE LIONS", city: "Abidjan", season: "2026-2027", teamMembersCount: 5, winsCount: 6, lossesCount: 4,
      previousSeason: "2025-2026", whatsappGroupLink: "https://chat.whatsapp.com/abc", responsibleName: "", responsibleWhatsapp: "",
      responsiblePhone: "", coachName: "", coachWhatsapp: "", coachPhone: "",
    };
    expect(settingsSchema.safeParse(base).success).toBe(true);
    expect(settingsSchema.safeParse({ ...base, whatsappGroupLink: "javascript:alert(1)" }).success).toBe(false);
    expect(settingsSchema.safeParse({ ...base, winsCount: -1 }).success).toBe(false);
  });
});
