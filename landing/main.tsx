import { ITThemeProvider } from "@axzydev/axzy_ui_system";
import React from "react";
import { createRoot } from "react-dom/client";
import LandingPage from "../src/modules/landing/pages/LandingPage";
import { theme } from "../src/theme/theme";
import "../src/index.css";

if (!localStorage.getItem("it-theme-dark-mode")) {
  localStorage.setItem("it-theme-dark-mode", "light");
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ITThemeProvider theme={theme} showFab={false}>
      <LandingPage />
    </ITThemeProvider>
  </React.StrictMode>,
);
