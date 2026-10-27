import store from "@core/store/store";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { HashRouter } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";
import "blobatar/motion.css";
import ToastProvider from "./providers/toast.provider.tsx";
import React from "react";
import dayjs from "dayjs";
import "dayjs/locale/es";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { RoleThemeProvider } from "./theme/RoleThemeProvider.tsx";

if (!localStorage.getItem("it-theme-dark-mode")) {
  localStorage.setItem("it-theme-dark-mode", "light");
}

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("es");


createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
  <Provider store={store}>
    <RoleThemeProvider>
      <ToastProvider>
        <HashRouter>
          <App />
        </HashRouter>
      </ToastProvider>
    </RoleThemeProvider>
  </Provider>
  </React.StrictMode>
);
