import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
// Chromium pré-installé (environnement CI/cloud) si disponible, sinon celui de Playwright.
const executablePath = process.env.PW_CHROMIUM_PATH || undefined;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: "fr-FR",
    trace: "retain-on-failure",
    launchOptions: { executablePath },
  },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 7"], launchOptions: { executablePath } }, testMatch: /public\.spec\.ts/ },
    { name: "desktop", use: { ...devices["Desktop Chrome"], launchOptions: { executablePath } } },
  ],
  webServer: {
    // Base e2e jetable + seed (admin + données fictives), puis serveur de production.
    command: `node tests/e2e/prepare-db.mjs && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/accueil`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DATABASE_URL: "file:./e2e.db",
      AUTH_SECRET: "e2e-secret-e2e-secret-e2e-secret-e2e-123456",
      ADMIN_EMAIL: "admin@e2e.local",
      ADMIN_PASSWORD: "E2eAdminPass!2026",
      ADMIN_NAME: "Admin E2E",
      SEED_DEMO_DATA: "true",
    },
  },
});
