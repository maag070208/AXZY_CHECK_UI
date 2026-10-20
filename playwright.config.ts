import { defineConfig, devices } from "@playwright/test";

/**
 * E2E de la WEB (F9-T7). Levanta la API contra la base de PRUEBAS local (nunca la de Railway)
 * y sirve el build de producción de la WEB. Antes de correr: `pnpm run build:prod`.
 */
const API_DIR = "../API";
// Puerto propio: el 5002 suele estar ocupado por el servidor de desarrollo.
const WEB_PORT = Number(process.env.E2E_WEB_PORT ?? 5012);
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL ?? "postgresql://postgres:test@localhost:55433/checkapp_test";

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "pnpm exec ts-node -r tsconfig-paths/register ./src/index.ts",
      cwd: API_DIR,
      url: "http://localhost:4444/health",
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        ...process.env,
        DATABASE_URL: TEST_DATABASE_URL,
        APP_SECRET: process.env.APP_SECRET_TEST ?? "e2e-only-secret-do-not-use-in-production",
        CORS_ORIGINS: `http://localhost:${WEB_PORT}`,
        NODE_ENV: "test",
      } as Record<string, string>,
    },
    {
      // Build con modo e2e (.env.e2e → API local). Nunca con build:prod: ese modo embebe la API de producción.
      command: `pnpm run e2e:build && pnpm exec vite preview --port ${WEB_PORT} --strictPort`,
      url: `http://localhost:${WEB_PORT}`,
      reuseExistingServer: false,
      timeout: 180_000,
    },
  ],
});
