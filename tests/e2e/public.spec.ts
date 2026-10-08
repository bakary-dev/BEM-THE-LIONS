import { expect, test } from "@playwright/test";
import { lookupStatus, register, uniqueCandidate } from "./helpers";

test("splash screen puis redirection automatique vers l'accueil", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("splash")).toBeVisible();
  await expect(page.getByTestId("splash").getByRole("heading", { name: "BEM THE LIONS" })).toBeVisible();
  await expect(page.getByText("🏀 Recrutement Basketball")).toBeVisible();
  await expect(page.getByText("2026 — 2027")).toBeVisible();
  await expect(page).toHaveURL(/\/accueil$/, { timeout: 8000 });
});

test("accueil : textes, statistiques et boutons", async ({ page }) => {
  await page.goto("/accueil");
  await expect(page.getByRole("heading", { level: 1, name: "BEM THE LIONS" })).toBeVisible();
  await expect(page.getByText("Recrutement Basketball — 2026-2027")).toBeVisible();
  await expect(page.getByText("Prêt à rejoindre la meute ? 🦁").first()).toBeVisible();
  const stats = page.getByLabel("Statistiques de l'équipe");
  await stats.scrollIntoViewIfNeeded();
  await expect(stats.getByLabel("+5")).toBeVisible();
  await expect(stats.getByLabel("+6")).toBeVisible();
  await expect(stats.getByText("2025-2026")).toBeVisible();
  await expect(page.getByText("L'inscription ne garantit pas la sélection dans l'équipe.")).toBeVisible();
  await page.getByRole("link", { name: "🏀 Commencer mon inscription" }).click();
  await expect(page).toHaveURL(/\/inscription$/);
  await page.goto("/accueil");
  await page.getByRole("link", { name: "J'ai déjà un numéro candidat" }).click();
  await expect(page).toHaveURL(/\/statut$/);
});

test("inscription : validation des champs obligatoires", async ({ page }) => {
  await page.goto("/inscription");
  await page.getByRole("button", { name: /envoyer ma candidature/i }).click();
  await expect(page.getByText("Le nom doit contenir au moins 2 caractères")).toBeVisible();
  await expect(page.getByText("Le genre est obligatoire")).toBeVisible();
  await expect(page.getByText("L'année d'étude est obligatoire")).toBeVisible();
  await expect(page.getByText("Vous devez accepter l'utilisation de vos informations")).toBeVisible();
  await page.locator("#email").fill("pas-un-email");
  await page.locator("#phone").fill("123");
  await page.getByRole("button", { name: /envoyer ma candidature/i }).click();
  await expect(page.getByText("Adresse email invalide")).toBeVisible();
  await expect(page.getByText(/Numéro invalide/)).toBeVisible();
});

test("inscription complète : numéro, QR Code, téléchargement, doublon, statut", async ({ page }) => {
  const c = uniqueCandidate("Kanga");
  const number = await register(page, c);
  await expect(page.getByText("INSCRIPTION RÉUSSIE ✅")).toBeVisible();
  await expect(page.getByText(`Félicitations ${c.lastName} ${c.firstName}, votre candidature pour le recrutement BEM THE LIONS 2026-2027 a bien été enregistrée.`)).toBeVisible();
  await expect(page.getByText("Conservez précieusement votre numéro candidat et votre QR Code.")).toBeVisible();
  const card = page.getByTestId("candidate-card");
  await expect(card.getByTestId("card-number")).toHaveText(number);
  await expect(card.getByText("Présentez ce QR Code le jour de la sélection.")).toBeVisible();
  await expect(page.getByTestId("qr-image")).toHaveAttribute("src", /^data:image\/png;base64,/);

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "⬇️ QR Code" }).click();
  expect((await download).suggestedFilename()).toBe(`${number}-qr-code.png`);
  const cardDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "⬇️ Carte complète" }).click();
  expect((await cardDownload).suggestedFilename()).toBe(`${number}-carte-candidat.png`);

  // Doublon refusé
  await page.goto("/inscription");
  await page.locator("#lastName").fill("Autre");
  await page.locator("#firstName").fill("Personne");
  await page.getByText("Homme", { exact: true }).click();
  await page.locator("#phone").fill(c.phone);
  await page.locator("#email").fill(c.email);
  await page.locator("#studyYear").selectOption("Licence 1");
  await page.locator("#fieldOfStudy").fill("Finance");
  await page.locator('input[name="consent"]').check();
  await page.getByRole("button", { name: /envoyer ma candidature/i }).click();
  await expect(page.getByTestId("form-error")).toContainText("existe déjà");
  await expect(page.getByText("Cet email est déjà utilisé pour une candidature.")).toBeVisible();

  // Récupération par numéro avant décision : la carte, sans statut intermédiaire
  await lookupStatus(page, number.toLowerCase());
  await expect(page.getByTestId("status-registered")).toBeVisible();
  await expect(page.getByTestId("card-number")).toHaveText(number);
  await expect(page.getByText(/en attente|en cours|liste d'attente|à confirmer/i)).toHaveCount(0);
});

test("statut : numéro inconnu et format invalide", async ({ page }) => {
  await lookupStatus(page, "BEM-2026-9999");
  await expect(page.getByTestId("status-error")).toContainText("Aucune candidature");
  await page.locator("#candidateNumber").fill("ABC");
  await page.getByRole("button", { name: /rechercher mon dossier/i }).click();
  await expect(page.getByTestId("status-error")).toContainText("Format attendu");
});

test("besoin d'aide : contacts, WhatsApp et Appeler", async ({ page }) => {
  await page.goto("/accueil");
  await page.getByRole("link", { name: /Besoin d'aide \? Contacter un responsable/ }).click();
  await expect(page).toHaveURL(/\/aide$/);
  await expect(page.getByRole("heading", { name: "🆘 BESOIN D'AIDE ?" })).toBeVisible();
  await expect(page.getByText("Une question ? Un retard à signaler ? Une absence ou un empêchement ? Contactez directement un responsable de l'équipe.")).toBeVisible();
  const contacts = page.getByTestId("help-contact");
  await expect(contacts).toHaveCount(2);
  await expect(contacts.nth(0)).toContainText("Responsable basketball / Capitaine");
  await expect(contacts.nth(0).getByRole("link", { name: /WhatsApp/ })).toHaveAttribute("href", "https://wa.me/2250700000001");
  await expect(contacts.nth(0).getByRole("link", { name: /Appeler/ })).toHaveAttribute("href", "tel:+2250700000001");
  await expect(contacts.nth(1)).toContainText("Coach basketball");
  await expect(contacts.nth(1).getByRole("link", { name: /Appeler/ })).toHaveAttribute("href", "tel:+2250500000002");
});

test("pas de défilement horizontal", async ({ page }) => {
  for (const path of ["/accueil", "/inscription", "/statut", "/aide"]) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});
