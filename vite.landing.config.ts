import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { defineConfig } from "vite";

// Build independiente de la landing. No incluye el panel de administración
// ni la federación de módulos: genera solo dist-landing para publicar aparte.
export default defineConfig({
  root: path.resolve(__dirname, "landing"),
  publicDir: path.resolve(__dirname, "public"),
  base: "./",
  plugins: [tailwindcss(), react()],
  server: {
    port: 5004,
    strictPort: true,
  },
  preview: {
    port: 5004,
    strictPort: true,
  },
  build: {
    outDir: path.resolve(__dirname, "dist-landing"),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@app": path.resolve(__dirname, "./src"),
      "@core": path.resolve(__dirname, "./src/core"),
      "@assets": path.resolve(__dirname, "./src/assets"),
      "@types": path.resolve(__dirname, "./src/core/types"),
      "@modules": path.resolve(__dirname, "./src/modules"),
    },
  },
});
