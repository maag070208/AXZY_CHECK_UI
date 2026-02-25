import store from "@core/store/store";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { HashRouter } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";
import ToastProvider from "./providers/toast.provider.tsx";
import React from "react";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { ITThemeProvider } from "@axzydev/axzy_ui_system";
import { theme } from "./theme/theme.ts";

dayjs.locale("es");


createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
  <Provider store={store}>
    <ITThemeProvider theme={theme}>
    <ToastProvider>
      <HashRouter>
        <App />
      </HashRouter>
    </ToastProvider>
    </ITThemeProvider>
  </Provider>
  </React.StrictMode>
);
