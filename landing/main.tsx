import { ITThemeProvider } from "@axzydev/axzy_ui_system";
import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import LandingPage from "../src/modules/landing/pages/LandingPage";
import LegalPage from "../src/modules/legal/pages/LegalPage";
import { theme } from "../src/theme/theme";
import "../src/index.css";

if (!localStorage.getItem("it-theme-dark-mode")) {
  localStorage.setItem("it-theme-dark-mode", "light");
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ITThemeProvider theme={theme} showFab={false}>
      <HashRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/legal" element={<LegalPage />} />
          <Route path="/legal/:doc" element={<LegalPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </ITThemeProvider>
  </React.StrictMode>,
);
