import { execSync } from "child_process";
import path from "path";

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL ?? "postgresql://postgres:test@localhost:55433/checkapp_test";

/**
 * Misma salvaguarda que las pruebas de la API: solo una base local con nombre *_test.
 * Nunca se resetea una base de Railway o de producción.
 */
const assertSafe = (url: string) => {
  const parsed = new URL(url);
  const local = ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname);
  const dbName = parsed.pathname.replace(/^\//, "");
  if (!local || !dbName.endsWith("_test")) {
    throw new Error(`E2E se niega a resetear "${dbName}" en ${parsed.hostname}: debe ser local y terminar en _test`);
  }
};

export default async function globalSetup() {
  assertSafe(TEST_DATABASE_URL);
  const api = path.resolve(process.cwd(), "../API");
  const env = { ...process.env, DATABASE_URL: TEST_DATABASE_URL, PRISMA_HIDE_UPDATE_MESSAGE: "1" } as Record<string, string>;
  execSync("pnpm exec prisma migrate reset --force --skip-seed --skip-generate", { cwd: api, env, stdio: "inherit" });
  execSync("pnpm exec prisma db seed", { cwd: api, env: { ...env, SEED_DEMO: "true" }, stdio: "inherit" });
}
