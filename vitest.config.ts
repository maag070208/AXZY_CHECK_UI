import react from "@vitejs/plugin-react-swc";
import path from "path";
import { defineConfig } from "vitest/config";

const alias = {
  "@app": path.resolve(__dirname, "./src"),
  "@core": path.resolve(__dirname, "./src/core"),
  "@assets": path.resolve(__dirname, "./src/assets"),
  "@types": path.resolve(__dirname, "./src/core/types"),
  "@modules": path.resolve(__dirname, "./src/modules"),
};

/**
 * Pruebas rápidas (sin navegador): jsdom + Testing Library + MSW.
 *  - unit:  funciones, hooks, slices, servicios y componentes aislados (tests/unit).
 *  - flows: flujos de usuario completos montando <App/> contra una API simulada con MSW (tests/flows).
 * `pnpm test:unit` y `pnpm test:e2e` miden cobertura por separado; `pnpm test` corre ambos.
 */
const common = {
  environment: "jsdom",
  setupFiles: ["./tests/setup.ts"],
  css: false,
  env: { VITE_BASE_URL: "http://api.test/api/v1" },
  restoreMocks: true,
};

export default defineConfig({
  plugins: [react()],
  resolve: { alias },
  test: {
    projects: [
      {
        extends: true,
        test: { ...common, name: "unit", include: ["tests/unit/**/*.test.{ts,tsx}"] },
      },
      {
        extends: true,
        test: { ...common, name: "flows", include: ["tests/flows/**/*.test.{ts,tsx}"], testTimeout: 15_000 },
      },
    ],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.d.ts", "src/assets/**", "src/main.tsx", "src/vite-env.d.ts"],
      reporter: ["text-summary", "html", "json-summary"],
      reportsDirectory: "coverage",
    },
  },
});
