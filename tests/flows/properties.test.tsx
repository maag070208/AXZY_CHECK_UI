import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import QRCode from "qrcode";
import { describe, expect, it, vi } from "vitest";
import store from "@app/core/store/store";
import { parseImportCsv } from "@app/modules/properties/occupancy/occupancy.service";
import { fail, stub, table } from "../helpers/api";
import { mapProbe } from "../helpers/maps";
import { renderApp } from "../helpers/render";
import { API, server } from "../helpers/server";
import { pickOption } from "../helpers/ui";

/* ------------------------------------------------------------------ */
/* Fixtures locales                                                    */
/* ------------------------------------------------------------------ */

const propTypes = [
  { id: 1, name: "CASA", value: "Casa" },
  { id: 2, name: "DEPARTAMENTO", value: "Departamento" },
];

const propStatuses = [
  { id: 1, name: "VACNT", value: "Disponible" },
  { id: 2, name: "HABIT", value: "Habitada" },
  { id: 3, name: "RENT", value: "En renta" },
];

const properties = [
  {
    id: 1,
    identifier: "CASA-01",
    name: "Casa Pérez",
    typeId: 1,
    type: { id: 1, name: "CASA", value: "Casa" },
    mainStreet: "Av. Universidad",
    betweenStreets: "Madero y Juárez",
    latitude: 32.46,
    longitude: -116.92,
    statusId: 1,
    status: { id: 1, name: "VACNT", value: "Disponible" },
    active: true,
  },
  {
    id: 2,
    identifier: "DEP-102",
    name: "Depto 102",
    typeId: 2,
    type: { id: 2, name: "DEPARTAMENTO", value: "Departamento" },
    mainStreet: "Calle 5",
    statusId: 2,
    status: { id: 2, name: "HABIT", value: "Habitada" },
    active: true,
  },
  {
    id: 3,
    identifier: "CASA-03",
    name: "Casa 3",
    typeId: 3,
    type: undefined,
    mainStreet: "Calle 7",
    statusId: 3,
    status: { id: 3, name: "RENT", value: "En renta" },
    active: true,
  },
  {
    id: 4,
    identifier: "CASA-04",
    name: "Casa 4",
    typeId: 1,
    type: { id: 1, name: "CASA", value: "Casa" },
    mainStreet: "Calle 8",
    statusId: 9,
    status: { id: 9, name: "RARO", value: "Raro" },
    active: true,
  },
];

const stats = {
  properties: 10,
  residents: 24,
  overcrowded: 2,
  byStatus: [
    { code: "VACNT", name: "No habitada", count: 4 },
    { code: "HABIT", name: "Habitada", count: 5 },
    { code: "RENT", name: "En renta", count: 1 },
  ],
};

const occupancyFull = {
  propertyId: 1,
  status: { code: "OWNER_OCCUPIED", name: "Habitada por propietario" },
  residentCount: 3,
  maxResidents: 5,
  overcrowded: false,
  current: {
    id: 11,
    startDate: "2026-01-15T12:00:00.000Z",
    endDate: null,
    status: { code: "OWNER_OCCUPIED", name: "Habitada por propietario" },
    tenant: null,
    owner: { id: 9, firstName: "Ana", lastName: "Pérez" },
    notes: null,
  },
  history: [
    {
      id: 11,
      startDate: "2026-01-15T12:00:00.000Z",
      endDate: null,
      status: { code: "OWNER_OCCUPIED", name: "Habitada por propietario" },
      tenant: null,
      owner: { id: 9, firstName: "Ana", lastName: "Pérez" },
      notes: null,
    },
    {
      id: 10,
      startDate: "2025-02-01T12:00:00.000Z",
      endDate: "2025-12-31T12:00:00.000Z",
      status: { code: "RENTED", name: "En renta" },
      tenant: { id: 8, firstName: "Luis", lastName: "Gómez" },
      owner: null,
      notes: null,
    },
  ],
};

const householdRows = [
  {
    id: 1,
    isPrimary: true,
    canAuthorizeVisits: true,
    hasAppAccess: true,
    person: { id: 9, firstName: "Ana", lastName: "Pérez", phone: "555-100" },
    kind: { code: "OWNER", name: "Propietario", isHouseholdMember: true },
  },
  {
    id: 2,
    isPrimary: false,
    canAuthorizeVisits: true,
    hasAppAccess: false,
    person: { id: 8, firstName: "Luis", lastName: "Gómez" },
    kind: { code: "FAMILY", name: "Familiar", isHouseholdMember: true },
  },
  {
    id: 3,
    isPrimary: false,
    canAuthorizeVisits: false,
    hasAppAccess: false,
    person: { id: 7, firstName: "Eva", lastName: "Gil" },
    kind: { code: "STAFF", name: "Empleado", isHouseholdMember: false },
  },
];

const residentKinds = [
  { code: "OWNER", name: "Propietario", isHouseholdMember: true, canAuthorizeVisits: true, hasAppAccess: true },
  { code: "FAMILY", name: "Familiar", isHouseholdMember: true, canAuthorizeVisits: true, hasAppAccess: false },
  { code: "STAFF", name: "Empleado", isHouseholdMember: false, canAuthorizeVisits: false, hasAppAccess: false },
];

const authorizations = [
  {
    id: 1,
    personId: 5,
    scope: "PEDESTRIAN",
    days: "1,2,3,4,5",
    startTime: "08:00",
    endTime: "16:00",
    validFrom: "2026-01-01",
    validUntil: null,
    revokedAt: null,
    person: { id: 5, firstName: "Ana", lastName: "Pérez" },
  },
  {
    id: 2,
    personId: 6,
    scope: "VEHICLE",
    days: "0,6",
    startTime: "10:00",
    endTime: "20:00",
    validFrom: "2025-01-01",
    validUntil: "2025-12-31",
    revokedAt: "2025-06-01T00:00:00.000Z",
    person: { id: 6, firstName: "Luis", lastName: "Gómez" },
  },
];

const residents = [
  {
    id: 1,
    name: "Ana",
    lastName: "Pérez",
    username: "ana",
    role: "OWNER",
    residentProfile: {
      id: 1,
      userId: 1,
      phoneNumber: "555-123",
      email: "ana@example.com",
      ineFrontUrl: "http://x/front.png",
      ineBackUrl: "http://x/back.png",
      emergencyContact: "Mamá",
      emergencyPhone: "555-999",
      notes: "Alergias",
    },
  },
  {
    id: 2,
    name: "Luis",
    lastName: "Gómez",
    username: "luis",
    role: "TENANT",
    residentProfile: { id: 2, userId: 2 },
  },
];

const propertyFull = properties[0];
const propertyNoGeo = {
  ...properties[1],
  id: 1,
  latitude: undefined,
  longitude: undefined,
  betweenStreets: undefined,
};

const toast = () => store.getState().toast;
const dialogOf = (title: string | RegExp) => screen.findByText(title).then((el) => el.closest("[data-it-dialog]") as HTMLElement);
const rowOf = (text: string) => screen.getByText(text).closest("tr") as HTMLElement;

/* ------------------------------------------------------------------ */
/* Stubs                                                               */
/* ------------------------------------------------------------------ */

function stubCatalogs() {
  stub("get", "/catalog/property_type", { success: true, data: propTypes });
  stub("get", "/catalog/property_status", { success: true, data: propStatuses });
  stub("get", "/catalog/property", { success: true, data: [] });
}

let statsCalls = 0;
function stubStats(data: unknown = stats) {
  statsCalls = 0;
  server.use(
    http.get(`${API}/properties/stats/occupancy`, () => {
      statsCalls += 1;
      return HttpResponse.json({ success: true, data });
    }),
  );
}

const openList = async () => {
  stubCatalogs();
  stubStats();
  const bodies = table("/properties/datatable", properties);
  const r = renderApp({ route: "/properties", role: "ADMIN" });
  return { ...r, bodies, calls: () => statsCalls };
};

/** La página remonta el contenido 500 ms después del montaje: se espera ese ciclo antes de tocar la tabla. */
const openTable = async () => {
  const ctx = await openList();
  await waitFor(() => expect(ctx.calls()).toBeGreaterThanOrEqual(2));
  await ctx.user.click(screen.getByRole("button", { name: "Propiedades" }));
  await waitFor(() => expect(ctx.bodies.length).toBeGreaterThanOrEqual(1));
  await screen.findByText("CASA-01");
  return ctx;
};

interface DetailOptions {
  property?: Record<string, unknown>;
  occupancy?: Record<string, unknown>;
  household?: Record<string, unknown>[];
  auths?: Record<string, unknown>[];
  residents?: Record<string, unknown>[];
  residenceTotal?: number;
  residentsDelay?: number;
}

function stubDetail({
  property = propertyFull,
  occupancy = occupancyFull,
  household = householdRows,
  auths = authorizations,
  residents: residentRows = residents,
  residenceTotal = residentRows.length,
  residentsDelay = 0,
}: DetailOptions = {}) {
  stubCatalogs();
  stub("get", "/properties/1", { success: true, data: property });
  stub("get", "/properties/1/occupancy", { success: true, data: occupancy });
  stub("get", "/properties/1/authorizations", { success: true, data: auths });
  stub("get", "/residents/kinds", { success: true, data: residentKinds });
  server.use(
    http.get(`${API}/properties/1/residents`, async () => {
      if (residentsDelay) await new Promise((r) => setTimeout(r, residentsDelay));
      return HttpResponse.json({ success: true, data: household });
    }),
  );
  const residentBodies: unknown[] = [];
  server.use(
    http.post(`${API}/residents/datatable`, async ({ request }) => {
      residentBodies.push(await request.json());
      return HttpResponse.json({ success: true, data: { rows: residentRows, total: residenceTotal } });
    }),
  );
  return { residentBodies };
}

const openDetail = async (options: DetailOptions = {}) => {
  const spies = stubDetail(options);
  const r = renderApp({ route: "/properties/1", role: "ADMIN" });
  await screen.findByText(`Propiedad ${(options.property ?? propertyFull).identifier}`);
  // Se espera a que los tres paneles resuelvan sus GET para no dejar peticiones en vuelo entre pruebas.
  await screen.findByText("Ocupación", { selector: "h2" });
  await screen.findByText("Hogar", { selector: "h2" });
  await screen.findByText("Personas autorizadas", { selector: "h2" });
  return { ...r, ...spies };
};

/* ------------------------------------------------------------------ */
/* Listado                                                             */
/* ------------------------------------------------------------------ */

describe("propiedades: listado", () => {
  it("alterna Resumen y Propiedades (segmented control)", async () => {
    const { user } = await openList();
    const summary = screen.getByRole("button", { name: "Resumen" });
    const list = screen.getByRole("button", { name: "Propiedades" });
    expect(summary).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Vista general de ocupación y estado del catálogo habitacional.")).toBeInTheDocument();
    await user.click(list);
    expect(list).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Listado completo de casas y departamentos.")).toBeInTheDocument();
    await user.click(summary);
    expect(screen.getByText("Vista general de ocupación y estado del catálogo habitacional.")).toBeInTheDocument();
  });

  it("muestra tipo, ubicación y estados de cada propiedad", async () => {
    await openTable();
    expect(screen.getByText("CASA-01")).toBeInTheDocument();
    expect(within(rowOf("CASA-01")).getByText("CASA")).toBeInTheDocument();
    expect(within(rowOf("DEP-102")).getByText("DEPARTAMENTO")).toBeInTheDocument();
    expect(within(rowOf("CASA-03")).getByText("---")).toBeInTheDocument();
    expect(within(rowOf("CASA-01")).getByText("Av. Universidad")).toBeInTheDocument();
    expect(within(rowOf("CASA-01")).getByText("E/ Madero y Juárez")).toBeInTheDocument();
    expect(within(rowOf("DEP-102")).getByText("Calle 5")).toBeInTheDocument();
    expect(screen.queryByText("E/ undefined")).toBeNull();
    expect(within(rowOf("CASA-01")).getByText("NO HABITADA")).toBeInTheDocument();
    expect(within(rowOf("DEP-102")).getByText("HABITADA")).toBeInTheDocument();
    expect(within(rowOf("CASA-03")).getByText("EN RENTA")).toBeInTheDocument();
    expect(within(rowOf("CASA-04")).getByText("DESCONOCIDO")).toBeInTheDocument();
    // CASA usa icono de casa; departamento, edificio.
    expect(rowOf("CASA-01").querySelector(".text-emerald-500")).not.toBeNull();
    expect(rowOf("DEP-102").querySelector(".text-blue-500")).not.toBeNull();
  });

  it("buscar manda identifier y limpiar lo quita", async () => {
    const { user, bodies } = await openTable();
    await user.type(screen.getByPlaceholderText("Buscar por ID o nombre..."), "casa");
    await waitFor(() => expect(bodies.at(-1)?.filters?.identifier).toBe("casa"));
    await user.click(screen.getByRole("button", { name: "Limpiar búsqueda" }));
    await waitFor(() => expect(bodies.at(-1)?.filters?.identifier).toBe(""));
  });

  it("actualizar vuelve a pedir datos", async () => {
    const { user, bodies } = await openTable();
    const n = bodies.length;
    await user.click(screen.getByRole("button", { name: "Actualizar tabla" }));
    await waitFor(() => expect(bodies.length).toBeGreaterThan(n));
  });

  it("ver detalles navega al expediente", async () => {
    stubDetail();
    const { user } = await openTable();
    await user.click(within(rowOf("CASA-01")).getByRole("button", { name: "Ver detalles" }));
    expect(await screen.findByText("Propiedad CASA-01")).toBeInTheDocument();
  });

  it("imprimir QR escribe el documento en la ventana", async () => {
    const win = { document: { write: vi.fn(), close: vi.fn() } };
    const openSpy = vi.spyOn(window, "open").mockReturnValue(win as never);
    const { user } = await openTable();
    await user.click(within(rowOf("CASA-01")).getByRole("button", { name: "Imprimir QR" }));
    await waitFor(() => expect(openSpy).toHaveBeenCalledWith("", "_blank"));
    expect(win.document.write.mock.calls[0][0]).toContain("<h1>CASA-01</h1>");
    expect(win.document.write.mock.calls[0][0]).toContain("Casa Pérez");
    expect(win.document.write.mock.calls[0][0]).toContain("data:image/png;base64");
    expect(win.document.close).toHaveBeenCalled();
  });

  it("imprimir QR con pop-ups bloqueados avisa", async () => {
    vi.spyOn(window, "open").mockReturnValue(null);
    const { user } = await openTable();
    await user.click(within(rowOf("CASA-01")).getByRole("button", { name: "Imprimir QR" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Pop-ups bloqueados", type: "warning" }));
  });

  it("si falla la generación del QR avisa", async () => {
    vi.spyOn(QRCode, "toDataURL").mockRejectedValue(new Error("x"));
    const { user } = await openTable();
    await user.click(within(rowOf("CASA-01")).getByRole("button", { name: "Imprimir QR" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Error al generar QR", type: "error" }));
  });

  it("si el datatable no responde con éxito deja la tabla vacía", async () => {
    stubCatalogs();
    stubStats();
    let calls = 0;
    server.use(
      http.post(`${API}/properties/datatable`, () => {
        calls += 1;
        return HttpResponse.json({ success: false });
      }),
    );
    const { user } = renderApp({ route: "/properties", role: "ADMIN" });
    await waitFor(() => expect(statsCalls).toBeGreaterThanOrEqual(2));
    await user.click(screen.getByRole("button", { name: "Propiedades" }));
    await waitFor(() => expect(calls).toBeGreaterThanOrEqual(1));
    expect(screen.queryByText("CASA-01")).toBeNull();
  });

  it("abrir Google Maps con coordenadas y sin ellas", async () => {
    const openSpy = vi.spyOn(window, "open").mockReturnValue(null);
    const { user } = await openTable();
    await user.click(within(rowOf("CASA-01")).getByRole("button", { name: "Ver en Google Maps" }));
    expect(openSpy).toHaveBeenCalledWith("https://www.google.com/maps?q=32.46,-116.92", "_blank");
    await user.click(within(rowOf("DEP-102")).getByRole("button", { name: "Ver en Google Maps" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Propiedad sin coordenadas GPS", type: "warning" }));
  });

  it("abrir el modal de importación", async () => {
    const { user } = await openList();
    await user.click(screen.getByRole("button", { name: "Importar CSV" }));
    expect(await screen.findByText("Importar propiedades (CSV)")).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/* Dashboard de ocupación                                              */
/* ------------------------------------------------------------------ */

describe("propiedades: dashboard de ocupación", () => {
  it("muestra KPIs y desglose por estado", async () => {
    await openList();
    await waitFor(() => expect(statsCalls).toBeGreaterThanOrEqual(2));
    expect(await screen.findByText("Propiedades por estado")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("24")).toBeInTheDocument();
    expect(screen.getByText("6 · 60%")).toBeInTheDocument();
    expect(screen.getByText("2.4")).toBeInTheDocument();
    expect(screen.getAllByText("60%").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("20%")).toBeInTheDocument();
    // Desglose por estado (también aparece en el eje del gráfico)
    expect(screen.getAllByText("No habitada").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("4 · 40%")).toBeInTheDocument();
    expect(screen.getByText("5 · 50%")).toBeInTheDocument();
    expect(screen.getByText("1 · 10%")).toBeInTheDocument();
  });

  it("con el catálogo vacío no divide entre cero", async () => {
    stubCatalogs();
    stubStats({ properties: 0, residents: 0, overcrowded: 0, byStatus: [] });
    renderApp({ route: "/properties", role: "ADMIN" });
    await waitFor(() => expect(statsCalls).toBeGreaterThanOrEqual(2));
    expect(await screen.findByText("Propiedades por estado")).toBeInTheDocument();
    expect(screen.getByText("0 · 0%")).toBeInTheDocument();
    expect(screen.getAllByText("0%").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("0").length).toBeGreaterThanOrEqual(2);
    expect(document.body.textContent).not.toMatch(/NaN|Infinity/);
  });

  it("sin datos muestra el estado vacío", async () => {
    stubCatalogs();
    fail("get", "/properties/stats/occupancy", ["x"], 500);
    renderApp({ route: "/properties", role: "ADMIN" });
    await waitFor(() => expect(screen.getByText("Sin datos de ocupación")).toBeInTheDocument());
  });

  it("mientras carga muestra el indicador", async () => {
    stubCatalogs();
    server.use(
      http.get(`${API}/properties/stats/occupancy`, async () => {
        await new Promise((r) => setTimeout(r, 120));
        return HttpResponse.json({ success: true, data: stats });
      }),
    );
    table("/properties/datatable", properties);
    renderApp({ route: "/properties", role: "ADMIN" });
    expect(screen.getAllByRole("status").length).toBeGreaterThanOrEqual(1);
    expect(await screen.findByText("Propiedades por estado")).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/* Alta / edición / baja                                               */
/* ------------------------------------------------------------------ */

const fillCreate = async (user: ReturnType<typeof renderApp>["user"], dialog: HTMLElement, over: Record<string, string> = {}) => {
  await user.type(within(dialog).getByPlaceholderText("Ej. CASA-01, DEP-102"), over.identifier ?? "CASA-99");
  await user.type(within(dialog).getByPlaceholderText("Ej. Casa de la Familia Perez"), over.name ?? "Casa Nueva");
  await pickOption(user, dialog.querySelector('input[name="typeId"]') as HTMLElement, over.type ?? "Casa");
  await user.type(within(dialog).getByPlaceholderText("Ej. Av. Universidad"), over.street ?? "Calle 9");
  await user.type(within(dialog).getByPlaceholderText("Ej. Entre Madero y Juarez"), over.between ?? "Calle 10 y 11");
  await pickOption(user, dialog.querySelector('input[name="statusId"]') as HTMLElement, over.status ?? "Disponible");
  act(() => {
    mapProbe.map!.onClick({ detail: { latLng: { lat: 32.5, lng: -116.9 } } });
  });
};

describe("propiedades: alta", () => {
  const openCreate = async () => {
    const ctx = await openList();
    await ctx.user.click(screen.getByRole("button", { name: /Agregar propiedad/i }));
    const dialog = await dialogOf("Nueva Propiedad");
    return { ...ctx, dialog };
  };

  it("valida los campos requeridos y la ubicación", async () => {
    const { user, dialog } = await openCreate();
    await user.click(within(dialog).getByRole("button", { name: "Guardar" }));
    expect(await within(dialog).findByText("El identificador es obligatorio")).toBeInTheDocument();
    expect(within(dialog).getByText("El nombre/referencia es obligatorio")).toBeInTheDocument();
    expect(within(dialog).getByText("La calle principal es obligatoria")).toBeInTheDocument();
    expect(within(dialog).getByText("El tipo es obligatorio")).toBeInTheDocument();
    expect(within(dialog).getByText("El estado es obligatorio")).toBeInTheDocument();
    expect(within(dialog).getByText("Debes seleccionar un punto")).toBeInTheDocument();
  });

  it("envía el payload y refresca", async () => {
    const created = stub("post", "/properties", { success: true, data: { id: 9 } });
    const { user, dialog, bodies, calls } = await openCreate();
    const n = bodies.length;
    const before = calls();
    await fillCreate(user, dialog);
    await user.click(within(dialog).getByRole("button", { name: "Guardar" }));
    await waitFor(() =>
      expect(created.body).toEqual({
        identifier: "CASA-99",
        name: "Casa Nueva",
        typeId: "1",
        statusId: "1",
        mainStreet: "Calle 9",
        betweenStreets: "Calle 10 y 11",
        latitude: 32.5,
        longitude: -116.9,
      }),
    );
    await waitFor(() => expect(toast()).toMatchObject({ message: "Propiedad creada exitosamente", type: "success" }));
    await waitFor(() => expect(screen.queryByText("Nueva Propiedad")).toBeNull());
    await waitFor(() => expect(calls()).toBeGreaterThan(before));
    expect(bodies.length).toBe(n); // la vista sigue en Resumen: solo se remonta el dashboard
  });

  it("si el API responde sin éxito muestra su mensaje", async () => {
    stub("post", "/properties", { success: false, messages: ["Identificador duplicado"] });
    const { user, dialog } = await openCreate();
    await fillCreate(user, dialog);
    await user.click(within(dialog).getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Identificador duplicado", type: "error" }));
  });

  it("sin éxito y sin mensajes usa el texto por defecto", async () => {
    stub("post", "/properties", { success: false });
    const { user, dialog } = await openCreate();
    await fillCreate(user, dialog);
    await user.click(within(dialog).getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Error al crear", type: "error" }));
  });

  it("error HTTP con mensajes muestra el primero", async () => {
    fail("post", "/properties", ["Nombre inválido"], 400);
    const { user, dialog } = await openCreate();
    await fillCreate(user, dialog);
    await user.click(within(dialog).getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Nombre inválido", type: "error" }));
  });

  it("error HTTP sin mensajes usa el texto por defecto", async () => {
    stub("post", "/properties", {}, 500);
    const { user, dialog } = await openCreate();
    await fillCreate(user, dialog);
    await user.click(within(dialog).getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Error al crear propiedad", type: "error" }));
  });

  it("cancelar cierra el diálogo", async () => {
    const { user, dialog } = await openCreate();
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByText("Nueva Propiedad")).toBeNull());
  });

  it("Escape cierra el diálogo", async () => {
    const { user } = await openCreate();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByText("Nueva Propiedad")).toBeNull());
  });
});

describe("propiedades: edición", () => {
  it("precarga los datos y manda PUT", async () => {
    const updated = stub("put", "/properties/1", { success: true, data: {} });
    const { user, bodies } = await openTable();
    const n = bodies.length;
    await user.click(within(rowOf("CASA-01")).getByRole("button", { name: "Editar" }));
    const dialog = await dialogOf("Editar Propiedad");
    expect(within(dialog).getByPlaceholderText("Ej. CASA-01, DEP-102")).toHaveValue("CASA-01");
    expect(within(dialog).getByPlaceholderText("Ej. Casa de la Familia Perez")).toHaveValue("Casa Pérez");
    expect(within(dialog).getByPlaceholderText("Ej. Av. Universidad")).toHaveValue("Av. Universidad");
    expect(within(dialog).getByDisplayValue("Casa")).toBeInTheDocument();
    await user.clear(within(dialog).getByPlaceholderText("Ej. Casa de la Familia Perez"));
    await user.type(within(dialog).getByPlaceholderText("Ej. Casa de la Familia Perez"), "Casa Pérez 2");
    await user.click(within(dialog).getByRole("button", { name: "Actualizar" }));
    await waitFor(() =>
      expect(updated.body).toMatchObject({
        identifier: "CASA-01",
        name: "Casa Pérez 2",
        typeId: 1,
        statusId: 1,
        mainStreet: "Av. Universidad",
        betweenStreets: "Madero y Juárez",
        latitude: 32.46,
        longitude: -116.92,
      }),
    );
    await waitFor(() => expect(toast()).toMatchObject({ message: "Propiedad actualizada", type: "success" }));
    await waitFor(() => expect(screen.queryByText("Editar Propiedad")).toBeNull());
    await waitFor(() => expect(bodies.length).toBeGreaterThan(n));
  });

  it("si el error es HTTP avisa con el texto por defecto", async () => {
    stub("put", "/properties/1", {}, 500);
    const { user } = await openTable();
    await user.click(within(rowOf("CASA-01")).getByRole("button", { name: "Editar" }));
    const dialog = await dialogOf("Editar Propiedad");
    await user.click(within(dialog).getByRole("button", { name: "Actualizar" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Error al actualizar propiedad", type: "error" }));
  });

  it("si el API falla avisa y mantiene el diálogo", async () => {
    stub("put", "/properties/1", { success: false, messages: ["No autorizado"] });
    const { user } = await openTable();
    await user.click(within(rowOf("CASA-01")).getByRole("button", { name: "Editar" }));
    const dialog = await dialogOf("Editar Propiedad");
    await user.click(within(dialog).getByRole("button", { name: "Actualizar" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "No autorizado", type: "error" }));
    expect(screen.getByText("Editar Propiedad")).toBeInTheDocument();
  });
});

describe("propiedades: baja", () => {
  const openDelete = async (idx = 0) => {
    const ctx = await openTable();
    const identifier = properties[idx].identifier;
    await ctx.user.click(within(rowOf(identifier)).getByRole("button", { name: "Eliminar" }));
    const dialog = (await screen.findByText("Eliminar propiedad", { selector: "h2" })).closest("[data-it-dialog]") as HTMLElement;
    return { ...ctx, dialog, identifier };
  };

  it("pide confirmación, elimina y refresca", async () => {
    const del = stub("delete", "/properties/1", { success: true });
    const { user, dialog, bodies } = await openDelete();
    expect(within(dialog).getByText("CASA-01")).toBeInTheDocument();
    const n = bodies.length;
    await user.click(within(dialog).getByRole("button", { name: "Eliminar propiedad" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Propiedad eliminada", type: "success" }));
    expect(del.path).toBe("/properties/1");
    await waitFor(() => expect(screen.queryByText("Eliminar propiedad")).toBeNull());
    await waitFor(() => expect(bodies.length).toBeGreaterThan(n));
  });

  it("si el API responde sin éxito avisa", async () => {
    stub("delete", "/properties/1", { success: false });
    const { user, dialog } = await openDelete();
    await user.click(within(dialog).getByRole("button", { name: "Eliminar propiedad" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Error al eliminar", type: "error" }));
  });

  it("error HTTP sin mensajes usa el texto por defecto", async () => {
    stub("delete", "/properties/1", {}, 500);
    const { user, dialog } = await openDelete();
    await user.click(within(dialog).getByRole("button", { name: "Eliminar propiedad" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Error al eliminar propiedad", type: "error" }));
  });

  it("cancelar no elimina", async () => {
    const del = stub("delete", "/properties/1");
    const { user, dialog } = await openDelete();
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByText("Eliminar propiedad")).toBeNull());
    expect(del.method).toBe("");
  });
});

/* ------------------------------------------------------------------ */
/* Importación CSV                                                     */
/* ------------------------------------------------------------------ */

describe("propiedades: parseImportCsv", () => {
  it("sin texto o solo encabezado no produce filas", () => {
    expect(parseImportCsv("")).toEqual([]);
    expect(parseImportCsv("\n  \n")).toEqual([]);
    expect(parseImportCsv("identifier,name,mainStreet")).toEqual([]);
  });

  it("ignora líneas vacías, recorta espacios y convierte floor", () => {
    const rows = parseImportCsv(
      "identifier,name,mainStreet,kind,occupancy,floor,unitNumber\n CASA-1 , Casa 1 , Calle A ,HOUSE,VACANT, 2 , 101 \n\nDEP-1,Depto 1,Calle B,APARTMENT,OWNER_OCCUPIED,0,\n",
    );
    expect(rows).toEqual([
      { identifier: "CASA-1", name: "Casa 1", mainStreet: "Calle A", kind: "HOUSE", occupancy: "VACANT", floor: 2, unitNumber: "101" },
      { identifier: "DEP-1", name: "Depto 1", mainStreet: "Calle B", kind: "APARTMENT", occupancy: "OWNER_OCCUPIED", floor: 0, unitNumber: null },
    ]);
  });

  it("floor inválido queda en null y las columnas faltantes en vacío", () => {
    const [row] = parseImportCsv("identifier,name,mainStreet,kind,occupancy,floor,unitNumber\nA,B,C,HOUSE,VACANT,planta,\n");
    expect(row).toMatchObject({ floor: null, unitNumber: null });
    const [short] = parseImportCsv("identifier,name,mainStreet\nA,B\n");
    expect(short).toEqual({
      identifier: "A",
      name: "B",
      mainStreet: "",
      kind: undefined,
      occupancy: undefined,
      floor: null,
      unitNumber: null,
    });
  });
});

const CSV = [
  "identifier,name,mainStreet,kind,occupancy,floor,unitNumber",
  "CASA-001,Casa 1,Calle Aries,HOUSE,VACANT,,",
  "DEP-101,Depto 101,Av. Central,APARTMENT,VACANT,1,101",
].join("\n");

async function uploadCsv(user: ReturnType<typeof renderApp>["user"], name: string, text: string) {
  const input = document.querySelector<HTMLInputElement>('input[type="file"]');
  expect(input).not.toBeNull();
  await user.upload(input!, new File([text], name, { type: "text/csv" }));
  const confirm = await screen.findByRole("button", { name: /^confirmar$/i });
  vi.useFakeTimers({ toFake: ["setTimeout"] });
  try {
    fireEvent.click(confirm);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1600);
    });
  } finally {
    vi.useRealTimers();
  }
}

describe("propiedades: importar CSV", () => {
  const openImport = async () => {
    const ctx = await openList();
    await ctx.user.click(screen.getByRole("button", { name: "Importar CSV" }));
    const dialog = await dialogOf("Importar propiedades (CSV)");
    return { ...ctx, dialog };
  };

  it("sube el CSV, previsualiza filas e importa", async () => {
    const imported = stub("post", "/properties/import", {
      success: true,
      data: { created: 1, createdIds: [10], errors: [{ row: 3, messages: ["kind inválido"] }] },
    });
    const { user, dialog } = await openImport();
    await uploadCsv(user, "props.csv", CSV);
    expect(await screen.findByText(/props\.csv: 2 fila\(s\)/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: /^Importar$/ }));
    await waitFor(() =>
      expect(imported.body).toEqual({
        rows: [
          { identifier: "CASA-001", name: "Casa 1", mainStreet: "Calle Aries", kind: "HOUSE", occupancy: "VACANT", floor: null, unitNumber: null },
          { identifier: "DEP-101", name: "Depto 101", mainStreet: "Av. Central", kind: "APARTMENT", occupancy: "VACANT", floor: 1, unitNumber: "101" },
        ],
      }),
    );
    expect(await within(dialog).findByText("Creadas: 1")).toBeInTheDocument();
    expect(within(dialog).getByText("Fila 3: kind inválido")).toBeInTheDocument();
  });

  it("si el API responde sin éxito muestra el mensaje", async () => {
    stub("post", "/properties/import", { success: false, messages: ["CSV inválido"] });
    const { user, dialog } = await openImport();
    await uploadCsv(user, "props.csv", CSV);
    await screen.findByText(/props\.csv: 2 fila\(s\)/);
    await user.click(within(dialog).getByRole("button", { name: /^Importar$/ }));
    expect(await within(dialog).findByText("CSV inválido")).toBeInTheDocument();
  });

  it("error HTTP al importar muestra el mensaje", async () => {
    fail("post", "/properties/import", ["Servidor caído"], 500);
    const { user, dialog } = await openImport();
    await uploadCsv(user, "props.csv", CSV);
    await screen.findByText(/props\.csv: 2 fila\(s\)/);
    await user.click(within(dialog).getByRole("button", { name: /^Importar$/ }));
    expect(await within(dialog).findByText("Servidor caído")).toBeInTheDocument();
  });

  it("descarga la plantilla CSV", async () => {
    const { user, dialog } = await openImport();
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const createSpy = URL.createObjectURL as unknown as ReturnType<typeof vi.fn>;
    const revokeSpy = URL.revokeObjectURL as unknown as ReturnType<typeof vi.fn>;
    createSpy.mockClear();
    revokeSpy.mockClear();
    await user.click(within(dialog).getByRole("button", { name: "Descargar plantilla" }));
    expect(createSpy).toHaveBeenCalledWith(expect.any(Blob));
    expect(revokeSpy).toHaveBeenCalledWith("blob:test/1");
    expect(clickSpy).toHaveBeenCalled();
    const blob = createSpy.mock.calls[0][0] as Blob;
    expect(await blob.text()).toContain("identifier,name,mainStreet,kind,occupancy");
  });

  it("rechaza importar sin archivo (botón deshabilitado)", async () => {
    const { dialog } = await openImport();
    expect(within(dialog).getByRole("button", { name: /^Importar$/ })).toBeDisabled();
  });
});

/* ------------------------------------------------------------------ */
/* Expediente de propiedad                                             */
/* ------------------------------------------------------------------ */

const sectionOf = (title: string) => screen.getByText(title, { selector: "h2" }).closest("section") as HTMLElement;

describe("propiedades: expediente", () => {
  it("muestra el indicador mientras carga", async () => {
    stubDetail();
    server.use(
      http.get(`${API}/properties/1`, async () => {
        await new Promise((r) => setTimeout(r, 150));
        return HttpResponse.json({ success: true, data: propertyFull });
      }),
    );
    renderApp({ route: "/properties/1", role: "ADMIN" });
    expect(screen.getByText("Cargando expediente de propiedad...")).toBeInTheDocument();
    expect(await screen.findByText("Propiedad CASA-01")).toBeInTheDocument();
    await screen.findByText("Hogar", { selector: "h2" });
    await screen.findByText("Personas autorizadas", { selector: "h2" });
  });

  it("muestra datos, mapa, ocupación, hogar, autorizaciones y censo", async () => {
    const openSpy = vi.spyOn(window, "open").mockReturnValue(null);
    const { user } = await openDetail();
    expect(screen.getByText("Propiedad CASA-01")).toBeInTheDocument();
    expect(screen.getByText("Casa Pérez")).toBeInTheDocument();
    expect(screen.getByText("NO HABITADA")).toBeInTheDocument();
    expect(screen.getByText("Resumen Ejecutivo")).toBeInTheDocument();
    expect(screen.getByText("Calle Principal")).toBeInTheDocument();
    expect(screen.getByText("Av. Universidad")).toBeInTheDocument();
    expect(screen.getByText("Entre calles / Ref.")).toBeInTheDocument();
    expect(screen.getByText("Madero y Juárez")).toBeInTheDocument();
    expect(screen.getByTestId("map")).toBeInTheDocument();
    expect(mapProbe.map).toMatchObject({ defaultCenter: { lat: 32.46, lng: -116.92 }, defaultZoom: 17 });
    await waitFor(() => expect(screen.getByText("Residentes activos").parentElement?.textContent).toContain("2"));
    expect(screen.getByText("Tipo de Vivienda").parentElement?.textContent).toContain("Casa");
    await screen.findByText("@ana");
    await screen.findByText("Ocupación", { selector: "h2" });
    await screen.findByText("Hogar", { selector: "h2" });
    await screen.findByText("Personas autorizadas", { selector: "h2" });

    const occupancy = sectionOf("Ocupación");
    expect(within(occupancy).getByText("3 residente(s) de 5 máximo")).toBeInTheDocument();
    expect(within(occupancy).getAllByText("Habitada por propietario").length).toBeGreaterThanOrEqual(1);
    expect(within(occupancy).getByText(/Propietario que habita: Ana/)).toBeInTheDocument();
    expect(within(occupancy).getByText(/En renta · Luis/)).toBeInTheDocument();
    expect(within(occupancy).getByText(/vigente/)).toBeInTheDocument();

    const household = sectionOf("Hogar");
    expect(within(household).getByText(/Ana Pérez/)).toBeInTheDocument();
    expect(within(household).getByText("Titular")).toBeInTheDocument();
    expect(within(household).getByText(/Luis Gómez/)).toBeInTheDocument();
    expect(within(household).getByText("(no cuenta en el hogar)")).toBeInTheDocument();

    const auths = sectionOf("Personas autorizadas");
    expect(within(auths).getByText(/Peatón · Lun Mar Mié Jue Vie 08:00–16:00/)).toBeInTheDocument();
    expect(within(auths).getByText(/Vehículo · Dom Sáb 10:00–20:00/)).toBeInTheDocument();
    expect(within(auths).getByText("Revocada")).toBeInTheDocument();

    expect(screen.getByText("Censo de Residentes")).toBeInTheDocument();
    expect(within(rowOf("@ana")).getByText("Ana Pérez")).toBeInTheDocument();
    expect(within(rowOf("@ana")).getByText("Propietario")).toBeInTheDocument();
    expect(within(rowOf("@ana")).getByText("555-123")).toBeInTheDocument();
    expect(within(rowOf("@ana")).getByText("ana@example.com")).toBeInTheDocument();
    expect(within(rowOf("@luis")).getByText("Inquilino")).toBeInTheDocument();
    expect(within(rowOf("@luis")).getByText("Sin teléfono")).toBeInTheDocument();

    await user.click(await screen.findByRole("button", { name: /Abrir Navegación/i }));
    expect(openSpy).toHaveBeenCalledWith("https://www.google.com/maps?q=32.46,-116.92", "_blank");
  });

  it("sin coordenadas avisa y no dibuja mapa", async () => {
    await openDetail({ property: propertyNoGeo });
    expect(screen.getByText("Propiedad DEP-102")).toBeInTheDocument();
    expect(screen.getByText("HABITADA")).toBeInTheDocument();
    expect(screen.getByText("Calle 5")).toBeInTheDocument();
    expect(screen.getByText("Sin coordenadas GPS")).toBeInTheDocument();
    expect(screen.getByText("No hay una geolocalización vinculada para visualizar el mapa.")).toBeInTheDocument();
    expect(screen.queryByTestId("map")).toBeNull();
    expect(screen.queryByText("Entre calles / Ref.")).toBeNull();
    expect(screen.queryByText("Abrir Navegación")).toBeNull();
  });

  it("aplica el rol: ADMIN y SHIFT ven Editar, un guardia no", async () => {
    stubDetail();
    const admin = renderApp({ route: "/properties/1", role: "ADMIN" });
    await screen.findByText("Propiedad CASA-01");
    await screen.findByText("Hogar", { selector: "h2" });
    await screen.findByText("Personas autorizadas", { selector: "h2" });
    expect(screen.getByRole("button", { name: /Editar/ })).toBeInTheDocument();
    admin.unmount();

    stubDetail();
    const guard = renderApp({ route: "/properties/1", role: "GUARD" });
    await screen.findByText("Propiedad CASA-01");
    await screen.findByText("Hogar", { selector: "h2" });
    await screen.findByText("Personas autorizadas", { selector: "h2" });
    expect(screen.queryByRole("button", { name: /Editar/ })).toBeNull();
    expect(screen.getByRole("button", { name: /Imprimir QR/ })).toBeInTheDocument();
    guard.unmount();

    stubDetail();
    renderApp({ route: "/properties/1", role: "SHIFT" });
    await screen.findByText("Propiedad CASA-01");
    await screen.findByText("Hogar", { selector: "h2" });
    expect(screen.getByRole("button", { name: /Editar/ })).toBeInTheDocument();
  });

  it("acepta el estado como texto plano", async () => {
    await openDetail({ property: { ...propertyFull, status: "RENT" } });
    expect(screen.getByText("EN RENTA")).toBeInTheDocument();
  });

  it("edita desde el expediente", async () => {
    const updated = stub("put", "/properties/1", { success: true, data: {} });
    const { user } = await openDetail();
    await user.click(screen.getByRole("button", { name: /Editar/ }));
    const dialog = await dialogOf("Editar Propiedad");
    await user.clear(within(dialog).getByPlaceholderText("Ej. Casa de la Familia Perez"));
    await user.type(within(dialog).getByPlaceholderText("Ej. Casa de la Familia Perez"), "Casa Renombrada");
    await user.click(within(dialog).getByRole("button", { name: "Actualizar" }));
    await waitFor(() => expect(updated.body).toMatchObject({ identifier: "CASA-01", name: "Casa Renombrada" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Propiedad actualizada", type: "success" }));
    await waitFor(() => expect(screen.queryByText("Editar Propiedad")).toBeNull());
  });

  it("si la edición falla avisa y dejando el diálogo abierto", async () => {
    stub("put", "/properties/1", { success: false, messages: ["Sin permiso"] });
    const { user } = await openDetail();
    await user.click(screen.getByRole("button", { name: /Editar/ }));
    const dialog = await dialogOf("Editar Propiedad");
    await user.click(within(dialog).getByRole("button", { name: "Actualizar" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Sin permiso", type: "error" }));
    expect(screen.getByText("Editar Propiedad")).toBeInTheDocument();
  });

  it("si la edición falla por HTTP avisa con el texto por defecto", async () => {
    stub("put", "/properties/1", {}, 500);
    const { user } = await openDetail();
    await user.click(screen.getByRole("button", { name: /Editar/ }));
    const dialog = await dialogOf("Editar Propiedad");
    await user.click(within(dialog).getByRole("button", { name: "Actualizar" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Error al actualizar propiedad", type: "error" }));
  });

  it("si falla la generación del QR avisa", async () => {
    vi.spyOn(QRCode, "toDataURL").mockRejectedValue(new Error("x"));
    const { user } = await openDetail();
    await user.click(screen.getByRole("button", { name: /Imprimir QR/ }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Error al generar QR", type: "error" }));
  });

  it("imprime el QR del expediente y avisa si el pop-up está bloqueado", async () => {
    const win = { document: { write: vi.fn(), close: vi.fn() } };
    const openSpy = vi.spyOn(window, "open").mockReturnValueOnce(null).mockReturnValue(win as never);
    const { user } = await openDetail();
    await user.click(screen.getByRole("button", { name: /Imprimir QR/ }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Pop-ups bloqueados", type: "warning" }));
    await user.click(screen.getByRole("button", { name: /Imprimir QR/ }));
    await waitFor(() => expect(openSpy).toHaveBeenCalledTimes(2));
    expect(win.document.write.mock.calls[0][0]).toContain("<h1>CASA-01</h1>");
    expect(win.document.write.mock.calls[0][0]).toContain("Casa Pérez");
    expect(win.document.close).toHaveBeenCalled();
  });

  it("abre el expediente del residente con y sin INE/notas", async () => {
    const { user } = await openDetail();
    await screen.findByText("@ana");
    await user.click(within(rowOf("@ana")).getByRole("button", { name: "Ver detalles" }));
    const dialog = (await screen.findByText("Canales de Comunicación")).closest("[data-it-dialog]") as HTMLElement;
    expect(within(dialog).getByText("555-123")).toBeInTheDocument();
    expect(within(dialog).getByText("ana@example.com")).toBeInTheDocument();
    expect(within(dialog).getByText("PROPIETARIO")).toBeInTheDocument();
    expect(within(dialog).getByText("Mamá")).toBeInTheDocument();
    expect(within(dialog).getByText("555-999")).toBeInTheDocument();
    expect(within(dialog).getByText("Validación Documental")).toBeInTheDocument();
    expect(within(dialog).getAllByAltText("INE")).toHaveLength(2);
    expect(within(dialog).getByText(/Alergias/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Cerrar Expediente de Propiedad" }));
    await waitFor(() => expect(screen.queryByText("Canales de Comunicación")).toBeNull());

    await user.click(within(rowOf("@luis")).getByRole("button", { name: "Ver detalles" }));
    const empty = (await screen.findByText("Canales de Comunicación")).closest("[data-it-dialog]") as HTMLElement;
    expect(within(empty).getByText("Sin Documentación")).toBeInTheDocument();
    expect(within(empty).getAllByText("No registrado")).toHaveLength(2);
    expect(within(empty).getByText("SIN CONTACTO ASIGNADO")).toBeInTheDocument();
    expect(within(empty).getByText("-- --- ----")).toBeInTheDocument();
    expect(within(empty).queryByText("Observaciones del Expediente")).toBeNull();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByText("Canales de Comunicación")).toBeNull());
  });

  it("404 con success=false avisa y permite volver al listado", async () => {
    stubCatalogs();
    stub("get", "/properties/1", { success: false, messages: ["No existe"] });
    stubStats();
    table("/properties/datatable", properties);
    const { user } = renderApp({ route: "/properties/1", role: "ADMIN" });
    expect(await screen.findByText("Propiedad no encontrada")).toBeInTheDocument();
    await waitFor(() => expect(toast()).toMatchObject({ message: "No se pudo cargar la propiedad", type: "error" }));
    await user.click(screen.getByRole("button", { name: "Volver al listado" }));
    expect(await screen.findByPlaceholderText("Buscar por ID o nombre...")).toBeInTheDocument();
  });

  it("error HTTP también muestra la pantalla de no encontrada", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    stubCatalogs();
    fail("get", "/properties/1", ["boom"], 500);
    renderApp({ route: "/properties/1", role: "ADMIN" });
    expect(await screen.findByText("Propiedad no encontrada")).toBeInTheDocument();
    expect(spy).toHaveBeenCalled();
    await waitFor(() => expect(toast()).toMatchObject({ message: "boom", type: "error" }));
  });

  it("reintenta la carga y muestra el expediente cuando el API se recupera", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    stubDetail();
    let attempts = 0;
    server.use(
      http.get(`${API}/properties/1`, () => {
        attempts += 1;
        if (attempts === 1) {
          return HttpResponse.json({ success: false, message: "boom", messages: ["boom"] }, { status: 500 });
        }
        return HttpResponse.json({ success: true, data: propertyFull });
      }),
    );
    const { user } = renderApp({ route: "/properties/1", role: "ADMIN" });
    expect(await screen.findByText("Propiedad no encontrada")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByText("Propiedad CASA-01")).toBeInTheDocument();
    await screen.findByText("Ocupación", { selector: "h2" });
    await screen.findByText("Hogar", { selector: "h2" });
    await screen.findByText("Personas autorizadas", { selector: "h2" });
    expect(attempts).toBe(2);
  });

});

/* ------------------------------------------------------------------ */
/* Ocupación                                                           */
/* ------------------------------------------------------------------ */

const occupancyStatuses = [
  { id: 1, code: "OWNER_OCCUPIED", name: "Habitada por propietario", isOccupied: true, allowsResidents: true, allowedNext: ["VACANT", "RENTED", "OWNER_OCCUPIED"] },
  { id: 2, code: "VACANT", name: "No habitada", isOccupied: false, allowsResidents: false, allowedNext: ["OWNER_OCCUPIED", "RENTED"] },
  { id: 3, code: "RENTED", name: "En renta", isOccupied: true, allowsResidents: true, allowedNext: ["VACANT"] },
];

const openOccupancyModal = async (opts: DetailOptions = {}) => {
  stub("get", "/properties/occupancy-statuses", { success: true, data: occupancyStatuses });
  const ctx = await openDetail(opts);
  await screen.findByRole("button", { name: "Cambiar ocupación" });
  await ctx.user.click(screen.getByRole("button", { name: "Cambiar ocupación" }));
  const dialog = (await screen.findByText("Cambiar ocupación", { selector: "h2" })).closest("[data-it-dialog]") as HTMLElement;
  return { ...ctx, dialog };
};

describe("propiedades: ocupación", () => {
  it("muestra el error de carga y reintenta", async () => {
    stubDetail();
    let attempts = 0;
    server.use(
      http.get(`${API}/properties/1/occupancy`, () => {
        attempts += 1;
        if (attempts === 1) return HttpResponse.json({ success: false, messages: ["Sin ocupación"] });
        return HttpResponse.json({ success: true, data: occupancyFull });
      }),
    );
    const { user } = renderApp({ route: "/properties/1", role: "ADMIN" });
    await screen.findByText("Propiedad CASA-01");
    await screen.findByText("Ocupación", { selector: "h2" });
    expect(await within(sectionOf("Ocupación")).findByRole("alert")).toHaveTextContent("Sin ocupación");
    await user.click(within(sectionOf("Ocupación")).getByRole("button", { name: "Reintentar" }));
    await waitFor(() => expect(within(sectionOf("Ocupación")).getByText("3 residente(s) de 5 máximo")).toBeInTheDocument());
    expect(attempts).toBe(2);
  });

  it("muestra el error HTTP de carga y reintenta", async () => {
    stubDetail();
    let attempts = 0;
    server.use(
      http.get(`${API}/properties/1/occupancy`, () => {
        attempts += 1;
        if (attempts === 1) {
          return HttpResponse.json({ success: false, message: "boom", messages: ["boom"] }, { status: 500 });
        }
        return HttpResponse.json({ success: true, data: occupancyFull });
      }),
    );
    const { user } = renderApp({ route: "/properties/1", role: "ADMIN" });
    await screen.findByText("Propiedad CASA-01");
    await screen.findByText("Ocupación", { selector: "h2" });
    expect(await within(sectionOf("Ocupación")).findByRole("alert")).toHaveTextContent("boom");
    await user.click(within(sectionOf("Ocupación")).getByRole("button", { name: "Reintentar" }));
    await waitFor(() => expect(within(sectionOf("Ocupación")).getByText("3 residente(s) de 5 máximo")).toBeInTheDocument());
    expect(attempts).toBe(2);
  });

  it("muestra sobreocupación, estado nulo e historial vacío", async () => {
    await openDetail({
      occupancy: {
        propertyId: 1,
        status: null,
        residentCount: 6,
        maxResidents: null,
        overcrowded: true,
        current: null,
        history: [],
      },
    });
    await screen.findByText("Ocupación", { selector: "h2" });
    const panel = sectionOf("Ocupación");
    expect(within(panel).getByText("Sin estado")).toBeInTheDocument();
    expect(within(panel).getByText("6 residente(s)")).toBeInTheDocument();
    expect(within(panel).getByRole("alert")).toHaveTextContent("Sobreocupación");
    expect(within(panel).getByText("Sin historial")).toBeInTheDocument();
  });

  it("cambia la ocupación y recarga", async () => {
    const changed = stub("post", "/properties/1/occupancy", { success: true, data: {} });
    const { user, dialog } = await openOccupancyModal();
    expect(within(dialog).getByText(/Estado actual:/)).toBeInTheDocument();
    expect(within(dialog).getAllByText(/Habitada por propietario/).length).toBeGreaterThanOrEqual(1);
    await user.selectOptions(within(dialog).getByLabelText("Nuevo estado"), "VACANT");
    await user.type(within(dialog).getByLabelText("Notas (opcional)"), "Se mudaron");
    await user.click(within(dialog).getByRole("button", { name: "Confirmar cambio" }));
    await waitFor(() =>
      expect(changed.body).toEqual({
        status: "VACANT",
        tenantPersonId: null,
        releaseResidents: false,
        notes: "Se mudaron",
      }),
    );
    await waitFor(() => expect(screen.queryByText("Cambiar ocupación", { selector: "h2" })).toBeNull());
  });

  it("exige elegir estado y, si es rentada, inquilino", async () => {
    const changed = stub("post", "/properties/1/occupancy");
    const { user, dialog } = await openOccupancyModal();
    await user.click(within(dialog).getByRole("button", { name: "Confirmar cambio" }));
    expect(await within(dialog).findByText("Elige el nuevo estado")).toBeInTheDocument();
    await user.selectOptions(within(dialog).getByLabelText("Nuevo estado"), "RENTED");
    await user.click(within(dialog).getByRole("button", { name: "Confirmar cambio" }));
    expect(await within(dialog).findByText("Una propiedad rentada necesita un inquilino")).toBeInTheDocument();
    expect(changed.method).toBe("");
  });

  it("busca al inquilino y lo manda en el cambio", async () => {
    const changed = stub("post", "/properties/1/occupancy", { success: true, data: {} });
    stub("get", "/persons", { success: true, data: [{ id: 7, firstName: "Marta", lastName: "Ruiz", phone: "555-777" }] });
    const { user, dialog } = await openOccupancyModal();
    await user.selectOptions(within(dialog).getByLabelText("Nuevo estado"), "RENTED");
    await user.type(within(dialog).getByLabelText("Inquilino"), "Ma");
    const option = await within(dialog).findByRole("button", { name: /Marta Ruiz/ });
    await user.click(option);
    expect(within(dialog).getByText("Seleccionado: Marta Ruiz")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Confirmar cambio" }));
    await waitFor(() => expect(changed.body).toMatchObject({ status: "RENTED", tenantPersonId: 7 }));
  });

  it("crea una persona nueva desde la búsqueda de inquilino", async () => {
    const changed = stub("post", "/properties/1/occupancy", { success: true, data: {} });
    const person = stub("post", "/persons", { success: true, data: { id: 21, firstName: "Nueva", lastName: "Persona" } });
    stub("get", "/persons", { success: true, data: [] });
    const { user, dialog } = await openOccupancyModal();
    await user.selectOptions(within(dialog).getByLabelText("Nuevo estado"), "RENTED");
    await user.type(within(dialog).getByLabelText("Inquilino"), "Nueva Persona");
    await user.click(await within(dialog).findByRole("button", { name: /Crear persona/ }));
    await waitFor(() => expect(person.body).toEqual({ firstName: "Nueva", lastName: "Persona" }));
    expect(await within(dialog).findByText("Seleccionado: Nueva Persona")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Confirmar cambio" }));
    await waitFor(() => expect(changed.body).toMatchObject({ tenantPersonId: 21 }));
  });

  it("si no se puede crear la persona muestra el mensaje", async () => {
    stub("post", "/persons", { success: false, messages: ["Persona duplicada"] });
    stub("get", "/persons", { success: true, data: [] });
    const { user, dialog } = await openOccupancyModal();
    await user.selectOptions(within(dialog).getByLabelText("Nuevo estado"), "RENTED");
    await user.type(within(dialog).getByLabelText("Inquilino"), "Nueva Persona");
    await user.click(await within(dialog).findByRole("button", { name: /Crear persona/ }));
    expect(await within(dialog).findByText("Persona duplicada")).toBeInTheDocument();
  });

  it("pide confirmar la baja de residentes (code OCCUPANCY_HAS_RESIDENTS)", async () => {
    const bodies: any[] = [];
    server.use(
      http.post(`${API}/properties/1/occupancy`, async ({ request }) => {
        bodies.push(await request.json());
        if (bodies.length === 1) {
          return HttpResponse.json(
            { success: false, code: "OCCUPANCY_HAS_RESIDENTS", messages: ["Hay residentes"] },
            { status: 400 },
          );
        }
        return HttpResponse.json({ success: true, data: {} });
      }),
    );
    const { user, dialog } = await openOccupancyModal();
    await user.selectOptions(within(dialog).getByLabelText("Nuevo estado"), "VACANT");
    await user.click(within(dialog).getByRole("button", { name: "Confirmar cambio" }));
    expect(
      await within(dialog).findByText("La propiedad tiene residentes activos. Confirma su baja para continuar."),
    ).toBeInTheDocument();
    const confirm = within(dialog).getByRole("button", { name: "Confirmar cambio" });
    expect(confirm).toBeDisabled();
    await user.click(within(dialog).getByLabelText(/Confirmo la baja de los residentes activos/));
    expect(confirm).not.toBeDisabled();
    await user.click(confirm);
    await waitFor(() => expect(bodies).toHaveLength(2));
    expect(bodies[0].releaseResidents).toBe(false);
    expect(bodies[1].releaseResidents).toBe(true);
    await waitFor(() => expect(screen.queryByText("Cambiar ocupación", { selector: "h2" })).toBeNull());
  });

  it("otros errores del API se muestran y cancelar cierra", async () => {
    fail("post", "/properties/1/occupancy", ["Estado no permitido"], 400);
    const { user, dialog } = await openOccupancyModal();
    await user.selectOptions(within(dialog).getByLabelText("Nuevo estado"), "VACANT");
    await user.click(within(dialog).getByRole("button", { name: "Confirmar cambio" }));
    expect(await within(dialog).findByText("Estado no permitido")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByText("Cambiar ocupación", { selector: "h2" })).toBeNull());
  });

  it("sin estados siguientes deshabilita el selector", async () => {
    stub("get", "/properties/occupancy-statuses", {
      success: true,
      data: [{ ...occupancyStatuses[0], code: "OTRO", allowedNext: [] }],
    });
    const { user } = await openDetail();
    await user.click(await screen.findByRole("button", { name: "Cambiar ocupación" }));
    const dialog = (await screen.findByText("Cambiar ocupación", { selector: "h2" })).closest("[data-it-dialog]") as HTMLElement;
    expect(within(dialog).getByLabelText("Nuevo estado")).toBeDisabled();
    expect(within(dialog).getByText("Sin cambios disponibles")).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/* Hogar                                                               */
/* ------------------------------------------------------------------ */

describe("propiedades: hogar", () => {
  const hogar = async (opts: DetailOptions = {}) => {
    const ctx = await openDetail(opts);
    await screen.findByText("Hogar", { selector: "h2" });
    return { ...ctx, panel: sectionOf("Hogar") };
  };

  it("muestra el error de carga y reintenta", async () => {
    stubDetail();
    let attempts = 0;
    server.use(
      http.get(`${API}/properties/1/residents`, () => {
        attempts += 1;
        if (attempts === 1) {
          return HttpResponse.json({ success: false, message: "boom", messages: ["boom"] }, { status: 500 });
        }
        return HttpResponse.json({ success: true, data: householdRows });
      }),
    );
    const { user } = renderApp({ route: "/properties/1", role: "ADMIN" });
    await screen.findByText("Propiedad CASA-01");
    await screen.findByText("Hogar", { selector: "h2" });
    expect(await within(sectionOf("Hogar")).findByRole("alert")).toHaveTextContent("boom");
    await user.click(within(sectionOf("Hogar")).getByRole("button", { name: "Reintentar" }));
    await waitFor(() => expect(within(sectionOf("Hogar")).getByText(/Ana Pérez/)).toBeInTheDocument());
    expect(attempts).toBe(2);
  });

  it("muestra el error success=false del hogar y reintenta", async () => {
    stubDetail();
    let attempts = 0;
    server.use(
      http.get(`${API}/properties/1/residents`, () => {
        attempts += 1;
        if (attempts === 1) return HttpResponse.json({ success: false, messages: ["Sin hogar"] });
        return HttpResponse.json({ success: true, data: householdRows });
      }),
    );
    const { user } = renderApp({ route: "/properties/1", role: "ADMIN" });
    await screen.findByText("Propiedad CASA-01");
    await screen.findByText("Hogar", { selector: "h2" });
    expect(await within(sectionOf("Hogar")).findByRole("alert")).toHaveTextContent("Sin hogar");
    await user.click(within(sectionOf("Hogar")).getByRole("button", { name: "Reintentar" }));
    await waitFor(() => expect(within(sectionOf("Hogar")).getByText(/Ana Pérez/)).toBeInTheDocument());
    expect(attempts).toBe(2);
  });

  it("si fallan los tipos de residente el hogar sigue visible", async () => {
    stubDetail();
    fail("get", "/residents/kinds", ["boom"], 500);
    renderApp({ route: "/properties/1", role: "ADMIN" });
    await screen.findByText("Propiedad CASA-01");
    await screen.findByText("Hogar", { selector: "h2" });
    expect(within(sectionOf("Hogar")).getByText(/Ana Pérez/)).toBeInTheDocument();
  });

  it("lista integrantes, titular y quién no cuenta", async () => {
    const { panel } = await hogar();
    expect(within(panel).getByText(/Ana Pérez/)).toBeInTheDocument();
    expect(within(panel).getByText("Titular")).toBeInTheDocument();
    expect(within(panel).getByText(/Luis Gómez/)).toBeInTheDocument();
    expect(within(panel).getByText(/Eva Gil/)).toBeInTheDocument();
    expect(within(panel).getByText("(no cuenta en el hogar)")).toBeInTheDocument();
    expect(within(panel).getAllByRole("button", { name: "Hacer titular" })).toHaveLength(1);
  });

  it("agrega una persona nueva y limpia el formulario", async () => {
    const added = stub("post", "/properties/1/residents", { success: true, data: { id: 30 } });
    const { user, panel } = await hogar();
    const button = within(panel).getByRole("button", { name: "Agregar al hogar" });
    expect(button).toBeDisabled();
    await user.type(within(panel).getByLabelText("Nombre"), "Marta");
    await user.type(within(panel).getByLabelText("Apellidos"), "Ruiz");
    await user.type(within(panel).getByLabelText("Teléfono"), "555-100");
    expect(button).not.toBeDisabled();
    await user.click(button);
    await waitFor(() =>
      expect(added.body).toEqual({
        firstName: "Marta",
        lastName: "Ruiz",
        phone: "555-100",
        kindCode: "FAMILY",
        confirmNewPerson: false,
      }),
    );
    await waitFor(() => expect(within(sectionOf("Hogar")).getByLabelText("Nombre")).toHaveValue(""));
  });

  it("si la persona ya existe pide confirmación y la crea igual", async () => {
    const bodies: any[] = [];
    server.use(
      http.post(`${API}/properties/1/residents`, async ({ request }) => {
        const body = await request.json();
        bodies.push(body);
        if (bodies.length === 1) return HttpResponse.json({ success: false, code: "DUPLICATE_PERSON" });
        return HttpResponse.json({ success: true, data: { id: 31 } });
      }),
    );
    const { user, panel } = await hogar();
    await user.type(within(panel).getByLabelText("Nombre"), "Ana");
    await user.click(within(panel).getByRole("button", { name: "Agregar al hogar" }));
    expect(await within(panel).findByText("Ya existe una persona con estos datos.")).toBeInTheDocument();
    await user.click(within(panel).getByRole("button", { name: "Crear de todos modos" }));
    await waitFor(() => expect(bodies).toHaveLength(2));
    expect(bodies[0].confirmNewPerson).toBe(false);
    expect(bodies[1].confirmNewPerson).toBe(true);
  });

  it("muestra errores por code/mensajes y el texto por defecto", async () => {
    const bodies: any[] = [];
    server.use(
      http.post(`${API}/properties/1/residents`, async ({ request }) => {
        bodies.push(await request.json());
        if (bodies.length === 1) {
          return HttpResponse.json({ success: false, code: "OTRO", messages: ["Falla específica"] });
        }
        return HttpResponse.json({ success: false });
      }),
    );
    const { user, panel } = await hogar();
    await user.type(within(panel).getByLabelText("Nombre"), "Marta");
    await user.click(within(panel).getByRole("button", { name: "Agregar al hogar" }));
    expect(await within(panel).findByText("Falla específica")).toBeInTheDocument();
    await user.click(within(panel).getByRole("button", { name: "Agregar al hogar" }));
    await waitFor(() => expect(within(panel).getByText("No se pudo agregar")).toBeInTheDocument());
    expect(bodies).toHaveLength(2);
  });

  it("marca titular y recarga el hogar", async () => {
    const primary = stub("post", "/residents/2/primary", { success: true });
    const { user, panel } = await hogar();
    let householdCalls = 0;
    server.use(
      http.get(`${API}/properties/1/residents`, () => {
        householdCalls += 1;
        return HttpResponse.json({ success: true, data: householdRows });
      }),
    );
    const luisRow = within(panel).getByText(/Luis Gómez/).closest("li") as HTMLElement;
    await user.click(within(luisRow).getByRole("button", { name: "Hacer titular" }));
    await waitFor(() => expect(primary.path).toBe("/residents/2/primary"));
    expect(primary.body).toEqual({});
    await waitFor(() => expect(householdCalls).toBeGreaterThanOrEqual(1));
  });

  it("da de baja y avisa si la propiedad se queda sin titular", async () => {
    let calls = 0;
    server.use(
      http.post(`${API}/residents/2/move-out`, () => {
        calls += 1;
        return HttpResponse.json({ success: true, data: { warning: "PROPERTY_WITHOUT_PRIMARY" } });
      }),
    );
    const { user, panel } = await hogar();
    // La recarga del hogar tarda para poder ver el aviso antes de que el expediente se refresque.
    server.use(
      http.get(`${API}/properties/1/residents`, async () => {
        await new Promise((r) => setTimeout(r, 300));
        return HttpResponse.json({ success: true, data: householdRows });
      }),
    );
    const luisRow = within(panel).getByText(/Luis Gómez/).closest("li") as HTMLElement;
    await user.click(within(luisRow).getByRole("button", { name: "Dar de baja" }));
    expect(await within(panel).findByText("La propiedad se quedó sin titular: designa uno.")).toBeInTheDocument();
    expect(calls).toBe(1);
  });

  it("estado vacío del hogar", async () => {
    const { panel } = await hogar({ household: [] });
    expect(within(panel).getByText("Sin residentes registrados")).toBeInTheDocument();
  });

  it("muestra el loader mientras carga el hogar", async () => {
    stubDetail({ residentsDelay: 200 });
    renderApp({ route: "/properties/1", role: "ADMIN" });
    await screen.findByText("Propiedad CASA-01");
    expect(screen.getAllByRole("status").length).toBeGreaterThanOrEqual(1);
    expect(await screen.findByText("Hogar", { selector: "h2" })).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/* Autorizaciones                                                      */
/* ------------------------------------------------------------------ */

describe("propiedades: autorizaciones", () => {
  const authPanel = async (opts: DetailOptions = {}) => {
    const ctx = await openDetail(opts);
    await screen.findByText("Personas autorizadas", { selector: "h2" });
    return { ...ctx, panel: sectionOf("Personas autorizadas") };
  };

  it("muestra el error de carga y reintenta", async () => {
    stubDetail();
    let attempts = 0;
    server.use(
      http.get(`${API}/properties/1/authorizations`, () => {
        attempts += 1;
        if (attempts === 1) return HttpResponse.json({ success: false, messages: ["Sin autorizaciones"] });
        return HttpResponse.json({ success: true, data: authorizations });
      }),
    );
    const { user } = renderApp({ route: "/properties/1", role: "ADMIN" });
    await screen.findByText("Propiedad CASA-01");
    await screen.findByText("Personas autorizadas", { selector: "h2" });
    expect(await within(sectionOf("Personas autorizadas")).findByRole("alert")).toHaveTextContent("Sin autorizaciones");
    await user.click(within(sectionOf("Personas autorizadas")).getByRole("button", { name: "Reintentar" }));
    await waitFor(() => expect(within(sectionOf("Personas autorizadas")).getByText(/Peatón/)).toBeInTheDocument());
    expect(attempts).toBe(2);
  });

  it("muestra el error HTTP de carga y reintenta", async () => {
    stubDetail();
    let attempts = 0;
    server.use(
      http.get(`${API}/properties/1/authorizations`, () => {
        attempts += 1;
        if (attempts === 1) {
          return HttpResponse.json({ success: false, message: "boom", messages: ["boom"] }, { status: 500 });
        }
        return HttpResponse.json({ success: true, data: authorizations });
      }),
    );
    const { user } = renderApp({ route: "/properties/1", role: "ADMIN" });
    await screen.findByText("Propiedad CASA-01");
    await screen.findByText("Personas autorizadas", { selector: "h2" });
    expect(await within(sectionOf("Personas autorizadas")).findByRole("alert")).toHaveTextContent("boom");
    await user.click(within(sectionOf("Personas autorizadas")).getByRole("button", { name: "Reintentar" }));
    await waitFor(() => expect(within(sectionOf("Personas autorizadas")).getByText(/Peatón/)).toBeInTheDocument());
    expect(attempts).toBe(2);
  });

  it("lista autorizaciones y marca las revocadas", async () => {
    const { panel } = await authPanel();
    expect(within(panel).getByText(/Peatón/)).toHaveTextContent("Ana Pérez · Peatón · Lun Mar Mié Jue Vie 08:00–16:00");
    expect(within(panel).getByText(/Vehículo/)).toHaveTextContent("Luis Gómez · Vehículo · Dom Sáb 10:00–20:00");
    expect(within(panel).getByText("Revocada")).toBeInTheDocument();
    expect(within(panel).getAllByRole("button", { name: "Revocar" })).toHaveLength(1);
    expect(within(panel).getAllByRole("button", { name: "Generar pase" })).toHaveLength(1);
  });

  it("estado vacío", async () => {
    const { panel } = await authPanel({ auths: [] });
    expect(within(panel).getByText("Nadie autorizado")).toBeInTheDocument();
  });

  it("crea una autorización con alcance, días, horas y vigencia", async () => {
    const created = stub("post", "/properties/1/authorizations", { success: true, data: { id: 9 } });
    stub("get", "/persons", { success: true, data: [{ id: 5, firstName: "Ana", lastName: "Pérez" }] });
    const { user, panel } = await authPanel();
    await user.type(within(panel).getByLabelText("Buscar persona"), "ana");
    await user.click(await within(panel).findByRole("button", { name: "Ana Pérez" }));
    expect(within(panel).getByText("Seleccionada: Ana Pérez")).toBeInTheDocument();
    await pickOption(user, panel.querySelector('input[name="scope"]') as HTMLElement, "Vehículo");
    for (const day of ["Lun", "Mar", "Mié", "Jue", "Vie"]) {
      await user.click(within(panel).getByLabelText(day));
    }
    await user.click(within(panel).getByLabelText("Sáb"));
    const from = within(panel).getByLabelText("Desde");
    await user.clear(from);
    await user.type(from, "0900");
    const to = within(panel).getByLabelText("Hasta");
    await user.clear(to);
    await user.type(to, "1800");
    const until = within(panel).getByLabelText("Hasta (opcional)");
    await user.type(until, "31122027");
    const today = new Date().toISOString().slice(0, 10);
    await user.click(within(panel).getByRole("button", { name: "Autorizar acceso" }));
    await waitFor(() =>
      expect(created.body).toEqual({
        personId: 5,
        scope: "VEHICLE",
        days: [6],
        startTime: "09:00",
        endTime: "18:00",
        validFrom: today,
        validUntil: "2027-12-31",
      }),
    );
    await waitFor(() => expect(within(panel).queryByText("Seleccionada: Ana Pérez")).toBeNull());
  });

  it("exige al menos un día", async () => {
    const created = stub("post", "/properties/1/authorizations");
    stub("get", "/persons", { success: true, data: [{ id: 5, firstName: "Ana", lastName: "Pérez" }] });
    const { user, panel } = await authPanel();
    await user.type(within(panel).getByLabelText("Buscar persona"), "ana");
    await user.click(await within(panel).findByRole("button", { name: "Ana Pérez" }));
    for (const day of ["Lun", "Mar", "Mié", "Jue", "Vie"]) {
      await user.click(within(panel).getByLabelText(day));
    }
    await user.click(within(panel).getByRole("button", { name: "Autorizar acceso" }));
    expect(await within(panel).findByText("Elige al menos un día")).toBeInTheDocument();
    expect(created.method).toBe("");
  });

  it("si el API falla muestra el mensaje", async () => {
    fail("post", "/properties/1/authorizations", ["Persona ya autorizada"], 400);
    stub("get", "/persons", { success: true, data: [{ id: 5, firstName: "Ana", lastName: "Pérez" }] });
    const { user, panel } = await authPanel();
    await user.type(within(panel).getByLabelText("Buscar persona"), "ana");
    await user.click(await within(panel).findByRole("button", { name: "Ana Pérez" }));
    await user.click(within(panel).getByRole("button", { name: "Autorizar acceso" }));
    expect(await within(panel).findByText("Persona ya autorizada")).toBeInTheDocument();
  });

  it("revoca una autorización y recarga", async () => {
    const revoked = stub("post", "/authorizations/1/revoke", { success: true });
    const { user, panel } = await authPanel();
    let calls = 0;
    server.use(
      http.get(`${API}/properties/1/authorizations`, () => {
        calls += 1;
        return HttpResponse.json({ success: true, data: authorizations });
      }),
    );
    await user.click(within(panel).getByRole("button", { name: "Revocar" }));
    await waitFor(() => expect(revoked.path).toBe("/authorizations/1/revoke"));
    expect(revoked.body).toEqual({});
    await waitFor(() => expect(calls).toBeGreaterThanOrEqual(1));
  });

  it("genera y cierra el pase QR", async () => {
    stub("post", "/authorizations/1/pass", { success: true, data: { token: "tok-123" } });
    const { user, panel } = await authPanel();
    await user.click(within(panel).getByRole("button", { name: "Generar pase" }));
    expect(await within(panel).findByAltText("Pase QR")).toBeInTheDocument();
    expect(within(panel).getByText(/Se muestra una sola vez/)).toBeInTheDocument();
    await user.click(within(panel).getByRole("button", { name: "Cerrar" }));
    await waitFor(() => expect(within(panel).queryByAltText("Pase QR")).toBeNull());
  });
});
