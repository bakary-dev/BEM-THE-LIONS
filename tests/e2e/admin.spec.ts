import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import ExcelJS from "exceljs";
import { ADMIN, EVALUATOR, login, lookupStatus, register, uniqueCandidate } from "./helpers";

test.describe.configure({ mode: "serial" });

let page: Page;
let retenuNumber: string;
let nonRetenuNumber: string;
const retenu = uniqueCandidate("Lionel");
const nonRetenu = uniqueCandidate("Dossou");

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();
  retenuNumber = await register(page, retenu);
  nonRetenuNumber = await register(page, nonRetenu);
});
test.afterAll(() => page.close());

test("routes protégées sans connexion", async ({ request }) => {
  await page.goto("/admin/candidats");
  await expect(page).toHaveURL(/\/admin\/login$/);
  expect((await request.get("/api/admin/export?format=csv")).status()).toBe(401);
  expect((await request.post("/api/admin/lookup", { data: { code: retenuNumber } })).status()).toBe(401);
});

test("connexion : refus puis succès", async () => {
  await page.goto("/admin/login");
  await page.locator("#email").fill(ADMIN.email);
  await page.locator("#password").fill("mauvais-mot-de-passe");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page.getByText("Email ou mot de passe incorrect")).toBeVisible();
  await login(page);
  await expect(page.getByTestId("dashboard-stats")).toContainText("Candidats inscrits");
  await expect(page.getByTestId("dashboard-stats")).toContainText("Candidats scannés");
});

test("liste : recherche, filtre et tri", async () => {
  await page.goto("/admin/candidats");
  await expect(page.getByTestId("candidates-table")).toBeVisible();
  await page.getByLabel("Rechercher").fill(retenu.lastName);
  await page.getByRole("button", { name: "Appliquer" }).click();
  await expect(page.getByTestId("candidates-count")).toHaveText("1 résultat(s)");
  await expect(page.getByTestId("candidates-table")).toContainText(retenuNumber);

  await page.goto("/admin/candidats?status=RETENU");
  await expect(page.getByTestId("candidates-table")).toContainText("BEM-2026-0001");
  await expect(page.getByTestId("candidates-table")).not.toContainText(retenuNumber);

  await page.goto("/admin/candidats?sort=lastName&dir=asc");
  const firstName = await page.locator("tbody tr").first().locator("td").nth(1).textContent();
  expect(firstName).toBe("Bamba");
});

test("scanner : candidat inexistant puis candidat vérifié → évaluation", async () => {
  await page.goto("/admin/scanner");
  await expect(page.getByRole("heading", { name: "SCANNER UN CANDIDAT" })).toBeVisible();
  await expect(page.getByTestId("start-scan")).toBeVisible();

  await page.locator("#manual-code").fill("BEM-2026-9999");
  await page.getByRole("button", { name: "Vérifier" }).click();
  await expect(page.getByTestId("scan-not-found")).toContainText("❌ CANDIDATURE INTROUVABLE");
  await expect(page.getByTestId("scan-not-found")).toContainText("Cette personne n'est pas enregistrée dans la base de recrutement BEM THE LIONS.");

  await page.locator("#manual-code").fill(retenuNumber);
  await page.getByRole("button", { name: "Vérifier" }).click();
  const verified = page.getByTestId("scan-verified");
  await expect(verified).toContainText("✅ CANDIDAT VÉRIFIÉ");
  for (const text of [retenu.lastName, retenu.firstName, "Femme", "Licence 2", retenu.field, retenu.email, retenuNumber, "Aucune décision"]) {
    await expect(verified).toContainText(text);
  }
  await page.getByTestId("open-evaluation").click();
  await expect(page.getByText("✅ CANDIDAT VÉRIFIÉ")).toBeVisible();
  await expect(page.getByTestId("candidate-name")).toHaveText(`${retenu.lastName} ${retenu.firstName}`);
});

test("évaluation : notes et observations enregistrées", async () => {
  const form = page.getByTestId("evaluation-form");
  await form.locator("#score-technique").fill("9");
  await form.locator("#score-motivation").fill("10");
  await form.locator("#notes").fill("Très bon placement défensif.");
  await form.getByRole("button", { name: "Enregistrer l'évaluation" }).click();
  await expect(form.getByText("✅ Évaluation enregistrée")).toBeVisible();
  await page.reload();
  await expect(page.locator("#score-technique")).toHaveValue("9");
  await expect(page.locator("#notes")).toHaveValue("Très bon placement défensif.");
  await expect(page.getByText(/Dernière : .* par admin@e2e.local/)).toBeVisible();
});

test("décision RETENU avec confirmation", async () => {
  const panel = page.getByTestId("decision-panel");
  await panel.getByRole("button", { name: "🟢 RETENU" }).click();
  await expect(page.getByRole("dialog")).toContainText("Confirmer la décision");
  await page.getByRole("button", { name: "Annuler" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await panel.getByRole("button", { name: "🟢 RETENU" }).click();
  await page.getByTestId("confirm-decision").click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("header").getByText("🟢 RETENU")).toBeVisible();
});

test("décision NON RETENU sur un autre candidat", async () => {
  await page.goto(`/admin/candidats?q=${nonRetenuNumber}`);
  await page.getByRole("link", { name: "Consulter →" }).click();
  await page.getByTestId("decision-panel").getByRole("button", { name: "🔴 NON RETENU" }).click();
  await page.getByTestId("confirm-decision").click();
  await expect(page.locator("header").getByText("🔴 NON RETENU")).toBeVisible();
});

test("export CSV et Excel", async () => {
  await page.goto("/admin/candidats");
  const csvDl = page.waitForEvent("download");
  await page.getByTestId("export-csv").click();
  const csvPath = await (await csvDl).path();
  const csv = readFileSync(csvPath!, "utf8");
  expect(csv).toContain("Numéro candidat;Nom;Prénom;Genre;Année;Filière;Téléphone;Email;Date d'inscription;Statut");
  expect(csv).toMatch(new RegExp(`${retenuNumber};${retenu.lastName};.*;RETENU`));
  expect(csv).toMatch(new RegExp(`${nonRetenuNumber};${nonRetenu.lastName};.*;NON RETENU`));

  const xlsxDl = page.waitForEvent("download");
  await page.getByTestId("export-xlsx").click();
  const dl = await xlsxDl;
  expect(dl.suggestedFilename()).toMatch(/\.xlsx$/);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile((await dl.path())!);
  const values = wb.worksheets[0].getSheetValues().flat().map(String);
  expect(values).toContain(retenuNumber);
});

test("paramètres : modification répercutée sur l'accueil et la page RETENU", async () => {
  await page.goto("/admin/parametres");
  await page.locator("#s-winsCount").fill("9");
  await page.locator("#s-whatsappGroupLink").fill("https://chat.whatsapp.com/E2EGROUPE");
  await page.locator("#s-coachName").fill("Coach Konan");
  await page.getByRole("button", { name: "Enregistrer les paramètres" }).click();
  await expect(page.getByText("✅ Paramètres enregistrés")).toBeVisible();

  await page.goto("/accueil");
  await expect(page.getByLabel("Statistiques de l'équipe").getByLabel("+9")).toBeVisible();

  // Restaure la valeur par défaut pour les autres tests.
  await page.goto("/admin/parametres");
  await page.locator("#s-winsCount").fill("6");
  await page.getByRole("button", { name: "Enregistrer les paramètres" }).click();
  await expect(page.getByText("✅ Paramètres enregistrés")).toBeVisible();
});

test("page RETENU : félicitations, WhatsApp et contacts", async () => {
  await lookupStatus(page, retenuNumber);
  const view = page.getByTestId("status-retenu");
  await expect(view.getByRole("heading", { name: `🎉 FÉLICITATIONS ${retenu.lastName} ${retenu.firstName} !` })).toBeVisible();
  await expect(view).toContainText(
    "Vous avez été retenu(e) et êtes désormais membre de l'équipe de basketball BEM THE LIONS – Abidjan, pour l'année académique 2026-2027.",
  );
  await expect(view).toContainText("BIENVENUE DANS L'ÉQUIPE ! 🦁🏀");
  await expect(view).toContainText("REJOIGNEZ LE GROUPE WHATSAPP OFFICIEL");
  await expect(view.getByTestId("whatsapp-group")).toHaveText("🟢 REJOINDRE LE GROUPE WHATSAPP");
  await expect(view.getByTestId("whatsapp-group")).toHaveAttribute("href", "https://chat.whatsapp.com/E2EGROUPE");
  await expect(view).toContainText("🆘 BESOIN D'AIDE ?");
  await expect(view.getByTestId("help-contact").nth(1)).toContainText("Coach Konan");
  await expect(view.getByRole("link", { name: /Appeler/ }).first()).toHaveAttribute("href", /^tel:\+225/);
  await expect(view.getByRole("link", { name: /WhatsApp/ }).nth(1)).toHaveAttribute("href", /^https:\/\/wa\.me\/225/);
  // Aucune donnée d'évaluation exposée
  await expect(page.getByText("Très bon placement défensif.")).toHaveCount(0);
});

test("page NON RETENU : message unique, sans notes ni raison", async () => {
  await lookupStatus(page, nonRetenuNumber);
  const view = page.getByTestId("status-non-retenu");
  await expect(view).toBeVisible();
  await expect(view.locator("p")).toHaveText(`Désolé ${nonRetenu.lastName} ${nonRetenu.firstName}, vous n'avez pas été retenu.`);
  await expect(page.getByText(/note|commentaire|classement|raison/i)).toHaveCount(0);
});

test("évaluateur : pas de décision ni paramètres", async ({ browser }) => {
  const ctx = await browser.newContext();
  const p = await ctx.newPage();
  await login(p, EVALUATOR);
  await expect(p.getByRole("link", { name: /Paramètres/ })).toHaveCount(0);
  await p.goto("/admin/candidats");
  await p.getByRole("link", { name: "Consulter →" }).first().click();
  await expect(p.getByText("Seul un administrateur peut prendre la décision finale.")).toBeVisible();
  const id = p.url().split("/").pop();
  const res = await p.request.post(`/api/admin/candidates/${id}/decision`, { data: { status: "RETENU", confirm: true } });
  expect(res.status()).toBe(403);
  const settings = await p.request.put("/api/admin/settings", { data: {} });
  expect(settings.status()).toBe(403);
  await ctx.close();
});

test("déconnexion", async () => {
  await page.goto("/admin");
  await page.getByRole("button", { name: "Déconnexion" }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);
});
