import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { liveDashboard } from "../helpers/fixtures";
import { renderApp } from "../helpers/render";
import { server } from "../helpers/server";

type Role = "ADMIN" | "SHIFT" | "GUARD" | "MAINT" | "CLIENT" | "RESDN";

const ROLES: Role[] = ["ADMIN", "SHIFT", "GUARD", "MAINT"];

/** Rutas protegidas por `RoleRoute` en `src/App.tsx`, con los roles que las pueden montar. */
const GUARDED: { path: string; roles: Role[]; title: string }[] = [
  { path: "/users", roles: ["ADMIN"], title: "Directorio de Usuarios" },
  { path: "/schedules", roles: ["ADMIN"], title: "Directorio de Horarios" },
  { path: "/catalogs", roles: ["ADMIN"], title: "Catálogos" },
  { path: "/guards", roles: ["ADMIN", "SHIFT"], title: "Módulo de Guardias" },
  { path: "/locations", roles: ["ADMIN", "SHIFT"], title: "Ubicaciones" },
  { path: "/incidents", roles: ["ADMIN", "SHIFT"], title: "Gestión de Incidencias" },
  { path: "/maintenances", roles: ["ADMIN", "MAINT"], title: "Gestión de Mantenimientos" },
  { path: "/club", roles: ["ADMIN", "SHIFT", "GUARD", "MAINT"], title: "Gestión de Casa Club" },
  { path: "/rounds", roles: ["ADMIN", "SHIFT"], title: "Historial de recorridos" },
  { path: "/routes", roles: ["ADMIN", "SHIFT"], title: "Gestión de Rutas" },
  { path: "/kardex", roles: ["ADMIN", "SHIFT"], title: "Kardex" },
  { path: "/chat", roles: ["ADMIN", "SHIFT"], title: "Chat del equipo" },
  { path: "/guard-tracking", roles: ["ADMIN", "SHIFT"], title: "Seguimiento de Guardia" },
  { path: "/shift-handover", roles: ["ADMIN", "SHIFT"], title: "Entrega de Turno" },
  { path: "/uniform", roles: ["ADMIN", "SHIFT"], title: "Uniforme" },
];

/** Rutas sin `RoleRoute` (solo exigen sesión). */
const OPEN: { path: string; title: string }[] = [
  { path: "/properties", title: "Propiedades" },
  { path: "/residents", title: "Directorio de Residentes" },
  { path: "/invitations", title: "Directorio de Invitados" },
];

const ALL_PATHS = ["/home", ...GUARDED.map((r) => r.path), ...OPEN.map((r) => r.path)];

/**
 * El shell y las pantallas piden datos variados. Para no acoplar la matriz a
 * decenas de endpoints, todo lo que no sea el dashboard en vivo responde una
 * lista vacía: `TResult` con `data: []` es lo que todas las pantallas toleran
 * (`.rows`, `.data`, `.map`, `.filter`…). El dashboard usa el fixture real.
 */
beforeEach(() => {
  server.use(
    http.all(/\/api\/v1\/.*/, ({ request }) => {
      const path = new URL(request.url).pathname.replace("/api/v1", "");
      if (path === "/dashboard/live") {
        return HttpResponse.json({ success: true, data: liveDashboard() });
      }
      if (path === "/realtime/token") {
        return HttpResponse.json({ success: true, data: { token: "t" } });
      }
      // `/properties` pinta un tablero de ocupación que espera un objeto, no una lista.
      if (path === "/properties/stats/occupancy") {
        return HttpResponse.json({
          success: true,
          data: { properties: 0, residents: 0, overcrowded: 0, byStatus: [] },
        });
      }
      return HttpResponse.json({ success: true, data: [] });
    }),
  );
});

const expectHeading = (title: string) =>
  waitFor(() => expect(screen.getByRole("heading", { level: 1, name: title })).toBeInTheDocument());

const expectText = (value: string) =>
  waitFor(() => expect(screen.getByText(value)).toBeInTheDocument());

/** Señal de que `RoleRoute` (o el comodín de App) nos dejó en `/home`. */
const expectHome = async (role: Role) => {
  if (role === "ADMIN" || role === "SHIFT") {
    await expectText("Hoy en números");
  } else {
    await expectHeading("Inicio");
  }
};

const MATRIX = ROLES.flatMap((role) =>
  GUARDED.map((route) => ({ role, route, allowed: route.roles.includes(role) })),
);

describe("App · matriz rol × ruta", () => {
  it.each(MATRIX)("$role en $route.path", async ({ role, route, allowed }) => {
    renderApp({ route: route.path, role });
    if (allowed) {
      await expectHeading(route.title);
      expect(screen.queryByText("Hoy en números")).toBeNull();
    } else {
      await expectHome(role);
      expect(screen.queryByRole("heading", { level: 1, name: route.title })).toBeNull();
    }
  });

  it.each(ROLES.flatMap((role) => OPEN.map((route) => ({ role, route }))))(
    "$role puede entrar a $route.path (solo pide sesión)",
    async ({ role, route }) => {
      renderApp({ route: route.path, role });
      await expectHeading(route.title);
    },
  );

  it.each(ROLES)("%s entra a /home", async (role) => {
    renderApp({ route: "/home", role });
    await expectHome(role);
  });
});

describe("App · roles fuera de la matriz", () => {
  it.each(
    (["CLIENT", "RESDN"] as Role[]).flatMap((role) => GUARDED.map((route) => ({ role, route }))),
  )("$role en $route.path cae en /home", async ({ role, route }) => {
    // Ninguna entrada de `GUARDED` incluye CLIENT/RESDN, así que RoleRoute
    // los expulsa igual que a cualquier rol sin permiso.
    renderApp({ route: route.path, role });
    await expectHome(role);
  });
});

describe("App · sesión y rutas desconocidas", () => {
  it.each(ALL_PATHS)("sin token, %s manda a /login", async (path) => {
    renderApp({ route: path });
    expect(await screen.findByRole("button", { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  it("con token, una ruta desconocida cae en /home", async () => {
    renderApp({ route: "/ruta-que-no-existe", role: "ADMIN" });
    await expectText("Hoy en números");
  });

  it("sin token, una ruta desconocida cae en /login", async () => {
    renderApp({ route: "/ruta-que-no-existe" });
    expect(await screen.findByRole("button", { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  it("/login sigue disponible con token válido", async () => {
    renderApp({ route: "/login", role: "ADMIN" });
    expect(await screen.findByRole("button", { name: /iniciar sesión/i })).toBeInTheDocument();
    expect(screen.queryByText("Hoy en números")).toBeNull();
  });

  it("cada rol conserva la ruta permitida tras el arranque (no rebota a /login)", async () => {
    renderApp({ route: "/club", role: "GUARD" });
    await expectHeading("Gestión de Casa Club");
    expect(screen.queryByRole("button", { name: /iniciar sesión/i })).toBeNull();
    expect(screen.queryByText("Hoy en números")).toBeNull();
  });
});
