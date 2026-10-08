// Recrée la base e2e jetable (prisma/e2e.db) puis lance le seed.
import { execSync } from "node:child_process";
import { rmSync } from "node:fs";

for (const f of ["prisma/e2e.db", "prisma/e2e.db-journal"]) rmSync(f, { force: true });
const env = { ...process.env, NODE_ENV: "development" };
execSync("npx prisma db push --skip-generate", { env, stdio: "inherit" });
execSync("npx tsx prisma/seed.ts", { env, stdio: "inherit" });
