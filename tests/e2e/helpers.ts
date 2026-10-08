import { expect, type Page } from "@playwright/test";

export const ADMIN = { email: "admin@e2e.local", password: "E2eAdminPass!2026" };
export const EVALUATOR = { email: "evaluateur@bemthelions.local", password: "Evaluateur2026!" };

let counter = Date.now() % 1_000_000;
/** Candidat unique (téléphone/email) pour chaque test. */
export function uniqueCandidate(lastName = "Testeur") {
  counter++;
  const n = String(counter).padStart(8, "0").slice(-8);
  return { lastName, firstName: "Aya", phone: `07${n}`, email: `e2e.${n}@test.local`, field: "Marketing" };
}

export async function register(page: Page, c: ReturnType<typeof uniqueCandidate>): Promise<string> {
  await page.goto("/inscription");
  await page.getByLabel("Nom", { exact: false }).first().fill(c.lastName);
  await page.locator("#firstName").fill(c.firstName);
  await page.getByText("Femme", { exact: true }).click();
  await page.locator("#phone").fill(c.phone);
  await page.locator("#email").fill(c.email);
  await page.locator("#studyYear").selectOption("Licence 2");
  await page.locator("#fieldOfStudy").fill(c.field);
  await page.locator('input[name="consent"]').check();
  await page.getByRole("button", { name: /envoyer ma candidature/i }).click();
  await expect(page.getByTestId("registration-success")).toBeVisible();
  const number = (await page.getByTestId("candidate-number").textContent())!.trim();
  expect(number).toMatch(/^BEM-2026-\d{4}$/);
  return number;
}

export async function login(page: Page, creds = ADMIN) {
  await page.goto("/admin/login");
  await page.locator("#email").fill(creds.email);
  await page.locator("#password").fill(creds.password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

export async function lookupStatus(page: Page, number: string) {
  await page.goto("/statut");
  await page.locator("#candidateNumber").fill(number);
  await page.getByRole("button", { name: /rechercher mon dossier/i }).click();
}
