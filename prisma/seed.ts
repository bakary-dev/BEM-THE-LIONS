/**
 * Seed BEM THE LIONS.
 * - Crée la ligne de paramètres (valeurs par défaut).
 * - Crée le compte administrateur initial depuis ADMIN_EMAIL / ADMIN_PASSWORD (s'il n'existe pas).
 * - SEED_DEMO_DATA=true : ajoute des candidats et contacts FICTIFS (développement uniquement).
 */
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/db";
import { registerCandidate, decide, saveEvaluation, recordScan } from "../src/modules/recruitment/service";
import { registrationSchema } from "../src/modules/recruitment/validation";

async function main() {
  await prisma.settings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.warn("⚠️  ADMIN_EMAIL / ADMIN_PASSWORD non définis : aucun compte admin créé.");
  } else if (password.length < 10) {
    throw new Error("ADMIN_PASSWORD doit contenir au moins 10 caractères.");
  } else if (!(await prisma.adminUser.findUnique({ where: { email } }))) {
    await prisma.adminUser.create({
      data: { email, name: process.env.ADMIN_NAME || "Administrateur", passwordHash: await bcrypt.hash(password, 12), role: "ADMIN" },
    });
    console.log(`✅ Compte administrateur créé : ${email}`);
  }

  if (process.env.SEED_DEMO_DATA !== "true") return;
  if (process.env.NODE_ENV === "production") throw new Error("Données de démonstration interdites en production.");

  console.log("🧪 Données de démonstration (fictives)…");
  await prisma.settings.update({
    where: { id: 1 },
    data: {
      whatsappGroupLink: "https://chat.whatsapp.com/DEMO-LIEN-A-REMPLACER",
      responsibleName: "Capitaine (démo)",
      responsibleWhatsapp: "+2250700000001",
      responsiblePhone: "+2250700000001",
      coachName: "Coach (démo)",
      coachWhatsapp: "+2250500000002",
      coachPhone: "+2250500000002",
    },
  });

  if (!(await prisma.adminUser.findUnique({ where: { email: "evaluateur@bemthelions.local" } }))) {
    await prisma.adminUser.create({
      data: {
        email: "evaluateur@bemthelions.local",
        name: "Évaluateur (démo)",
        passwordHash: await bcrypt.hash("Evaluateur2026!", 12),
        role: "EVALUATOR",
      },
    });
  }

  if ((await prisma.candidate.count()) > 0) {
    console.log("ℹ️  Des candidats existent déjà : pas de nouveaux candidats de démo.");
    return;
  }

  const actor = { id: "seed", email: "seed@bemthelions.local" };
  const people = [
    ["Kouassi", "Aya", "FEMME", "Licence 2", "Marketing", "0701020301"],
    ["Traoré", "Moussa", "HOMME", "Licence 3", "Finance", "0501020302"],
    ["Koné", "Ibrahim", "HOMME", "Master 1", "Management", "0101020303"],
    ["Yao", "Grâce", "FEMME", "Licence 1", "Communication", "0701020304"],
    ["Bamba", "Seydou", "HOMME", "Licence 2", "Informatique", "0501020305"],
    ["N'Guessan", "Marie-Ange", "FEMME", "Master 2", "Ressources humaines", "0701020306"],
    ["Diallo", "Oumar", "HOMME", "Licence 1", "Comptabilité", "0101020307"],
    ["Ouattara", "Fatou", "FEMME", "Licence 3", "Logistique", "0501020308"],
  ] as const;

  const created = [];
  for (const [lastName, firstName, gender, studyYear, fieldOfStudy, phone] of people) {
    const input = registrationSchema.parse({
      lastName, firstName, gender, studyYear, fieldOfStudy, phone,
      email: `${firstName}.${lastName}`.toLowerCase().normalize("NFD").replace(/[^a-z.]/g, "") + "@demo.local",
      consent: true,
    });
    created.push(await registerCandidate(input));
  }

  const score = (n: number) => ({
    technique: n, tir: n, dribble: n, passe: n, defense: n, physique: n, comprehension: n, espritEquipe: n, motivation: n,
  });
  await recordScan(created[0].id);
  await saveEvaluation(created[0].id, { scores: score(8), notes: "Démo : bonne lecture du jeu." }, actor);
  await decide(created[0].id, "RETENU", actor);
  await recordScan(created[1].id);
  await saveEvaluation(created[1].id, { scores: score(4), notes: "Démo." }, actor);
  await decide(created[1].id, "NON_RETENU", actor);
  await recordScan(created[2].id);

  console.log(`✅ ${created.length} candidats fictifs créés (${created[0].candidateNumber} RETENU, ${created[1].candidateNumber} NON RETENU).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
