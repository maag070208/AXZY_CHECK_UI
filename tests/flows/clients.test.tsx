import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import store from "@app/core/store/store";
import { renderApp } from "../helpers/render";
import { API, server } from "../helpers/server";
import { pickOption } from "../helpers/ui";

const toast = () => store.getState().toast;

const INITIAL = [
  { id: 1, name: "Plaza Centro", type: "PLAZA", active: true, organizationId: 1 },
  { id: 2, name: "Maquila Norte", type: "MAQUILA", active: false, organizationId: 1 },
];

type ClientRow = { id: number; name: string; type: string; active: boolean; organizationId?: number };

/** `GET /clients` mutable: las acciones (crear/desactivar) se reflejan al recargar. */
const serveClients = (rows: ClientRow[] = INITIAL.map((row) => ({ ...row }))) => {
  server.use(http.get(`${API}/clients`, () => HttpResponse.json({ success: true, data: rows })));
  return rows;
};

const open = async (role = "ADMIN") => {
  const ctx = renderApp({ route: "/clients", role });
  await screen.findByRole("heading", { level: 1, name: "Clientes" });
  return ctx;
};

describe("clientes: listado", () => {
  it("lista los clientes con su tipo y estado", async () => {
    serveClients();
    await open();

    expect(await screen.findByText("Plaza Centro")).toBeInTheDocument();
    expect(screen.getByText("Maquila Norte")).toBeInTheDocument();
    expect(screen.getByText("Plaza")).toBeInTheDocument();
    expect(screen.getByText("Maquila")).toBeInTheDocument();
    expect(screen.getByText("Activo")).toBeInTheDocument();
    expect(screen.getByText("Inactivo")).toBeInTheDocument();
    expect(screen.getByText("2 clientes registrados")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Nuevo cliente/i })).toBeInTheDocument();
  });

  it("muestra el estado vacío cuando no hay clientes", async () => {
    serveClients([]);
    await open();
    expect(await screen.findByText("Aún no hay clientes registrados")).toBeInTheDocument();
  });

  it("si el listado falla muestra el error y permite reintentar", async () => {
    let failing = true;
    server.use(
      http.get(`${API}/clients`, () => {
        if (failing) {
          return HttpResponse.json({ success: false, messages: ["Falla al listar"] }, { status: 500 });
        }
        return HttpResponse.json({ success: true, data: INITIAL });
      }),
    );
    const { user } = await open();

    expect(await screen.findByText("Falla al listar")).toBeInTheDocument();
    failing = false;
    const retries = screen.getAllByRole("button", { name: "Reintentar" });
    await user.click(retries[retries.length - 1]);

    expect(await screen.findByText("Plaza Centro")).toBeInTheDocument();
  });

  it("MAINT solo consulta: sin acciones de escritura", async () => {
    serveClients();
    await open("MAINT");

    expect(await screen.findByText("Plaza Centro")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Nuevo cliente/i })).toBeNull();
    expect(screen.queryByRole("button", { name: "Desactivar" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Activar" })).toBeNull();
  });
});

describe("clientes: crear", () => {
  it("crea un cliente con nombre y tipo", async () => {
    const rows = serveClients();
    let created: any = null;
    server.use(
      http.post(`${API}/clients`, async ({ request }) => {
        created = await request.json();
        const row = { id: 3, ...(created as object), active: true, organizationId: 1 };
        rows.push(row as ClientRow);
        return HttpResponse.json({ success: true, data: row }, { status: 201 });
      }),
    );
    const { user } = await open();

    await user.click(screen.getByRole("button", { name: /Nuevo cliente/i }));
    await screen.findByPlaceholderText("Residencial Bosques...");

    const nameInput = screen.getByPlaceholderText("Residencial Bosques...");
    const createButton = screen.getByRole("button", { name: "Crear cliente" });
    expect(createButton).toBeDisabled();

    await user.type(nameInput, "Maquila Sur");
    await pickOption(user, screen.getByDisplayValue("Residencial"), "Maquila");
    await user.click(createButton);

    await waitFor(() => expect(created).toEqual({ name: "Maquila Sur", type: "MAQUILA" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Cliente creado correctamente", type: "success" }));
    expect(await screen.findByText("Maquila Sur")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByPlaceholderText("Residencial Bosques...")).toBeNull());
  });

  it("no deja crear con el nombre vacío", async () => {
    serveClients();
    const { user } = await open();

    await user.click(screen.getByRole("button", { name: /Nuevo cliente/i }));
    await screen.findByPlaceholderText("Residencial Bosques...");
    await user.type(screen.getByPlaceholderText("Residencial Bosques..."), "   ");
    expect(screen.getByRole("button", { name: "Crear cliente" })).toBeDisabled();
  });

  it("cancelar cierra el formulario sin crear", async () => {
    serveClients();
    let posted = false;
    server.use(http.post(`${API}/clients`, () => ((posted = true), HttpResponse.json({ success: true }))));
    const { user } = await open();

    await user.click(screen.getByRole("button", { name: /Nuevo cliente/i }));
    await screen.findByPlaceholderText("Residencial Bosques...");
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    await waitFor(() => expect(screen.queryByPlaceholderText("Residencial Bosques...")).toBeNull());
    expect(posted).toBe(false);
  });

  it("si el API rechaza muestra su mensaje", async () => {
    serveClients();
    server.use(http.post(`${API}/clients`, () => HttpResponse.json({ success: false, messages: ["Nombre duplicado"] })));
    const { user } = await open();

    await user.click(screen.getByRole("button", { name: /Nuevo cliente/i }));
    await user.type(screen.getByPlaceholderText("Residencial Bosques..."), "Plaza Centro");
    await user.click(screen.getByRole("button", { name: "Crear cliente" }));

    await waitFor(() => expect(toast()).toMatchObject({ message: "Nombre duplicado", type: "error" }));
    expect(screen.getByPlaceholderText("Residencial Bosques...")).toBeInTheDocument();
  });

  it("un error HTTP al crear también avisa", async () => {
    serveClients();
    server.use(http.post(`${API}/clients`, () => HttpResponse.json({ message: "Sin permiso" }, { status: 403 })));
    const { user } = await open();

    await user.click(screen.getByRole("button", { name: /Nuevo cliente/i }));
    await user.type(screen.getByPlaceholderText("Residencial Bosques..."), "Plaza Norte");
    await user.click(screen.getByRole("button", { name: "Crear cliente" }));

    await waitFor(() => expect(toast()).toMatchObject({ message: "Sin permiso", type: "error" }));
  });
});

describe("clientes: activar y desactivar", () => {
  it("desactiva un cliente con PATCH { active: false }", async () => {
    const rows = serveClients();
    let patched: any = null;
    server.use(
      http.patch(`${API}/clients/:id`, async ({ request, params }) => {
        patched = await request.json();
        const row = rows.find((item) => item.id === Number(params.id));
        if (row) row.active = false;
        return HttpResponse.json({ success: true, data: row });
      }),
    );
    const { user } = await open();

    await screen.findByText("Plaza Centro");
    await user.click(screen.getByRole("button", { name: "Desactivar" }));

    await waitFor(() => expect(patched).toEqual({ active: false }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Cliente desactivado correctamente", type: "success" }));
    await waitFor(() => expect(screen.getAllByText("Inactivo")).toHaveLength(2));
  });

  it("activa un cliente inactivo", async () => {
    const rows = serveClients();
    let patched: any = null;
    server.use(
      http.patch(`${API}/clients/:id`, async ({ request, params }) => {
        patched = await request.json();
        const row = rows.find((item) => item.id === Number(params.id));
        if (row) row.active = true;
        return HttpResponse.json({ success: true, data: row });
      }),
    );
    const { user } = await open();

    await screen.findByText("Maquila Norte");
    await user.click(screen.getByRole("button", { name: "Activar" }));

    await waitFor(() => expect(patched).toEqual({ active: true }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Cliente activado correctamente", type: "success" }));
    await waitFor(() => expect(screen.getAllByText("Activo")).toHaveLength(2));
  });

  it("si el PATCH falla muestra el mensaje del API", async () => {
    serveClients();
    server.use(http.patch(`${API}/clients/:id`, () => HttpResponse.json({ success: false, messages: ["No se pudo actualizar"] })));
    const { user } = await open();

    await screen.findByText("Plaza Centro");
    await user.click(screen.getByRole("button", { name: "Desactivar" }));

    await waitFor(() => expect(toast()).toMatchObject({ message: "No se pudo actualizar", type: "error" }));
  });
});
