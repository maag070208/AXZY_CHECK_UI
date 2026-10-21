import store from "@app/core/store/store";
import { logout, setAuth } from "@app/core/store/auth/auth.slice";
import ToastProvider from "@app/providers/toast.provider";
import { theme } from "@app/theme/theme";
import { ITThemeProvider } from "@axzydev/axzy_ui_system";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import App from "@app/App";

const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, "");

/** JWT sin firma válida: la WEB solo decodifica el payload y revisa `exp`. */
export const makeToken = (payload: Record<string, unknown> = {}) =>
  `${b64({ alg: "none", typ: "JWT" })}.${b64({
    id: 1,
    name: "Admin",
    email: "admin@check.app",
    role: "ADMIN",
    exp: Math.floor(Date.now() / 1000) + 3600,
    ...payload,
  })}.sig`;

export function renderWithProviders(ui: ReactElement, { route = "/", role }: { route?: string; role?: string } = {}) {
  if (role) store.dispatch(setAuth(makeToken({ role })));
  return {
    user: userEvent.setup(),
    ...render(
      <Provider store={store}>
        <ITThemeProvider theme={theme} showFab={false} density={0.9} appearance="flat">
          <ToastProvider>
            <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
          </ToastProvider>
        </ITThemeProvider>
      </Provider>,
    ),
  };
}

/** Monta la app completa. Con `role` entra ya autenticado (token en localStorage como en producción). */
export function renderApp({ route = "/", role }: { route?: string; role?: string } = {}) {
  store.dispatch(logout());
  localStorage.removeItem("token");
  if (role) localStorage.setItem("token", makeToken({ role }));
  return renderWithProviders(<App />, { route });
}
