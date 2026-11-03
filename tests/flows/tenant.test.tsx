import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import store from "@app/core/store/store";
import { logout } from "@app/core/store/auth/auth.slice";
import { tenantStorageKey } from "@app/core/store/tenant/tenant.storage";
import { stub, table } from "../helpers/api";
import { liveDashboard } from "../helpers/fixtures";
import { renderApp } from "../helpers/render";
import { API, server } from "../helpers/server";
import { pickOption } from "../helpers/ui";

const ONE_CLIENT = [
  { id: 1, name: "Residencial Bosques", type: "RESIDENTIAL", active: true, organizationId: 1 },
];

const TWO_CLIENTS = [
  { id: 7, name: "Plaza Centro", type: "PLAZA", active: true, organizationId: 1 },
  { id: 9, name: "Maquila Norte", type: "MAQUILA", active: true, organizationId: 1 },
];

/** Handler de `GET /clients` que registra el `X-Client-Id` de cada petición. */
const captureClients = (rows: unknown[]) => {
  const headerCalls: (string | null)[] = [];
  server.use(
    http.get(`${API}/clients`, ({ request }) => {
      headerCalls.push(request.headers.get("x-client-id"));
      return HttpResponse.json({ success: true, data: rows });
    }),
  );
  return headerCalls;
};

/** Deja el store sin tenant y con una selección persistida para el usuario 1. */
const seedPersistedSelection = (clientId: number) => {
  store.dispatch(logout());
  localStorage.setItem(tenantStorageKey(1), String(clientId));
};

describe("selector de cliente · ADMIN", () => {
  it("con un solo cliente lo selecciona solo, lo persiste y lo manda en el encabezado", async () => {
    const headers = captureClients(ONE_CLIENT);
    const { user } = renderApp({ route: "/clients", role: "ADMIN" });

    expect(await screen.findByDisplayValue("Residencial Bosques (Residencial)")).toBeInTheDocument();
    await waitFor(() => expect(localStorage.getItem(tenantStorageKey(1))).toBe("1"));

    // Tras la carga inicial, cualquier petición nueva lleva el cliente elegido.
    await user.click(screen.getByRole("button", { name: "Actualizar clientes" }));
    await waitFor(() => expect(headers.at(-1)).toBe("1"));
  });

  it("con varios clientes y sin selección deja el selector vacío", async () => {
    const headers = captureClients(TWO_CLIENTS);
    renderApp({ route: "/clients", role: "ADMIN" });

    expect(await screen.findByPlaceholderText("Selecciona un cliente...")).toBeInTheDocument();
    await waitFor(() => expect(headers.length).toBeGreaterThan(0));
    expect(headers.every((header) => header === null)).toBe(true);
  });

  it("al elegir cliente guarda localStorage, remonta la vista y manda X-Client-Id", async () => {
    const headers = captureClients(TWO_CLIENTS);
    const { user } = renderApp({ route: "/clients", role: "ADMIN" });

    await pickOption(user, await screen.findByPlaceholderText("Selecciona un cliente..."), "Maquila Norte (Maquila)");

    await waitFor(() => expect(localStorage.getItem(tenantStorageKey(1))).toBe("9"));
    expect(screen.getByDisplayValue("Maquila Norte (Maquila)")).toBeInTheDocument();
    // El remonte de la vista vuelve a pedir los datos ya con el cliente nuevo.
    await waitFor(() => expect(headers.at(-1)).toBe("9"));
  });

  it("restaura la selección persistida del usuario al arrancar", async () => {
    seedPersistedSelection(9);
    const headers = captureClients(TWO_CLIENTS);
    renderApp({ route: "/clients", role: "ADMIN" });

    expect(await screen.findByDisplayValue("Maquila Norte (Maquila)")).toBeInTheDocument();
    await waitFor(() => expect(headers.length).toBeGreaterThan(0));
    expect(headers.every((header) => header === "9")).toBe(true);
  });

  it("cerrar sesión limpia la selección persistida", async () => {
    // El handler base sirve un único cliente (id 1).
    seedPersistedSelection(1);
    const { user } = renderApp({ route: "/clients", role: "ADMIN" });
    await screen.findByDisplayValue("Cliente Base (Residencial)");

    await user.click(screen.getAllByText("Admin")[0]);
    await user.click(screen.getByText("Cerrar Sesión"));

    await screen.findByRole("button", { name: /iniciar sesión/i });
    expect(localStorage.getItem(tenantStorageKey(1))).toBeNull();
    expect(store.getState().tenant.selectedClientId).toBeNull();
  });

  it("carga los clientes una sola vez por sesión", async () => {
    const headers = captureClients(ONE_CLIENT);
    stub("get", "/schedules", { success: true, data: [] });
    table("/users/datatable", [
      { id: 1, name: "Ana", lastName: "Pérez", username: "ana", role: { name: "GUARD", value: "Guardia" } },
    ]);
    renderApp({ route: "/guards", role: "ADMIN" });

    await screen.findByText("@ana");
    expect(headers).toHaveLength(1);
  });

  it("MAINT también elige cliente y lo manda", async () => {
    const headers = captureClients(ONE_CLIENT);
    const { user } = renderApp({ route: "/clients", role: "MAINT" });
    expect(await screen.findByDisplayValue("Residencial Bosques (Residencial)")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Actualizar clientes" }));
    await waitFor(() => expect(headers.at(-1)).toBe("1"));
  });

  it("si la carga falla muestra el error y permite reintentar", async () => {
    let failing = true;
    server.use(
      http.get(`${API}/clients`, () => {
        if (failing) {
          return HttpResponse.json({ success: false, messages: ["Falla del servidor"] }, { status: 500 });
        }
        return HttpResponse.json({ success: true, data: ONE_CLIENT });
      }),
    );
    const { user } = renderApp({ route: "/clients", role: "ADMIN" });

    expect(await screen.findByText("No se pudieron cargar los clientes.")).toBeInTheDocument();
    failing = false;
    await user.click(screen.getAllByRole("button", { name: "Reintentar" })[0]);

    expect(await screen.findByDisplayValue("Residencial Bosques (Residencial)")).toBeInTheDocument();
  });
});

describe("selector de cliente · roles sin selector", () => {
  const catchAll = (clientsCalls: (string | null)[]) => {
    server.use(
      http.all(/\/api\/v1\/.*/, ({ request }) => {
        const path = new URL(request.url).pathname.replace("/api/v1", "");
        if (path === "/users/me/permissions") {
          const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ?? "";
          const role = JSON.parse(atob(token.split(".")[1] ?? "{}")).role ?? null;
          return HttpResponse.json({
            success: true,
            data: {
              role,
              permissions:
                role === "CLIENT"
                  ? ["dashboard.view", "kardex.view", "properties.view"]
                  : ["access.check", "invitation.manage", "club.view", "chat.use"],
            },
          });
        }
        if (path === "/clients") {
          clientsCalls.push(request.headers.get("x-client-id"));
          return HttpResponse.json({ success: true, data: TWO_CLIENTS });
        }
        if (path === "/dashboard/live") {
          return HttpResponse.json({ success: true, data: liveDashboard() });
        }
        return HttpResponse.json({ success: true, data: [] });
      }),
    );
  };

  it("CLIENT no tiene selector, no pide clientes ni manda X-Client-Id", async () => {
    const clientsCalls: (string | null)[] = [];
    catchAll(clientsCalls);
    renderApp({ route: "/home", role: "CLIENT" });

    await screen.findByText("Hoy en números");
    expect(screen.queryByText("Cliente activo")).toBeNull();
    expect(clientsCalls).toHaveLength(0);
  });

  it("GUARD no tiene selector ni pide clientes", async () => {
    const clientsCalls: (string | null)[] = [];
    catchAll(clientsCalls);
    renderApp({ route: "/home", role: "GUARD" });

    await screen.findByRole("heading", { level: 1, name: /Caseta/ });
    expect(screen.queryByText("Cliente activo")).toBeNull();
    expect(clientsCalls).toHaveLength(0);
  });
});
