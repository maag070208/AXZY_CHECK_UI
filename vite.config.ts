import federation from "@originjs/vite-plugin-federation";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "tailwindcss";
import path from "path";
import { readFileSync, writeFileSync } from "fs";

const pkg = JSON.parse(
  readFileSync(path.resolve(__dirname, "package.json"), "utf-8")
);

const bumpVersion = (current: string): string => {
  const parts = current.split(".");
  const last = parseInt(parts[parts.length - 1] || "0", 10);
  parts[parts.length - 1] = String(isNaN(last) ? 1 : last + 1);
  const next = parts.join(".");
  pkg.version = next;
  writeFileSync(
    path.resolve(__dirname, "package.json"),
    JSON.stringify(pkg, null, 2) + "\n"
  );
  return next;
};

const buildVersion = bumpVersion(pkg.version);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");


  return {
    plugins: [
      react(),
      federation({
        name: "host",
        filename: "remoteEntry.js",
        exposes: {},
        remotes: {
          remoteClients: "http://localhost:5003/assets/remoteEntry.js",
        },
        shared: ["react", "react-dom"],
      }),
    ],
    build: {
      modulePreload: false,
      target: "esnext",
      minify: false,
      cssCodeSplit: false,
    },
    css: {
      postcss: {
        plugins: [tailwindcss()],
      },
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
    define: {
      "import.meta.env.VITE_APP_VERSION": JSON.stringify(buildVersion),
      "import.meta.env.VITE_APP_ENV": JSON.stringify(
        env.VITE_APP_ENV || (mode === "production" ? "PROD" : "DEV")
      ),
    },
  };
});
