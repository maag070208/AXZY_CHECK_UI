import { screen, waitFor, within } from "@testing-library/react";
import dayjs from "dayjs";
import { describe, expect, it } from "vitest";
import store from "@app/core/store/store";
import { fail, mockTransport, stub, table } from "../helpers/api";
import { renderApp } from "../helpers/render";
import { pickOption } from "../helpers/ui";

/**
 * Incidencias, mantenimientos y casa club comparten la misma pantalla
 * (`ITDataTable` + `ReportCreateForm`/`ReportDetailDialog` + modal de PDF).
 * Un solo conjunto parametrizado cubre los tres sin triplicar el archivo.
 */
const modules = [
  {
    name: "incidencias",
    route: "/incidents",
    adminRole: "ADMIN",
    viewerRole: "SHIFT",
    base: "/incidents",
    datatable: "/incidents/datatable",
    categories: "/catalog/incident_category",
    types: "/catalog/incident_type",
    catalogCategory: { id: 10, name: "PLOM", value: "Plomería", type: "INCIDENT" },
    catalogType: { id: 11, name: "FUGA", value: "Fuga", categoryId: 10 },
    catalogCategoryFallback: { id: 12, name: "OTRO", value: "Otros", type: "INCIDENT" },
    detailKind: "Incidencia",
    statusDone: "Atendida",
    statusFilterDone: "Atendidas",
    resolveButton: "Marcar como atendida",
    resolveBody: {},
    deleteButton: "Eliminar incidencia",
    deleteDialog: "Eliminar Incidencia",
    deleteToast: "Incidencia eliminada exitosamente",
    deleteErrorToast: "Error al eliminar incidencia",
    resolveErrorToast: "Error al resolver incidencia",
    reportDialog: "Generar reporte de incidencias",
    reportEmpty: "No hay incidencias en el rango seleccionado.",
    includeLabel: "Incluir incidencia",
    createTitle: "Nuevo reporte de incidencia",
    createPlaceholder: "Describe lo sucedido brevemente...",
    rows: [
      {
        id: 1,
        title: "Fuga de agua",
        description: "Se rompió la tubería del pasillo.",
        status: "PENDING",
        createdAt: "2026-10-10T15:30:00.000Z",
        category: { id: 10, name: "PLOM", value: "Plomería" },
        type: { id: 11, name: "FUGA", value: "Fuga" },
        guard: { id: 5, name: "Ana", lastName: "Pérez", username: "ana" },
        media: [{ type: "IMAGE", url: "http://x/a.png" }],
        latitude: 32.46,
        longitude: -116.92,
      },
      {
        id: 2,
        title: "Puerta abierta",
        description: null,
        status: "ATTENDED",
        createdAt: "2026-10-08T10:00:00.000Z",
        resolvedAt: "2026-10-09T10:00:00.000Z",
        resolvedBy: { name: "Supervisor" },
        category: { id: 10, name: "PLOM", value: "Plomería" },
      },
    ],
  },
  {
    name: "mantenimientos",
    route: "/maintenances",
    adminRole: "ADMIN",
    viewerRole: "MAINT",
    base: "/maintenance",
    datatable: "/maintenance/datatable",
    categories: "/catalog/incident_category",
    types: "/catalog/incident_type",
    catalogCategory: { id: 20, name: "ELECT", value: "Eléctrico", type: "MAINTENANCE" },
    catalogType: { id: 21, name: "FOCO", value: "Foco", categoryId: 20 },
    catalogCategoryFallback: { id: 22, name: "PLOM", value: "Plomería", type: "MAINTENANCE" },
    detailKind: "Mantenimiento",
    statusDone: "Atendido",
    statusFilterDone: "Atendidos",
    resolveButton: "Marcar como atendido",
    resolveBody: { userId: 1 },
    deleteButton: "Eliminar mantenimiento",
    deleteDialog: "Eliminar Mantenimiento",
    deleteToast: "Mantenimiento eliminado exitosamente",
    deleteErrorToast: "Error al eliminar mantenimiento",
    resolveErrorToast: "Error al resolver mantenimiento",
    reportDialog: "Generar reporte de mantenimientos",
    reportEmpty: "No hay mantenimientos en el rango seleccionado.",
    includeLabel: "Incluir mantenimiento",
    createTitle: "Nuevo reporte de mantenimiento",
    createPlaceholder: "Describe el problema encontrado...",
    rows: [
      {
        id: 1,
        title: "Foco fundido",
        description: "No enciende la lámpara del lobby.",
        status: "PENDING",
        createdAt: "2026-10-10T15:30:00.000Z",
        category: "Eléctrico",
        guard: { id: 5, name: "Ana", lastName: "Pérez", username: "ana" },
        media: [{ type: "IMAGE", url: "http://x/a.png" }],
        latitude: 32.46,
        longitude: -116.92,
      },
      {
        id: 2,
        title: "Fuga en el baño",
        description: null,
        status: "ATTENDED",
        createdAt: "2026-10-08T10:00:00.000Z",
        resolvedAt: "2026-10-09T10:00:00.000Z",
        resolvedBy: { name: "Supervisor" },
        category: "Plomería",
      },
    ],
  },
  {
    name: "casa club",
    route: "/club",
    adminRole: "ADMIN",
    viewerRole: "GUARD",
    base: "/club",
    datatable: "/club/datatable",
    categories: "/catalog/club_category",
    types: "/catalog/club_type",
    catalogCategory: { id: 30, name: "ALBERCA", value: "Alberca", type: "CASA_CLUB" },
    catalogType: { id: 31, name: "LIMPIEZA", value: "Limpieza", categoryId: 30 },
    catalogCategoryFallback: { id: 32, name: "SALON", value: "Salón", type: "CASA_CLUB" },
    detailKind: "Reporte de Casa Club",
    statusDone: "Atendido",
    statusFilterDone: "Atendidos",
    resolveButton: "Marcar como atendido",
    resolveBody: {},
    deleteButton: "Eliminar reporte",
    deleteDialog: "Eliminar Reporte",
    deleteToast: "Reporte eliminado exitosamente",
    deleteErrorToast: "Error al eliminar el reporte",
    resolveErrorToast: "Error al resolver el reporte",
    reportDialog: "Generar reporte de casa club",
    reportEmpty: "No hay reportes en el rango seleccionado.",
    includeLabel: "Incluir reporte",
    createTitle: "Nuevo reporte de Casa Club",
    createPlaceholder: "Describe lo sucedido brevemente...",
    rows: [
      {
        id: 1,
        title: "Alberca sucia",
        description: "Hay hojas en el agua.",
        status: "PENDING",
        createdAt: "2026-10-10T15:30:00.000Z",
        category: { id: 30, name: "ALBERCA", value: "Alberca" },
        type: { id: 31, name: "LIMPIEZA", value: "Limpieza" },
        guard: { id: 5, name: "Ana", lastName: "Pérez", username: "ana" },
        media: [{ type: "IMAGE", url: "http://x/a.png" }],
        latitude: 32.46,
        longitude: -116.92,
      },
      {
        id: 2,
        title: "Reserva cancelada",
        description: null,
        status: "ATTENDED",
        createdAt: "2026-10-08T10:00:00.000Z",
        resolvedAt: "2026-10-09T10:00:00.000Z",
        resolvedBy: { name: "Supervisor" },
        category: { id: 30, name: "ALBERCA", value: "Alberca" },
      },
    ],
  },
] as const;

type ModuleCase = (typeof modules)[number];

/** Catalogos que pide cada pantalla (las filas de mantenimiento traen `category` como texto). */
const stubCatalogs = (m: ModuleCase) => {
  stub("get", m.categories, { success: true, data: [m.catalogCategory, m.catalogCategoryFallback] });
  stub("get", m.types, { success: true, data: [m.catalogType] });
};

const toast = () => store.getState().toast;
const detailTitle = (m: ModuleCase, id: number) => new RegExp(`^${m.detailKind} #${id}$`, "i");
const dialogOf = async (title: string | RegExp) => {
  const el = await screen.findByText(title);
  return el.closest("[data-it-dialog]") as HTMLElement;
};

const open = async (m: ModuleCase, { role = m.adminRole, route = m.route }: { role?: string; route?: string } = {}) => {
  stubCatalogs(m);
  const bodies = table(m.datatable, m.rows as unknown[], m.rows.length);
  const r = renderApp({ route, role });
  // La tabla remonta a los 500 ms del debounce: se espera la segunda carga.
  await waitFor(() => expect(bodies.length).toBeGreaterThanOrEqual(2));
  await screen.findByText(m.rows[0].title);
  return { ...r, bodies };
};

describe.each(modules)("reportes: $name", (m) => {
  describe("listado", () => {
    it("muestra título, categoría, estado, evidencia y guardia", async () => {
      await open(m);
      expect(screen.getByText(m.rows[0].title)).toBeInTheDocument();
      expect(screen.getByText(m.rows[1].title)).toBeInTheDocument();
      expect(screen.getAllByText(m.catalogCategory.value).length).toBeGreaterThan(0);
      expect(screen.getAllByText("Pendiente").length).toBeGreaterThan(0);
      expect(screen.getAllByText(m.statusDone).length).toBeGreaterThan(0);
      expect(screen.getByText("Ana Pérez")).toBeInTheDocument();
      // Fila con evidencia y fila sin evidencia.
      expect(screen.getAllByText("1").length).toBeGreaterThan(0);
      expect(screen.getAllByText("-").length).toBeGreaterThan(0);
      if ("type" in m.rows[0]) expect(screen.getAllByText(m.catalogType.value).length).toBeGreaterThan(0);
    });

    it("busca recortando espacios y limpia el filtro", async () => {
      const { user, bodies } = await open(m);
      await user.type(screen.getByPlaceholderText("Buscar por título..."), "  fuga  ");
      await waitFor(() => expect(bodies.at(-1).filters.search).toBe("fuga"));
      await user.click(screen.getByRole("button", { name: "Limpiar búsqueda" }));
      await waitFor(() => expect(bodies.at(-1).filters.search).toBeUndefined());
    });

    it("filtra por estado y 'Todos' lo quita", async () => {
      const { user, bodies } = await open(m);
      await pickOption(user, screen.getByDisplayValue("Todos los estados"), "Pendientes");
      await waitFor(() => expect(bodies.at(-1).filters.status).toBe("PENDING"));
      await pickOption(user, screen.getByDisplayValue("Pendientes"), "Todos los estados");
      await waitFor(() => expect(bodies.at(-1).filters.status).toBeUndefined());
    });

    it("actualizar vuelve a pedir datos", async () => {
      const { user, bodies } = await open(m);
      const before = bodies.length;
      await user.click(screen.getByRole("button", { name: "Actualizar datos" }));
      await waitFor(() => expect(bodies.length).toBeGreaterThan(before));
    });

    it("el enlace a catálogo muestra el filtro activo y se puede quitar", async () => {
      const type = "type" in m.rows[0] ? m.catalogType : null;
      const { user, bodies } = await open(m, {
        route: `${m.route}?categoryId=${m.catalogCategory.id}${type ? `&typeId=${type.id}` : ""}`,
      });
      const label = type ? `${m.catalogCategory.value} · ${type.value}` : m.catalogCategory.value;
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
      expect(bodies.at(-1).filters.categoryId).toBe(m.catalogCategory.id);
      await user.click(screen.getByRole("button", { name: "Quitar filtro" }));
      await waitFor(() => expect(bodies.at(-1).filters).not.toHaveProperty("categoryId"));
      expect(screen.queryByText(/Filtrando por catálogo/)).toBeNull();
    });
  });

  describe("detalle", () => {
    it("abre el reporte con evidencia, GPS, línea de tiempo y acción de resolver", async () => {
      const { user } = await open(m);
      await user.click(screen.getAllByRole("button", { name: "Ver detalles" })[0]);
      const title = await screen.findByText(detailTitle(m, 1));
      const dialog = title.closest("[data-it-dialog]") as HTMLElement;
      expect(within(dialog).getByText(m.rows[0].description)).toBeInTheDocument();
      expect(within(dialog).getByText("Ana Pérez · @ana")).toBeInTheDocument();
      expect(within(dialog).getByText("1 archivo")).toBeInTheDocument();
      expect(within(dialog).getByText("Ubicación")).toBeInTheDocument();
      expect(within(dialog).getAllByText(/^Reportad[ao]$/).length).toBeGreaterThan(0);
      expect(within(dialog).getByText(new RegExp(`${m.statusDone} · pendiente`, "i"))).toBeInTheDocument();
      expect(within(dialog).getByRole("button", { name: m.resolveButton })).toBeInTheDocument();
      await user.click(within(dialog).getAllByRole("button", { name: "Cerrar" })[0]);
      await waitFor(() => expect(screen.queryByText(detailTitle(m, 1))).toBeNull());
    });

    it("detalle atendido sin evidencia ni descripción y sin botón de resolver", async () => {
      const { user } = await open(m);
      await user.click(screen.getAllByRole("button", { name: "Ver detalles" })[1]);
      const title = await screen.findByText(detailTitle(m, 2));
      const dialog = title.closest("[data-it-dialog]") as HTMLElement;
      expect(within(dialog).getByText("Sin evidencia adjunta")).toBeInTheDocument();
      expect(within(dialog).getByText("Sin descripción detallada.")).toBeInTheDocument();
      expect(within(dialog).getAllByText("Sin registro").length).toBeGreaterThan(0);
      expect(within(dialog).queryByRole("button", { name: m.resolveButton })).toBeNull();
      expect(within(dialog).queryByText("Ubicación")).toBeNull();
      expect(within(dialog).getByText(/Supervisor/)).toBeInTheDocument();
    });
  });

  describe("resolver", () => {
    it("confirma, manda el cuerpo correcto y refresca", async () => {
      const { user, bodies } = await open(m);
      const seen = stub("put", `${m.base}/1/resolve`, { success: true, data: {} });
      await user.click(screen.getAllByRole("button", { name: m.resolveButton })[0]);
      const dialog = await dialogOf("Confirmar Resolución");
      const before = bodies.length;
      await user.click(within(dialog).getByRole("button", { name: "Confirmar" }));
      await waitFor(() => expect(seen.body).toEqual(m.resolveBody));
      await waitFor(() => expect(bodies.length).toBeGreaterThan(before));
    });

    it("si el API falla avisa y no refresca", async () => {
      const { user, bodies } = await open(m);
      stub("put", `${m.base}/1/resolve`, { success: false, messages: ["Falló"] });
      await user.click(screen.getAllByRole("button", { name: m.resolveButton })[0]);
      const dialog = await dialogOf("Confirmar Resolución");
      const before = bodies.length;
      await user.click(within(dialog).getByRole("button", { name: "Confirmar" }));
      await waitFor(() => expect(toast()).toMatchObject({ message: m.resolveErrorToast, type: "error" }));
      expect(bodies.length).toBe(before);
    });

    it("resolver desde el detalle abierto lo cierra al confirmar", async () => {
      const { user } = await open(m);
      stub("put", `${m.base}/1/resolve`, { success: true, data: {} });
      await user.click(screen.getAllByRole("button", { name: "Ver detalles" })[0]);
      const title = await screen.findByText(detailTitle(m, 1));
      const detail = title.closest("[data-it-dialog]") as HTMLElement;
      await user.click(within(detail).getByRole("button", { name: m.resolveButton }));
      const dialog = await dialogOf("Confirmar Resolución");
      await user.click(within(dialog).getByRole("button", { name: "Confirmar" }));
      await waitFor(() => expect(screen.queryByText(detailTitle(m, 1))).toBeNull());
    });

    it("cancelar la confirmación no resuelve", async () => {
      const { user } = await open(m);
      const put = stub("put", `${m.base}/1/resolve`, { success: true, data: {} });
      await user.click(screen.getAllByRole("button", { name: m.resolveButton })[0]);
      const dialog = await dialogOf("Confirmar Resolución");
      await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
      await waitFor(() => expect(screen.queryByText("Confirmar Resolución")).toBeNull());
      expect(put.method).toBe("");
    });
  });

  describe("eliminar", () => {
    it("elimina con confirmación y refresca", async () => {
      const { user, bodies } = await open(m);
      const seen = stub("delete", `${m.base}/1`, { success: true, data: true });
      await user.click(screen.getAllByRole("button", { name: m.deleteButton })[0]);
      const dialog = await dialogOf(m.deleteDialog);
      expect(within(dialog).getByText(new RegExp(`"${m.rows[0].title}"`))).toBeInTheDocument();
      const before = bodies.length;
      await user.click(within(dialog).getByRole("button", { name: "Eliminar permanentemente" }));
      await waitFor(() => expect(seen.method).toBe("DELETE"));
      await waitFor(() => expect(bodies.length).toBeGreaterThan(before));
      expect(toast()).toMatchObject({ message: m.deleteToast, type: "success" });
    });

    it("si el API falla avisa", async () => {
      const { user } = await open(m);
      stub("delete", `${m.base}/1`, { success: false, messages: ["Falló"] });
      await user.click(screen.getAllByRole("button", { name: m.deleteButton })[0]);
      const dialog = await dialogOf(m.deleteDialog);
      await user.click(within(dialog).getByRole("button", { name: "Eliminar permanentemente" }));
      await waitFor(() => expect(toast()).toMatchObject({ message: m.deleteErrorToast, type: "error" }));
    });

    it("cancelar no elimina", async () => {
      const { user } = await open(m);
      const seen = stub("delete", `${m.base}/1`);
      await user.click(screen.getAllByRole("button", { name: m.deleteButton })[0]);
      const dialog = await dialogOf(m.deleteDialog);
      await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
      await waitFor(() => expect(screen.queryByText(m.deleteDialog)).toBeNull());
      expect(seen.method).toBe("");
    });
  });

  describe("permisos", () => {
    it("un rol sin permiso no ve crear ni eliminar, pero sí resolver y reporte", async () => {
      await open(m, { role: m.viewerRole });
      expect(screen.queryByRole("button", { name: /Nuevo reporte/i })).toBeNull();
      expect(screen.queryByRole("button", { name: m.deleteButton })).toBeNull();
      expect(screen.getAllByRole("button", { name: m.resolveButton }).length).toBeGreaterThan(0);
      expect(screen.getByRole("button", { name: "Reporte" })).toBeInTheDocument();
    });
  });

  describe("nuevo reporte", () => {
    it("crea con el tipo elegido y refresca la tabla", async () => {
      const { user, bodies } = await open(m);
      const type = m.catalogType;
      const seen = stub("post", m.base, { success: true, data: { id: 9 } });
      await user.click(screen.getByRole("button", { name: /Nuevo reporte/i }));
      await dialogOf(m.createTitle);
      await user.click(screen.getByRole("button", { name: type.value }));
      await user.type(screen.getByPlaceholderText(m.createPlaceholder), "algo pasó");
      const before = bodies.length;
      await user.click(screen.getByRole("button", { name: "Enviar reporte" }));
      await waitFor(() => expect(seen.method).toBe("POST"));
      expect(seen.body).toMatchObject({
        title: type.value,
        typeId: type.id,
        description: "algo pasó",
        media: [],
      });
      await waitFor(() => expect(bodies.length).toBeGreaterThan(before));
      expect(toast()).toMatchObject({ type: "success" });
    });
  });

  describe("reporte PDF", () => {
    const openReport = async (m: ModuleCase, rows: unknown[] = m.rows as unknown[], role?: string) => {
      stub("get", m.base, { success: true, data: rows });
      const ctx = await open(m, role ? { role } : {});
      await ctx.user.click(screen.getByRole("button", { name: "Reporte" }));
      const dialog = await dialogOf(m.reportDialog);
      return { ...ctx, dialog };
    };
    const generate = (dialog: HTMLElement) => within(dialog).getByRole("button", { name: /Generar reporte PDF/i });

    it("lista las filas del rango y permite filtrar, deseleccionar y limpiar", async () => {
      const { user, dialog } = await openReport(m);
      expect(await within(dialog).findByText(m.rows[0].title)).toBeInTheDocument();
      expect(generate(dialog)).toBeEnabled();

      // Filtrar por estado deja solo las pendientes.
      await pickOption(user, within(dialog).getByDisplayValue("Todos los estados"), "Solo pendientes");
      expect(within(dialog).queryByText(m.rows[1].title)).toBeNull();
      expect(within(dialog).getByText(m.rows[0].title)).toBeInTheDocument();
      await pickOption(user, within(dialog).getByDisplayValue("Solo pendientes"), "Todos los estados");
      expect(await within(dialog).findByText(m.rows[1].title)).toBeInTheDocument();

      // "Seleccionar todas" deselecciona todo y deshabilita generar.
      const all = within(dialog).getByRole("checkbox", { name: "Seleccionar todas" });
      await user.click(all);
      expect(generate(dialog)).toBeDisabled();
      await user.click(all);
      expect(generate(dialog)).toBeEnabled();

      // "Limpiar" deja la selección vacía.
      await user.click(within(dialog).getByRole("button", { name: /Limpiar/ }));
      expect(generate(dialog)).toBeDisabled();
    });


    const dateInput = () => screen.getByPlaceholderText("dd/mm/aaaa - dd/mm/aaaa");
    const pickDay = (d: string) => {
      const panels = document.querySelectorAll<HTMLElement>("[data-it-floating]");
      return within(panels[panels.length - 1]).getAllByText(d, { selector: "span" })[0];
    };

    it("marca y desmarca una fila concreta y el contador sigue el estado", async () => {
      const { user, dialog } = await openReport(m);
      await within(dialog).findByText(m.rows[0].title);
      const row = within(dialog).getAllByRole("checkbox", { name: m.includeLabel })[0];
      const all = within(dialog).getByRole("checkbox", { name: "Seleccionar todas" });
      expect(row).toBeChecked();
      await user.click(row);
      expect(row).not.toBeChecked();
      expect(all).not.toBeChecked();
      expect(generate(dialog)).toBeEnabled();
      await user.click(row);
      expect(row).toBeChecked();
      expect(all).toBeChecked();
    });

    it("elegir solo el inicio del rango avisa y no genera", async () => {
      const { user, dialog } = await openReport(m);
      await within(dialog).findByText(m.rows[0].title);
      await user.click(dateInput());
      await user.click(pickDay("10"));
      expect(await screen.findByText("Selecciona un rango")).toBeInTheDocument();
      await user.click(generate(dialog));
      await waitFor(() =>
        expect(toast()).toMatchObject({ message: "Selecciona un rango de fechas válido", type: "warning" }),
      );
    });

    it("elegir inicio y fin vuelve a pedir datos y actualiza la etiqueta", async () => {
      const { user, dialog } = await openReport(m);
      await within(dialog).findByText(m.rows[0].title);
      const now = dayjs();
      await user.click(dateInput());
      await user.click(pickDay("10"));
      await user.click(pickDay("12"));
      const label = `${now.date(10).format("DD/MM/YYYY")} — ${now.date(12).format("DD/MM/YYYY")}`;
      expect((await screen.findAllByText(label)).length).toBeGreaterThan(0);
    });

    it("mientras genera muestra el aviso y no deja cerrar", async () => {
      const { user, dialog } = await openReport(m);
      await within(dialog).findByText(m.rows[0].title);
      const { axiosInstance } = await import("@app/core/axios/axios");
      let release!: (value: unknown) => void;
      const pending = new Promise((resolve) => {
        release = resolve;
      });
      const original = axiosInstance.defaults.adapter;
      axiosInstance.defaults.adapter = async (config) => {
        await pending;
        return { data: new Blob(["%PDF"]), status: 200, statusText: "", headers: {}, config, request: {} } as never;
      };
      try {
        await user.click(generate(dialog));
        expect(await screen.findByText("Generando reporte PDF")).toBeInTheDocument();
        await user.keyboard("{Escape}");
        expect(screen.getByText(m.reportDialog)).toBeInTheDocument();
        await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
        expect(screen.getByText(m.reportDialog)).toBeInTheDocument();
        release(null);
        await waitFor(() => expect(toast()).toMatchObject({ message: "Reporte PDF generado correctamente" }));
      } finally {
        axiosInstance.defaults.adapter = original;
      }
    });

    it("genera el PDF con ids y opciones y cierra el modal", async () => {
      const { user, dialog } = await openReport(m);
      await within(dialog).findByText(m.rows[0].title);
      let url = "";
      mockTransport((config) => {
        url = config.url ?? "";
        return { data: new Blob(["%PDF"]) };
      });
      await user.click(generate(dialog));
      await waitFor(() => expect(toast()).toMatchObject({ message: "Reporte PDF generado correctamente", type: "success" }));
      expect(url).toContain("ids=1,2");
      expect(url).toContain("includeImages=true&includeLocation=true");
      await waitFor(() => expect(screen.queryByText(m.reportDialog)).toBeNull());
    });

    it("respeta los interruptores de imágenes y ubicación", async () => {
      const { user, dialog } = await openReport(m);
      await within(dialog).findByText(m.rows[0].title);
      await user.click(screen.getByRole("switch", { name: "Adjuntar imágenes" }));
      let url = "";
      mockTransport((config) => {
        url = config.url ?? "";
        return { data: new Blob(["%PDF"]) };
      });
      await user.click(generate(dialog));
      await waitFor(() => expect(url).toContain("includeImages=false"));
      expect(url).toContain("includeLocation=true");
    });

    it("si el PDF falla muestra el mensaje del servidor y no cierra", async () => {
      const { user, dialog } = await openReport(m);
      await within(dialog).findByText(m.rows[0].title);
      mockTransport(() => ({ status: 400, data: new Blob([JSON.stringify({ messages: ["Sin datos"] })]) }));
      await user.click(generate(dialog));
      await waitFor(() => expect(toast()).toMatchObject({ message: "Sin datos", type: "error" }));
      expect(screen.getByText(m.reportDialog)).toBeInTheDocument();
    });

    it("rango sin registros muestra el estado vacío y deshabilita generar", async () => {
      const { user, dialog } = await openReport(m, []);
      expect(await within(dialog).findByText(m.reportEmpty)).toBeInTheDocument();
      expect(within(dialog).getByRole("checkbox", { name: "Seleccionar todas" })).toBeDisabled();
      expect(generate(dialog)).toBeDisabled();
      await user.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByText(m.reportDialog)).toBeNull());
    });

    it("si la carga del rango falla por red deja el estado vacío", async () => {
      fail("get", m.base, ["boom"], 500);
      const ctx = await open(m);
      await ctx.user.click(screen.getByRole("button", { name: "Reporte" }));
      const dialog = await dialogOf(m.reportDialog);
      expect(await within(dialog).findByText(m.reportEmpty)).toBeInTheDocument();
    });

    it("con permisos limitados avisa que el reporte usa los del usuario", async () => {
      const { dialog } = await openReport(m, m.rows as unknown[], m.viewerRole);
      expect(await within(dialog).findByText("Reporte con los permisos del usuario.")).toBeInTheDocument();
    });

    it("si la carga falla deja el estado vacío", async () => {
      stub("get", m.base, { success: false, messages: ["Falló"] });
      const ctx = await open(m);
      await ctx.user.click(screen.getByRole("button", { name: "Reporte" }));
      const dialog = await dialogOf(m.reportDialog);
      expect(await within(dialog).findByText(m.reportEmpty)).toBeInTheDocument();
    });
  });
});
