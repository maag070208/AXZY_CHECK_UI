import { act, screen, waitFor, within } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import store from "@app/core/store/store";
import { CategoryFormModal } from "@app/modules/catalogs/components/CategoryFormModal";
import { CatalogDeleteDialog, type CatalogDeleteTarget } from "@app/modules/catalogs/components/CatalogDeleteDialog";
import type { CatalogCategory, CatalogType } from "@app/modules/catalogs/services/CatalogAdminService";
import type { GenericCatalogItem } from "@app/modules/catalogs/services/GenericCatalogService";
import { fail, stub } from "../helpers/api";
import { renderApp, renderWithProviders } from "../helpers/render";
import { API, server } from "../helpers/server";
import { pickOption } from "../helpers/ui";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const categories: CatalogCategory[] = [
  { id: 12, name: "ACCESO", value: "Acceso no autorizado", type: "INCIDENT", active: false, order: 1, _count: { types: 2 } },
  { id: 11, name: "ROBO", value: "Robo", type: "INCIDENT", active: true, order: 2, _count: { types: 1 } },
  { id: 21, name: "FUGA", value: "Fuga de agua", type: "MAINTENANCE", active: true, order: 1, _count: { types: 0 } },
  { id: 22, name: "LUZ", value: "Falla eléctrica", type: "MAINTENANCE", active: true, order: 2, _count: { types: 3 } },
  { id: 31, name: "ALBERCA", value: "Reserva de alberca", type: "CASA_CLUB", active: false, order: 1, _count: { types: 4 } },
];

const BASE_KEYS = ["property-types", "property-statuses", "invitation-types", "resident-relationships"] as const;
type BaseKey = (typeof BASE_KEYS)[number];

const baseFixture: Record<BaseKey, GenericCatalogItem[]> = {
  "property-types": [
    { id: 101, name: "HOUSE", value: "Casa", order: 2, active: true, isSystem: false },
    { id: 102, name: "APARTMENT", value: "Departamento", order: 1, active: false, isSystem: true },
  ],
  "property-statuses": [
    { id: 201, name: "AVAILABLE", value: "Disponible", order: 1, active: true, isSystem: false },
    { id: 202, name: "OCCUPIED", value: "Ocupada", order: 2, active: true, isSystem: false },
    { id: 203, name: "MAINTENANCE", value: "En mantenimiento", order: 3, active: false, isSystem: false },
  ],
  "invitation-types": [{ id: 301, name: "VISIT", value: "Visita", order: 1, active: true, isSystem: false }],
  "resident-relationships": [
    { id: 401, name: "OWNER", value: "Propietario", order: 1, active: true, isSystem: false },
    { id: 402, name: "TENANT", value: "Inquilino", order: 2, active: true, isSystem: false },
    { id: 403, name: "FAMILY", value: "Familiar", order: 3, active: true, isSystem: false },
    { id: 404, name: "OTHER", value: "Otro", order: 4, active: false, isSystem: true },
  ],
};

const typesFixture: CatalogType[] = [
  { id: 111, name: "THEFT", value: "Robo a personas", categoryId: 11, active: true, order: 1 },
  { id: 112, name: "BURGLARY", value: "Robo a vivienda", categoryId: 11, active: false, order: 2 },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const toast = () => store.getState().toast;

type Overrides = {
  categories?: CatalogCategory[];
  base?: Partial<Record<BaseKey, GenericCatalogItem[]>>;
};

const stubApi = (over: Overrides = {}) => {
  const cats = stub("get", "/catalog-admin/categories", { success: true, data: over.categories ?? categories });
  const base = Object.fromEntries(
    BASE_KEYS.map((key) => [
      key,
      stub("get", `/catalogs/${key}`, { success: true, data: over.base?.[key] ?? baseFixture[key] }),
    ]),
  ) as Record<BaseKey, ReturnType<typeof stub>>;
  return { cats, base };
};

const mount = (over: Overrides = {}) => {
  const api = stubApi(over);
  return { ...renderApp({ route: "/catalogs", role: "ADMIN" }), api };
};

const open = async (over: Overrides = {}) => {
  const ctx = mount(over);
  await screen.findByRole("heading", { name: "Catálogos" });
  await screen.findByText("Robo");
  await screen.findByRole("button", { name: "Tipos de propiedad (2)" });
  return ctx;
};

/** Espera a que exista el diálogo cuyo título (h2) coincide. */
const dialogOf = async (title: string | RegExp) => {
  const heading = await screen.findByRole("heading", { name: title });
  return heading.closest("[data-it-dialog]") as HTMLElement;
};

const tabButton = (label: string) => screen.getByRole("button", { name: new RegExp(`^${label} \\(`) });

const rowOf = (value: string) => {
  const row = screen.getByText(value).closest(".grid");
  if (!row) throw new Error(`No se encontró la fila de "${value}"`);
  return row as HTMLElement;
};

const typeRowOf = (value: string) => {
  const row = screen.getByText(value).closest(".rounded-xl");
  if (!row) throw new Error(`No se encontró la fila del tipo "${value}"`);
  return row as HTMLElement;
};

const precedes = (first: string, second: string) =>
  Boolean(screen.getByText(first).compareDocumentPosition(screen.getByText(second)) & Node.DOCUMENT_POSITION_FOLLOWING);

const fillCategory = async (user: UserEvent, dialog: HTMLElement, code = "POOL_ENTRY", value = "Ingreso a la alberca") => {
  await user.type(within(dialog).getByLabelText(/Código interno/), code);
  await user.type(within(dialog).getByLabelText(/Nombre visible/), value);
};

const goBase = async (user: UserEvent, label: string, expectedRow: string) => {
  await user.click(tabButton(label));
  await screen.findByText(expectedRow);
};

/** Handler MSW que no responde hasta llamar a `release` (para observar estados de carga). */
const gatedRequest = (method: "get" | "post", path: string, body: unknown) => {
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  server.use(
    http[method](`${API}${path}`, async () => {
      await gate;
      return HttpResponse.json(body as never);
    }),
  );
  return { release };
};

// ---------------------------------------------------------------------------
// Carga inicial
// ---------------------------------------------------------------------------

describe("catálogos: carga inicial", () => {
  it("pide las categorías sin filtrar por tipo y reparte los contadores por pestaña", async () => {
    const { api } = await open();

    expect(api.cats.method).toBe("GET");
    expect(api.cats.path).toBe("/catalog-admin/categories");
    expect(api.cats.search).toBe("");

    expect(screen.getByRole("button", { name: "Incidencias (2)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mantenimiento (2)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Casa Club (1)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tipos de propiedad (2)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Estados de propiedad (3)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tipos de invitación (1)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Parentescos (4)" })).toBeInTheDocument();
    expect(BASE_KEYS.every((key) => api.base[key].search === "?all=true")).toBe(true);
  });

  it("si un catálogo base falla al contar, su pestaña queda en 0 y la pantalla sigue", async () => {
    stubApi();
    fail("get", "/catalogs/property-types", ["boom"], 500);
    renderApp({ route: "/catalogs", role: "ADMIN" });
    expect(await screen.findByRole("button", { name: "Tipos de propiedad (0)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Parentescos (4)" })).toBeInTheDocument();
    expect(await screen.findByText("Robo")).toBeInTheDocument();
  });

  it("lista solo el catálogo activo, ordenado por 'order'", async () => {
    await open();
    expect(screen.getByText("Acceso no autorizado")).toBeInTheDocument();
    expect(precedes("Acceso no autorizado", "Robo")).toBe(true);
    expect(screen.queryByText("Fuga de agua")).toBeNull();
    expect(screen.queryByText("Reserva de alberca")).toBeNull();
  });

  it("cambia entre las pestañas de reporte y muestra solo sus filas", async () => {
    const { user } = await open();

    await user.click(tabButton("Mantenimiento"));
    expect(await screen.findByText("Fuga de agua")).toBeInTheDocument();
    expect(screen.getByText("Falla eléctrica")).toBeInTheDocument();
    expect(screen.queryByText("Robo")).toBeNull();

    await user.click(tabButton("Casa Club"));
    expect(await screen.findByText("Reserva de alberca")).toBeInTheDocument();
    expect(screen.queryByText("Fuga de agua")).toBeNull();

    await user.click(tabButton("Incidencias"));
    expect(await screen.findByText("Robo")).toBeInTheDocument();
  });

  it("filtra por estado (Todas/Activas/Inactivas) y 'Todas' lo quita", async () => {
    const { user } = await open();

    await pickOption(user, screen.getByDisplayValue("Todas"), "Activas");
    await waitFor(() => expect(screen.queryByText("Acceso no autorizado")).toBeNull());
    expect(screen.getByText("Robo")).toBeInTheDocument();

    await pickOption(user, screen.getByDisplayValue("Activas"), "Inactivas");
    await waitFor(() => expect(screen.queryByText("Robo")).toBeNull());
    expect(screen.getByText("Acceso no autorizado")).toBeInTheDocument();

    await pickOption(user, screen.getByDisplayValue("Inactivas"), "Todas");
    await waitFor(() => expect(screen.getByText("Robo")).toBeInTheDocument());
    expect(screen.getByText("Acceso no autorizado")).toBeInTheDocument();
  });

  it("muestra badges Activo/Inactivo y pluraliza '1 tipo' / 'N tipos'", async () => {
    await open();
    expect(screen.getByText("ROBO · 1 tipo")).toBeInTheDocument();
    expect(screen.getByText("ACCESO · 2 tipos")).toBeInTheDocument();
    expect(within(rowOf("Robo")).getByText("Activo")).toBeInTheDocument();
    expect(within(rowOf("Acceso no autorizado")).getByText("Inactivo")).toBeInTheDocument();
    expect(within(rowOf("Robo")).getByText("2")).toBeInTheDocument();
  });

  it("muestra el loader mientras llegan las categorías", async () => {
    stubApi();
    const gate = gatedRequest("get", "/catalog-admin/categories", { success: true, data: categories });
    renderApp({ route: "/catalogs", role: "ADMIN" });

    await screen.findByRole("heading", { name: "Catálogos" });
    expect(screen.getAllByRole("status").length).toBeGreaterThan(0);

    await act(async () => {
      gate.release();
    });
    await screen.findByText("Robo");
    await waitFor(() => expect(screen.queryAllByRole("status")).toHaveLength(0));
  });

  it("estado vacío tanto en reporte como en catálogos base", async () => {
    const ctx = mount({
      categories: [],
      base: {
        "property-types": [],
        "property-statuses": [],
        "invitation-types": [],
        "resident-relationships": [],
      },
    });

    await screen.findByRole("heading", { name: "Catálogos" });
    expect(await screen.findByText("Sin categorías")).toBeInTheDocument();
    expect(await screen.findByText("Crea la primera categoría de este catálogo.")).toBeInTheDocument();

    await ctx.user.click(await screen.findByRole("button", { name: "Tipos de propiedad (0)" }));
    expect(await screen.findByText("Sin valores")).toBeInTheDocument();
    expect(screen.getByText("Agrega el primer valor de este catálogo.")).toBeInTheDocument();
  });

  it("Actualizar en una pestaña de reporte recarga categorías y contadores", async () => {
    const { user } = await open();
    const fresh = stub("get", "/catalog-admin/categories", { success: true, data: categories });
    const freshBase = stub("get", "/catalogs/property-types", { success: true, data: baseFixture["property-types"] });

    await user.click(screen.getByRole("button", { name: "Actualizar" }));

    await waitFor(() => expect(fresh.path).toBe("/catalog-admin/categories"));
    await waitFor(() => expect(freshBase.search).toBe("?all=true"));
  });

  it("Actualizar en una pestaña base recarga también ese catálogo", async () => {
    const { user } = await open();
    await goBase(user, "Tipos de propiedad", "Casa");

    const freshBase = stub("get", "/catalogs/property-types", { success: true, data: baseFixture["property-types"] });
    await user.click(screen.getByRole("button", { name: "Actualizar" }));

    await waitFor(() => expect(freshBase.search).toBe("?all=true"));
    await waitFor(() => expect(freshBase.path).toBe("/catalogs/property-types"));
  });
});

// ---------------------------------------------------------------------------
// Catálogos base
// ---------------------------------------------------------------------------

describe("catálogos base", () => {
  it("lista los cuatro catálogos ordenados, con código y estado", async () => {
    const { user } = await open();

    await goBase(user, "Tipos de propiedad", "Departamento");
    expect(precedes("Departamento", "Casa")).toBe(true);
    expect(screen.getByText("APARTMENT")).toBeInTheDocument();
    expect(within(rowOf("Casa")).getByText("Activo")).toBeInTheDocument();
    expect(within(rowOf("Departamento")).getByText("Inactivo")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("Todas")).toBeNull();

    await goBase(user, "Estados de propiedad", "Disponible");
    expect(screen.getByText("Ocupada")).toBeInTheDocument();
    expect(within(rowOf("En mantenimiento")).getByText("Inactivo")).toBeInTheDocument();

    await goBase(user, "Tipos de invitación", "Visita");
    expect(screen.getByText("VISIT")).toBeInTheDocument();

    await goBase(user, "Parentescos", "Propietario");
    expect(precedes("Propietario", "Otro")).toBe(true);
    expect(screen.getByText("Otro")).toBeInTheDocument();
  });

  it("crea un valor: código a mayúsculas y nombre recortado", async () => {
    const created = stub("post", "/catalogs/property-types", { success: true, data: { id: 999 } });
    const { user } = await open();
    await goBase(user, "Tipos de propiedad", "Casa");

    await user.click(screen.getByRole("button", { name: "Nuevo" }));
    const dialog = await dialogOf("Nuevo Tipos de propiedad");
    await user.type(within(dialog).getByLabelText("Código"), " townhouse ");
    await user.type(within(dialog).getByLabelText("Nombre"), "  Casa adosada  ");

    expect(within(dialog).getByLabelText("Código")).toHaveValue(" TOWNHOUSE ");
    const reload = stub("get", "/catalogs/property-types", { success: true, data: baseFixture["property-types"] });
    await user.click(within(dialog).getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(created.body).toEqual({ name: "TOWNHOUSE", value: "Casa adosada" }));
    await waitFor(() => expect(screen.queryByRole("heading", { name: "Nuevo Tipos de propiedad" })).toBeNull());
    await waitFor(() => expect(reload.search).toBe("?all=true"));
  });

  it("muestra el loader mientras llega el catálogo base", async () => {
    const { user } = await open();
    const gate = gatedRequest("get", "/catalogs/property-types", { success: true, data: baseFixture["property-types"] });

    await user.click(tabButton("Tipos de propiedad"));
    await waitFor(() => expect(screen.getByRole("status")).toBeInTheDocument());

    await act(async () => {
      gate.release();
    });
    await screen.findByText("Casa");
    await waitFor(() => expect(screen.queryByRole("status")).toBeNull());
  });

  it("muestra 'Guardando...' mientras guarda un valor base", async () => {
    const { user } = await open();
    await goBase(user, "Tipos de propiedad", "Casa");
    await user.click(screen.getByRole("button", { name: "Nuevo" }));
    const dialog = await dialogOf("Nuevo Tipos de propiedad");
    await user.type(within(dialog).getByLabelText("Código"), "TOWN");
    await user.type(within(dialog).getByLabelText("Nombre"), "Townhouse");

    const gate = gatedRequest("post", "/catalogs/property-types", { success: true, data: { id: 999 } });
    await user.click(within(dialog).getByRole("button", { name: "Guardar" }));

    const saving = within(dialog).getByRole("button", { name: "Guardando..." });
    expect(saving).toBeDisabled();

    await act(async () => {
      gate.release();
    });
    await waitFor(() => expect(screen.queryByRole("heading", { name: "Nuevo Tipos de propiedad" })).toBeNull());
  });

  it("edita un valor con PUT", async () => {
    const updated = stub("put", "/catalogs/property-types/102", { success: true });
    const { user } = await open();
    await goBase(user, "Tipos de propiedad", "Departamento");

    await user.click(within(rowOf("Departamento")).getByRole("button", { name: "Editar" }));
    const dialog = await dialogOf("Editar Tipos de propiedad");
    expect(within(dialog).getByLabelText("Código")).toHaveValue("APARTMENT");
    expect(within(dialog).getByLabelText("Nombre")).toHaveValue("Departamento");

    await user.clear(within(dialog).getByLabelText("Código"));
    await user.type(within(dialog).getByLabelText("Código"), "apt");
    await user.clear(within(dialog).getByLabelText("Nombre"));
    await user.type(within(dialog).getByLabelText("Nombre"), "  Depto  ");
    await user.click(within(dialog).getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(updated.body).toEqual({ name: "APT", value: "Depto" }));
    await waitFor(() => expect(screen.queryByRole("heading", { name: "Editar Tipos de propiedad" })).toBeNull());
  });

  it("guarda deshabilitado mientras los campos están vacíos o en blanco", async () => {
    const { user } = await open();
    await goBase(user, "Tipos de propiedad", "Casa");
    await user.click(screen.getByRole("button", { name: "Nuevo" }));
    const dialog = await dialogOf("Nuevo Tipos de propiedad");
    const save = within(dialog).getByRole("button", { name: "Guardar" });

    expect(save).toBeDisabled();
    await user.type(within(dialog).getByLabelText("Código"), "   ");
    await user.type(within(dialog).getByLabelText("Nombre"), "   ");
    expect(save).toBeDisabled();
  });

  it("si el API no guarda muestra el mensaje o el texto por defecto", async () => {
    stub("post", "/catalogs/property-types", { success: false, messages: ["Valor duplicado"] });
    const { user } = await open();
    await goBase(user, "Tipos de propiedad", "Casa");
    await user.click(screen.getByRole("button", { name: "Nuevo" }));
    const dialog = await dialogOf("Nuevo Tipos de propiedad");
    await user.type(within(dialog).getByLabelText("Código"), "TOWN");
    await user.type(within(dialog).getByLabelText("Nombre"), "Townhouse");

    await user.click(within(dialog).getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Valor duplicado", type: "error" }));
    expect(screen.getByRole("heading", { name: "Nuevo Tipos de propiedad" })).toBeInTheDocument();

    stub("post", "/catalogs/property-types", { success: false });
    await user.click(within(dialog).getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "No se pudo guardar", type: "error" }));
  });

  it("elimina un valor y recarga catálogo y contadores", async () => {
    const removed = stub("delete", "/catalogs/property-types/101", { success: true });
    const { user } = await open();
    await goBase(user, "Tipos de propiedad", "Casa");
    const reload = stub("get", "/catalogs/property-types", { success: true, data: baseFixture["property-types"] });

    await user.click(within(rowOf("Casa")).getByRole("button", { name: "Eliminar" }));

    await waitFor(() => expect(removed.path).toBe("/catalogs/property-types/101"));
    await waitFor(() => expect(reload.search).toBe("?all=true"));
  });

  it("deshabilita eliminar cuando el valor es del sistema", async () => {
    const { user } = await open();
    await goBase(user, "Tipos de propiedad", "Departamento");

    expect(within(rowOf("Departamento")).getByRole("button", { name: "Eliminar" })).toBeDisabled();
    expect(within(rowOf("Casa")).getByRole("button", { name: "Eliminar" })).toBeEnabled();
  });

  it("si el API no elimina avisa y conserva la fila", async () => {
    stub("delete", "/catalogs/property-types/101", { success: false, messages: ["Valor en uso"] });
    const { user } = await open();
    await goBase(user, "Tipos de propiedad", "Casa");

    await user.click(within(rowOf("Casa")).getByRole("button", { name: "Eliminar" }));

    await waitFor(() => expect(toast()).toMatchObject({ message: "Valor en uso", type: "error" }));
    expect(screen.getByText("Casa")).toBeInTheDocument();
  });

  it("desactiva un valor base con confirmación (PUT active)", async () => {
    const updated = stub("put", "/catalogs/property-types/101", { success: true });
    const { user } = await open();
    await goBase(user, "Tipos de propiedad", "Casa");

    await user.click(within(rowOf("Casa")).getByRole("button", { name: "Desactivar" }));
    const dialog = await dialogOf("Desactivar valor");
    expect(within(dialog).getByText(/dejará de estar disponible en la app/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Desactivar" }));

    await waitFor(() => expect(updated.body).toEqual({ active: false }));
    await waitFor(() => expect(screen.queryByRole("heading", { name: "Desactivar valor" })).toBeNull());
  });

  it("activa un valor base con confirmación (PUT active)", async () => {
    const updated = stub("put", "/catalogs/property-types/102", { success: true });
    const { user } = await open();
    await goBase(user, "Tipos de propiedad", "Departamento");

    await user.click(within(rowOf("Departamento")).getByRole("button", { name: "Activar" }));
    const dialog = await dialogOf("Activar valor");
    expect(within(dialog).getByText(/volverá a estar disponible en la app/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Activar" }));

    await waitFor(() => expect(updated.body).toEqual({ active: true }));
  });
});

// ---------------------------------------------------------------------------
// Categorías de reporte
// ---------------------------------------------------------------------------

describe("categorías: alta", () => {
  it("abre 'Nueva categoría' y crea con el type de la pestaña activa", async () => {
    const created = stub("post", "/catalog-admin/categories", { success: true, data: { id: 99 } });
    const { user } = await open();

    await user.click(screen.getByRole("button", { name: "Nuevo" }));
    const dialog = await dialogOf("Nueva categoría");
    expect(within(dialog).getByText("Catálogo de Incidencias")).toBeInTheDocument();
    expect(within(dialog).getByText("CODIGO_INTERNO")).toBeInTheDocument();
    expect(within(dialog).queryByText(/tipos$/)).toBeNull();

    await fillCategory(user, dialog, "pool_entry", "  Ingreso a la alberca  ");
    expect(within(dialog).getByText("POOL_ENTRY")).toBeInTheDocument();
    expect(within(dialog).getByText("Ingreso a la alberca")).toBeInTheDocument();

    const reload = stub("get", "/catalog-admin/categories", { success: true, data: categories });
    await user.click(within(dialog).getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(created.body).toEqual({ name: "POOL_ENTRY", value: "Ingreso a la alberca", type: "INCIDENT" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Categoría creada", type: "success" }));
    await waitFor(() => expect(screen.queryByRole("heading", { name: "Nueva categoría" })).toBeNull());
    expect(reload.path).toBe("/catalog-admin/categories");
    expect(reload.search).toBe("");
  });

  it.each([
    ["Mantenimiento", "MAINTENANCE"],
    ["Casa Club", "CASA_CLUB"],
  ])("crea en %s con type %s", async (tabLabel, type) => {
    const created = stub("post", "/catalog-admin/categories", { success: true, data: { id: 99 } });
    const { user } = await open();

    await user.click(tabButton(tabLabel));
    await user.click(screen.getByRole("button", { name: "Nuevo" }));
    const dialog = await dialogOf("Nueva categoría");
    await fillCategory(user, dialog, "nueva", "Nueva categoría");
    await user.click(within(dialog).getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(created.body).toMatchObject({ type }));
  });

  it("valida que nombre y valor no estén vacíos", async () => {
    const created = stub("post", "/catalog-admin/categories");
    const { user } = await open();
    await user.click(screen.getByRole("button", { name: "Nuevo" }));
    const dialog = await dialogOf("Nueva categoría");

    await user.click(within(dialog).getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Nombre y valor son requeridos", type: "error" }));

    await user.type(within(dialog).getByLabelText(/Código interno/), "   ");
    await user.type(within(dialog).getByLabelText(/Nombre visible/), "   ");
    await user.click(within(dialog).getByRole("button", { name: "Guardar" }));
    expect(created.method).toBe("");
    expect(screen.getByRole("heading", { name: "Nueva categoría" })).toBeInTheDocument();
  });

  it("responde sin éxito: usa el mensaje del API o el texto por defecto", async () => {
    stub("post", "/catalog-admin/categories", { success: false, messages: ["Categoría duplicada"] });
    const { user } = await open();
    await user.click(screen.getByRole("button", { name: "Nuevo" }));
    const dialog = await dialogOf("Nueva categoría");
    await fillCategory(user, dialog);

    await user.click(within(dialog).getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Categoría duplicada", type: "error" }));

    stub("post", "/catalog-admin/categories", { success: false });
    await user.click(within(dialog).getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Error inesperado", type: "error" }));
  });

  it("error HTTP: usa el mensaje del servidor o 'Error de conexión'", async () => {
    fail("post", "/catalog-admin/categories", ["Código inválido"], 400);
    const { user } = await open();
    await user.click(screen.getByRole("button", { name: "Nuevo" }));
    const dialog = await dialogOf("Nueva categoría");
    await fillCategory(user, dialog);

    await user.click(within(dialog).getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Código inválido", type: "error" }));

    stub("post", "/catalog-admin/categories", {}, 500);
    await user.click(within(dialog).getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Error de conexión", type: "error" }));
  });

  it("Cancelar cierra el modal", async () => {
    const created = stub("post", "/catalog-admin/categories");
    const { user } = await open();
    await user.click(screen.getByRole("button", { name: "Nuevo" }));
    const dialog = await dialogOf("Nueva categoría");

    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByRole("heading", { name: "Nueva categoría" })).toBeNull());
    expect(created.method).toBe("");
  });
});

describe("categorías: edición", () => {
  it("precarga los datos y guarda con PUT (recortando)", async () => {
    const updated = stub("put", "/catalog-admin/categories/12", { success: true });
    const { user } = await open();

    await user.click(within(rowOf("Acceso no autorizado")).getByRole("button", { name: "Editar" }));
    const dialog = await dialogOf("Editar categoría");
    expect(within(dialog).getByText("ACCESO · 2 tipos")).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/Código interno/)).toHaveValue("ACCESO");
    expect(within(dialog).getByLabelText(/Nombre visible/)).toHaveValue("Acceso no autorizado");

    await user.clear(within(dialog).getByLabelText(/Código interno/));
    await user.type(within(dialog).getByLabelText(/Código interno/), "acceso_denegado");
    await user.clear(within(dialog).getByLabelText(/Nombre visible/));
    await user.type(within(dialog).getByLabelText(/Nombre visible/), "  Acceso denegado  ");
    await user.click(within(dialog).getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(updated.body).toEqual({ name: "ACCESO_DENEGADO", value: "Acceso denegado" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Categoría actualizada", type: "success" }));
  });
});

describe("categorías: activar / desactivar", () => {
  it("desactiva una categoría activa con confirmación", async () => {
    const updated = stub("put", "/catalog-admin/categories/11", { success: true });
    const { user } = await open();
    const reload = stub("get", "/catalog-admin/categories", { success: true, data: categories });

    await user.click(within(rowOf("Robo")).getByRole("button", { name: "Desactivar" }));
    const dialog = await dialogOf("Desactivar categoría");
    expect(within(dialog).getByText(/"Robo" dejará de estar disponible en la app/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Desactivar" }));

    await waitFor(() => expect(updated.body).toEqual({ active: false }));
    await waitFor(() => expect(screen.queryByRole("heading", { name: "Desactivar categoría" })).toBeNull());
    await waitFor(() => expect(reload.path).toBe("/catalog-admin/categories"));
  });

  it("activa una categoría inactiva con confirmación", async () => {
    const updated = stub("put", "/catalog-admin/categories/12", { success: true });
    const { user } = await open();

    await user.click(within(rowOf("Acceso no autorizado")).getByRole("button", { name: "Activar" }));
    const dialog = await dialogOf("Activar categoría");
    expect(within(dialog).getByText(/"Acceso no autorizado" volverá a estar disponible en la app/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Activar" }));

    await waitFor(() => expect(updated.body).toEqual({ active: true }));
  });

  it("Cancelar no cambia el estado", async () => {
    const updated = stub("put", "/catalog-admin/categories/11", { success: true });
    const { user } = await open();

    await user.click(within(rowOf("Robo")).getByRole("button", { name: "Desactivar" }));
    const dialog = await dialogOf("Desactivar categoría");
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));

    await waitFor(() => expect(screen.queryByRole("heading", { name: "Desactivar categoría" })).toBeNull());
    expect(updated.method).toBe("");
  });
});

describe("categorías: eliminar", () => {
  it("una categoría activa se confirma como 'Desactivar' pero manda DELETE", async () => {
    const removed = stub("delete", "/catalog-admin/categories/11", { success: true });
    const { user } = await open();
    const reload = stub("get", "/catalog-admin/categories", { success: true, data: categories });

    await user.click(within(rowOf("Robo")).getByRole("button", { name: "Eliminar" }));
    const dialog = await dialogOf("Desactivar categoría");
    expect(within(dialog).getByText("El registro dejará de estar disponible")).toBeInTheDocument();
    expect(within(dialog).getByText("Activa")).toBeInTheDocument();
    expect(within(dialog).getByText(/La categoría y sus tipos se ocultarán de la app/)).toBeInTheDocument();
    expect(within(dialog).queryByText(/Importante/)).toBeNull();
    expect(within(dialog).getByRole("button", { name: "Cancelar" })).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Desactivar" }));

    await waitFor(() => expect(removed.path).toBe("/catalog-admin/categories/11"));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Catálogo actualizado", type: "success" }));
    await waitFor(() => expect(reload.path).toBe("/catalog-admin/categories"));
  });

  it("una categoría inactiva muestra la rama irreversible y elimina", async () => {
    const removed = stub("delete", "/catalog-admin/categories/12", { success: true });
    const { user } = await open();

    await user.click(within(rowOf("Acceso no autorizado")).getByRole("button", { name: "Eliminar" }));
    const dialog = await dialogOf("Eliminar categoría permanentemente");
    expect(within(dialog).getByText("Esta acción no se puede deshacer")).toBeInTheDocument();
    expect(within(dialog).getByText("La categoría se borrará definitivamente junto con sus 2 tipos.")).toBeInTheDocument();
    expect(within(dialog).getByText("Inactiva")).toBeInTheDocument();
    expect(within(dialog).getByText("Importante:")).toBeInTheDocument();
    expect(within(dialog).getByText(/si la categoría o sus tipos tienen registros históricos/)).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Eliminar permanentemente" }));

    await waitFor(() => expect(removed.path).toBe("/catalog-admin/categories/12"));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Catálogo actualizado", type: "success" }));
  });

  it("si el API no elimina avisa y mantiene abierto el diálogo", async () => {
    stub("delete", "/catalog-admin/categories/11", { success: false, messages: ["No permitido"] });
    const { user } = await open();

    await user.click(within(rowOf("Robo")).getByRole("button", { name: "Eliminar" }));
    const dialog = await dialogOf("Desactivar categoría");
    await user.click(within(dialog).getByRole("button", { name: "Desactivar" }));

    await waitFor(() => expect(toast()).toMatchObject({ message: "No permitido", type: "error" }));
    expect(screen.getByRole("heading", { name: "Desactivar categoría" })).toBeInTheDocument();

    stub("delete", "/catalog-admin/categories/11", { success: false });
    await user.click(within(dialog).getByRole("button", { name: "Desactivar" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "No se pudo eliminar", type: "error" }));
  });
});

// ---------------------------------------------------------------------------
// Diálogo de tipos de una categoría
// ---------------------------------------------------------------------------

describe("tipos de una categoría", () => {
  const openTypes = async (types: CatalogType[] = typesFixture) => {
    const ctx = await open();
    stub("get", "/catalog-admin/types", { success: true, data: types });
    await ctx.user.click(within(rowOf("Robo")).getByRole("button", { name: "Tipos" }));
    const dialog = await dialogOf("Tipos · Robo");
    return { ...ctx, dialog };
  };
  const typeInput = (name: "typeCode" | "typeValue") => {
    const input = document.querySelector<HTMLInputElement>(`input[name="${name}"]`);
    if (!input) throw new Error(`No se encontró el input ${name}`);
    return input;
  };

  it("abre el diálogo y pide los tipos de la categoría", async () => {
    const { dialog } = await openTypes();

    expect(await within(dialog).findByText("Robo a personas")).toBeInTheDocument();
    expect(within(dialog).getByText("THEFT")).toBeInTheDocument();
    expect(within(dialog).getByText("Robo a vivienda")).toBeInTheDocument();
    expect(within(dialog).getByText("2")).toBeInTheDocument();
    expect(within(dialog).getByText("Activo")).toBeInTheDocument();
    expect(within(dialog).getByText("Inactivo")).toBeInTheDocument();
  });

  it("muestra el loader mientras llegan los tipos", async () => {
    const { user } = await open();
    const gate = gatedRequest("get", "/catalog-admin/types", { success: true, data: typesFixture });

    await user.click(within(rowOf("Robo")).getByRole("button", { name: "Tipos" }));
    const dialog = await dialogOf("Tipos · Robo");
    expect(within(dialog).getByRole("status")).toBeInTheDocument();

    await act(async () => {
      gate.release();
    });
    expect(await within(dialog).findByText("Robo a personas")).toBeInTheDocument();
    await waitFor(() => expect(within(dialog).queryByRole("status")).toBeNull());
  });

  it("agrega un tipo normalizando el código a mayúsculas", async () => {
    const created = stub("post", "/catalog-admin/types", { success: true, data: { id: 113 } });
    const { user, dialog } = await openTypes();
    await within(dialog).findByText("Robo a personas");
    const reload = stub("get", "/catalog-admin/types", { success: true, data: typesFixture });

    await user.type(typeInput("typeCode"), " new_type ");
    await user.type(typeInput("typeValue"), "  Tipo nuevo  ");
    expect(within(dialog).getByRole("button", { name: "Agregar tipo" })).toBeEnabled();
    await user.click(within(dialog).getByRole("button", { name: "Agregar tipo" }));

    await waitFor(() => expect(created.body).toEqual({ name: "NEW_TYPE", value: "Tipo nuevo", categoryId: 11 }));
    await waitFor(() => expect(reload.search).toBe("?categoryId=11"));
    expect(typeInput("typeCode")).toHaveValue("");
    expect(typeInput("typeValue")).toHaveValue("");
  });

  it("si el API no agrega muestra el mensaje o el texto por defecto", async () => {
    stub("post", "/catalog-admin/types", { success: false, messages: ["Código duplicado"] });
    const { user, dialog } = await openTypes();
    await within(dialog).findByText("Robo a personas");

    await user.type(typeInput("typeCode"), "dup");
    await user.type(typeInput("typeValue"), "Duplicado");
    await user.click(within(dialog).getByRole("button", { name: "Agregar tipo" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Código duplicado", type: "error" }));

    stub("post", "/catalog-admin/types", { success: false });
    await user.click(within(dialog).getByRole("button", { name: "Agregar tipo" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "No se pudo agregar", type: "error" }));
  });

  it("no agrega si los campos están vacíos o en blanco", async () => {
    const created = stub("post", "/catalog-admin/types");
    const { user, dialog } = await openTypes();
    await within(dialog).findByText("Robo a personas");
    const add = within(dialog).getByRole("button", { name: "Agregar tipo" });

    expect(add).toBeDisabled();
    await user.type(typeInput("typeCode"), "   ");
    await user.type(typeInput("typeValue"), "   ");
    expect(add).toBeDisabled();
    await user.click(add);
    expect(created.method).toBe("");
  });

  it("desactiva un tipo con confirmación (PUT active)", async () => {
    const updated = stub("put", "/catalog-admin/types/111", { success: true });
    const { user, dialog } = await openTypes();
    await within(dialog).findByText("Robo a personas");
    const reload = stub("get", "/catalog-admin/types", { success: true, data: typesFixture });

    await user.click(within(typeRowOf("Robo a personas")).getByRole("button", { name: "Desactivar" }));
    const confirm = await dialogOf("Desactivar tipo");
    expect(within(confirm).getByText(/"Robo a personas" dejará de aparecer en los formularios/)).toBeInTheDocument();
    await user.click(within(confirm).getByRole("button", { name: "Desactivar" }));

    await waitFor(() => expect(updated.body).toEqual({ active: false }));
    await waitFor(() => expect(reload.search).toBe("?categoryId=11"));
    await waitFor(() => expect(screen.queryByRole("heading", { name: "Desactivar tipo" })).toBeNull());
  });

  it("activa un tipo con confirmación (PUT active)", async () => {
    const updated = stub("put", "/catalog-admin/types/112", { success: true });
    const { user, dialog } = await openTypes();
    await within(dialog).findByText("Robo a vivienda");

    await user.click(within(typeRowOf("Robo a vivienda")).getByRole("button", { name: "Activar" }));
    const confirm = await dialogOf("Activar tipo");
    expect(within(confirm).getByText(/"Robo a vivienda" volverá a estar disponible en los formularios/)).toBeInTheDocument();
    await user.click(within(confirm).getByRole("button", { name: "Activar" }));

    await waitFor(() => expect(updated.body).toEqual({ active: true }));
  });

  it("elimina un tipo con confirmación (DELETE)", async () => {
    const removed = stub("delete", "/catalog-admin/types/111", { success: true });
    const { user, dialog } = await openTypes();
    await within(dialog).findByText("Robo a personas");
    const reload = stub("get", "/catalog-admin/types", { success: true, data: typesFixture });

    await user.click(within(typeRowOf("Robo a personas")).getByRole("button", { name: "Eliminar" }));
    const confirm = await dialogOf("Eliminar tipo");
    expect(within(confirm).getByText(/¿Eliminar definitivamente "Robo a personas"\?/)).toBeInTheDocument();
    await user.click(within(confirm).getByRole("button", { name: "Eliminar" }));

    await waitFor(() => expect(removed.path).toBe("/catalog-admin/types/111"));
    await waitFor(() => expect(reload.search).toBe("?categoryId=11"));
    await waitFor(() => expect(screen.queryByRole("heading", { name: "Eliminar tipo" })).toBeNull());
  });

  it("estado vacío cuando la categoría no tiene tipos", async () => {
    const { dialog } = await openTypes([]);
    expect(await within(dialog).findByText("Sin tipos")).toBeInTheDocument();
    expect(within(dialog).getByText("Agrega el primer tipo de esta categoría.")).toBeInTheDocument();
  });

  it("Actualizar del diálogo vuelve a pedir los tipos", async () => {
    const { user, dialog } = await openTypes();
    await within(dialog).findByText("Robo a personas");
    const refresh = stub("get", "/catalog-admin/types", { success: true, data: typesFixture });

    await user.click(within(dialog).getByRole("button", { name: "Actualizar" }));

    await waitFor(() => expect(refresh.search).toBe("?categoryId=11"));
  });
});

// ---------------------------------------------------------------------------
// Componentes en ramas que la página no alcanza
// ---------------------------------------------------------------------------

describe("CatalogDeleteDialog: ramas de tipo", () => {
  const category: CatalogCategory = { id: 11, name: "ROBO", value: "Robo", type: "INCIDENT", active: true, order: 1, _count: { types: 2 } };
  const activeType: CatalogType = { id: 111, name: "THEFT", value: "Robo a personas", categoryId: 11, active: true, order: 1 };
  const inactiveType: CatalogType = { ...activeType, active: false };

  const renderDialog = (target: CatalogDeleteTarget | null, loading = false) => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    return {
      ...renderWithProviders(
        <CatalogDeleteDialog target={target} loading={loading} onClose={onClose} onConfirm={onConfirm} />,
      ),
      onClose,
      onConfirm,
    };
  };

  it("tipo activo: copy de desactivación y botón Desactivar", async () => {
    const { user, onConfirm, onClose } = renderDialog({ kind: "type", type: activeType, category });

    expect(screen.getByRole("heading", { name: "Desactivar tipo" })).toBeInTheDocument();
    expect(screen.getByText("El registro dejará de estar disponible")).toBeInTheDocument();
    expect(screen.getByText(/El tipo se ocultará de los formularios de la app/)).toBeInTheDocument();
    expect(screen.getByText("Activa")).toBeInTheDocument();
    expect(screen.queryByText(/Importante/)).toBeNull();
    await user.click(screen.getByRole("button", { name: "Desactivar" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("tipo inactivo: aviso irreversible, bloque Importante y botón Eliminar permanentemente", async () => {
    const { user, onConfirm } = renderDialog({ kind: "type", type: inactiveType, category });

    expect(screen.getByRole("heading", { name: "Eliminar tipo permanentemente" })).toBeInTheDocument();
    expect(screen.getByText("Esta acción no se puede deshacer")).toBeInTheDocument();
    expect(screen.getByText("El tipo se borrará definitivamente de la base de datos.")).toBeInTheDocument();
    expect(screen.getByText("Inactiva")).toBeInTheDocument();
    expect(screen.getByText("Importante:")).toBeInTheDocument();
    expect(screen.getByText(/si el tipo tiene incidencias o mantenimientos asociados/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Eliminar permanentemente" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("categoría inactiva con un solo tipo pluraliza '1 tipo'", () => {
    renderDialog({
      kind: "category",
      category: { ...category, active: false, _count: { types: 1 } },
    });
    expect(screen.getByText("La categoría se borrará definitivamente junto con sus 1 tipo.")).toBeInTheDocument();
  });

  it("mientras procesa deshabilita los botones y no cierra", async () => {
    const { user, onClose } = renderDialog({ kind: "type", type: activeType, category }, true);

    expect(screen.getByRole("button", { name: "Procesando..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("sin target no renderiza nada", () => {
    const { container } = renderDialog(null);
    expect(container.querySelector("[data-it-dialog]")).toBeNull();
  });
});

describe("CategoryFormModal: estado de envío", () => {
  it("muestra 'Guardando...' y deshabilita los botones mientras envía", async () => {
    const gate = gatedRequest("post", "/catalog-admin/categories", { success: true, data: { id: 1 } });
    const onSuccess = vi.fn();
    const onClose = vi.fn();
    const { user } = renderWithProviders(
      <CategoryFormModal isOpen onClose={onClose} onSuccess={onSuccess} catalogType="INCIDENT" />,
    );

    await user.type(screen.getByLabelText(/Código interno/), "POOL");
    await user.type(screen.getByLabelText(/Nombre visible/), "Alberca");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(screen.getByRole("button", { name: "Guardando..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();

    await act(async () => {
      gate.release();
    });
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
