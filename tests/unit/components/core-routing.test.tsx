import { act, renderHook, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { NAVBAR_LOGO, Navbar, SIDEBAR_LOGO, useNavigationItems } from "@app/core/constants/navbar.constants";
import { RoleRoute } from "@app/core/routes/RoleRoute";
import { PrivateRoutes } from "@app/core/routes/PrivateRoutes";
import { logout, setAuth } from "@app/core/store/auth/auth.slice";
import store from "@app/core/store/store";
import { hideToast, showToast } from "@app/core/store/toast/toast.slice";
import { makeToken, renderWithProviders } from "../../helpers/render";
import { API, server } from "../../helpers/server";

const Where = () => <span data-testid="where">{useLocation().pathname}</span>;

describe("RoleRoute", () => {
  const ui = (roles: string[]) => (
    <Routes>
      <Route path="/home" element={<span>HOME</span>} />
      <Route path="/x" element={<RoleRoute roles={roles}><span>SECRETO</span></RoleRoute>} />
    </Routes>
  );

  it("deja pasar al rol permitido", () => {
    renderWithProviders(ui(["ADMIN"]), { route: "/x", role: "ADMIN" });
    expect(screen.getByText("SECRETO")).toBeInTheDocument();
  });

  it("manda a /home a otro rol", () => {
    renderWithProviders(ui(["ADMIN"]), { route: "/x", role: "GUARD" });
    expect(screen.getByText("HOME")).toBeInTheDocument();
  });

  it("manda a /home si no hay rol", () => {
    store.dispatch(logout());
    renderWithProviders(ui(["ADMIN"]), { route: "/x" });
    expect(screen.getByText("HOME")).toBeInTheDocument();
  });
});

describe("PrivateRoutes", () => {
  const ui = (
    <Routes>
      <Route path="/login" element={<span>LOGIN</span>} />
      <Route element={<PrivateRoutes />}>
        <Route path="/home" element={<span>PANEL</span>} />
      </Route>
    </Routes>
  );

  it("sin sesión redirige a /login", () => {
    store.dispatch(logout());
    renderWithProviders(ui, { route: "/home" });
    expect(screen.getByText("LOGIN")).toBeInTheDocument();
  });

  it("con sesión muestra el layout con el nombre del usuario", () => {
    renderWithProviders(ui, { route: "/home", role: "ADMIN" });
    expect(screen.getByText("PANEL")).toBeInTheDocument();
    expect(screen.getAllByText("Admin").length).toBeGreaterThan(0);
  });

  it("usa 'Usuario' si el JWT no trae nombre", () => {
    store.dispatch(setAuth(makeToken({ name: "" })));
    // name "" cae al ?? de la slice (""), y el layout usa el respaldo "Usuario"
    renderWithProviders(ui, { route: "/home" });
    expect(screen.getAllByText("Usuario").length).toBeGreaterThan(0);
  });

  it("cerrar sesión avisa al API, borra el token y va a /login", async () => {
    let called = false;
    server.use(http.post(`${API}/users/logout`, () => ((called = true), HttpResponse.json({ success: true }))));
    localStorage.setItem("token", "t");
    const { user } = renderWithProviders(ui, { route: "/home", role: "ADMIN" });
    await user.click(screen.getAllByText("Admin")[0]);
    await user.click(screen.getByText("Cerrar Sesión"));
    await waitFor(() => expect(screen.getByText("LOGIN")).toBeInTheDocument());
    expect(called).toBe(true);
    expect(localStorage.getItem("token")).toBeNull();
    expect(store.getState().auth.token).toBeNull();
  });

  it("si el API falla igual cierra la sesión local", async () => {
    server.use(http.post(`${API}/users/logout`, () => HttpResponse.json({ message: "x" }, { status: 500 })));
    localStorage.setItem("token", "t");
    const { user } = renderWithProviders(ui, { route: "/home", role: "ADMIN" });
    await user.click(screen.getAllByText("Admin")[0]);
    await user.click(screen.getByText("Cerrar Sesión"));
    await waitFor(() => expect(screen.getByText("LOGIN")).toBeInTheDocument());
    expect(localStorage.getItem("token")).toBeNull();
  });
});

describe("useNavigationItems / Navbar", () => {
  const wrapper = (route: string) => ({ children }: { children: ReactNode }) => (
    <Provider store={store}>
      <MemoryRouter initialEntries={[route]}>{children}<Where /></MemoryRouter>
    </Provider>
  );
  const labels = (items: any[]) => items.map((i) => i.label);

  it("ADMIN ve todas las secciones", () => {
    store.dispatch(setAuth(makeToken({ role: "ADMIN" })));
    const { result } = renderHook(() => useNavigationItems(), { wrapper: wrapper("/home") });
    expect(labels(result.current)).toEqual(["Inicio", "Operación", "Residencial", "Reportes", "Personal", "Catálogos"]);
  });

  it("GUARD solo ve lo suyo y no ve secciones vacías", () => {
    store.dispatch(setAuth(makeToken({ role: "GUARD" })));
    const { result } = renderHook(() => useNavigationItems(), { wrapper: wrapper("/home") });
    expect(labels(result.current)).toEqual(["Inicio", "Residencial", "Reportes"]);
    const reports = result.current.find((i: any) => i.id === "reports");
    expect(reports.subitems[0].items.map((i: any) => i.label)).toEqual(["Casa Club"]);
  });

  it("sin rol no hay ítems", () => {
    store.dispatch(logout());
    const { result } = renderHook(() => useNavigationItems(), { wrapper: wrapper("/home") });
    expect(result.current).toEqual([]);
  });

  it("marca activa la sección y la hoja de la ruta actual, incluso en subrutas", () => {
    store.dispatch(setAuth(makeToken({ role: "ADMIN" })));
    const { result } = renderHook(() => useNavigationItems(), { wrapper: wrapper("/properties/5") });
    const residential = result.current.find((i: any) => i.id === "residential");
    expect(residential.isActive).toBe(true);
    expect(residential.subitems[0].items.find((i: any) => i.id === "properties").isActive).toBe(true);
    expect(residential.subitems[0].items.find((i: any) => i.id === "residents").isActive).toBe(false);
    expect(result.current.find((i: any) => i.id === "home").isActive).toBe(false);
  });

  it("las acciones navegan", () => {
    store.dispatch(setAuth(makeToken({ role: "ADMIN" })));
    const { result } = renderHook(() => useNavigationItems(), { wrapper: wrapper("/home") });
    act(() => result.current.find((i: any) => i.id === "catalogs").action());
    act(() => result.current.find((i: any) => i.id === "operation").subitems[0].items[0].action());
    expect(screen.getByTestId("where").textContent).toBe("/guard-tracking");
  });

  it("Navbar legacy pinta botones y logos", async () => {
    store.dispatch(setAuth(makeToken({ role: "ADMIN" })));
    const { user } = renderWithProviders(<><Navbar /><NAVBAR_LOGO /><SIDEBAR_LOGO /><Where /></>, { route: "/home" });
    await user.click(screen.getByRole("button", { name: "Catálogos" }));
    expect(screen.getByTestId("where").textContent).toBe("/catalogs");
    expect(screen.getByRole("button", { name: "Inicio" })).toBeInTheDocument();
  });
});

describe("ToastProvider", () => {
  it("muestra el toast y lo oculta solo tras su duración", async () => {
    renderWithProviders(<span>app</span>);
    act(() => {
      store.dispatch(showToast({ message: "Hola toast", type: "info", duration: 50 }));
    });
    expect(await screen.findByText("Hola toast")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("Hola toast")).toBeNull());
    expect(store.getState().toast.isVisible).toBe(false);
  });

  it("el botón de cerrar oculta el toast", async () => {
    const { user } = renderWithProviders(<span>app</span>);
    act(() => {
      store.dispatch(showToast({ message: "Cerrame", type: "error", duration: 60000 }));
    });
    await screen.findByText("Cerrame");
    await user.click(screen.getByRole("alert").querySelector("button")!);
    await waitFor(() => expect(store.getState().toast.isVisible).toBe(false));
    act(() => {
      store.dispatch(hideToast());
    });
  });
});
