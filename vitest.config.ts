import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
    globalSetup: ["tests/unit/global-setup.ts"],
    env: { DATABASE_URL: "file:./test.db", AUTH_SECRET: "test-secret-test-secret-test-secret-1234" },
    fileParallelism: false,
  },
});
