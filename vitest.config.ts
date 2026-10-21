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
      exclude: [
        "src/**/*.d.ts",
        "src/assets/**",
        "src/main.tsx",
        // Solo tipos/interfaces: no generan código en runtime.
        "src/core/types/**",
        // Código muerto: ningún archivo lo importa (verificado). Bórralo en vez de probarlo.
        "src/core/components/StatusBadge.tsx",
        "src/core/hooks/businessLineServiceCatalog.hook.ts",
        "src/core/mappers/QuoteMapper.ts",
        "src/core/utils/currencyFormatter.ts",
        "src/core/utils/dateFormatter.ts",
        "src/hooks/usePaginatedTable.ts",
        "src/hooks/useTableEditing.ts",
        "src/modules/auth/pages/RegisterPage.tsx",
        "src/modules/auth/components/RegisterForm.tsx",
        "src/modules/catalogs/components/GenericCatalogTable.tsx",
        "src/modules/catalogs/components/CatalogCategoryCard.tsx",
        "src/modules/catalogs/components/GenericCatalogCards.tsx",
        "src/modules/catalogs/components/GenericCatalogModal.tsx",
        "src/modules/catalogs/components/TypeFormModal.tsx",
        "src/modules/home/components/tabs/OperationalDetailTab.tsx",
        "src/modules/persons/**",
        "src/watermark.tsx",
      ],
      reporter: ["text-summary", "html", "json-summary", "json"],
      reportsDirectory: "coverage",
    },
  },
});
