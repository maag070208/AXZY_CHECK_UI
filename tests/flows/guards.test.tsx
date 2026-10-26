import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import store from "@app/core/store/store";
import { fail, stub, table } from "../helpers/api";
import { schedules } from "../helpers/fixtures";
import { renderApp } from "../helpers/render";
import { API, server } from "../helpers/server";
import { pickOption } from "../helpers/ui";

const toast = () => store.getState().toast;

const guards = [
  { id: 1, name: "Ana", lastName: "Pérez", username: "ana", role: { name: "GUARD", value: "Guardia" }, schedule: schedules[0], assignments: [{ id: 1 }, { id: 2 }] },
  { id: 2, name: "Beto", lastName: "Ruiz", username: "beto", role: { name: "SHIFT", value: "Supervisor" } },
  { id: 3, name: "Cami", lastName: "Soto", username: "cami", role: { name: "MAINT", value: "Mantenimiento" }, assignments: [] },
  { id: 4, name: "Dani", lastName: "", username: "dani", role: "guard" },
];

/** Formas de `role` poco comunes: solo etiqueta, objeto vacío y ausente. */
const edgeRoles = [
  { id: 5, name: "Eli", lastName: "Gil", username: "eli", role: { value: "Solo etiqueta" } },
  { id: 6, name: "Fer", lastName: "Mora", username: "fer", role: {} },
  { id: 7, name: "Gus", lastName: "Paz", username: "gus" },
];

const open = async (rows: unknown[] = guards) => {
  stub("get", "/schedules", { success: true, data: schedules });
  const bodies = table("/users/datatable", rows);
  const r = renderApp({ route: "/guards", role: "ADMIN" });
  await waitFor(() => expect(bodies.length).toBeGreaterThanOrEqual(2));
  await screen.findByText(`@${(rows[0] as { username: string }).username}`);
  return { ...r, bodies };
};
const rowBtn = (label: string, idx: number) => screen.getAllByRole("button", { name: label })[idx];

describe("guardias: listado", () => {
  it("muestra personal operativo con categoría, turno y tareas", async () => {
    await open();
    expect(screen.getByText("Guardia")).toBeInTheDocument();
    expect(screen.getByText("Supervisor")).toBeInTheDocument();
    expect(screen.getByText("Mantenimiento")).toBeInTheDocument();
    expect(screen.getByText("guard")).toBeInTheDocument();
    expect(screen.getByText("Matutino")).toBeInTheDocument();
    expect(screen.getByText("Tareas: 2")).toBeInTheDocument();
    expect(screen.getAllByText("Tareas: 0").length).toBe(3);
    expect(screen.getAllByText("Sin Horario").length).toBe(3);
  });

  it("tolera roles con solo etiqueta, vacíos o ausentes", async () => {
    await open(edgeRoles);
    expect(screen.getByText("Solo etiqueta")).toBeInTheDocument();
    expect(screen.getByText("@fer")).toBeInTheDocument();
    expect(screen.getByText("@gus")).toBeInTheDocument();
  });

  it("siempre limita el rol a GUARD, SHIFT y MAINT", async () => {
    const { bodies } = await open();
    expect(bodies.at(-1).filters).toEqual({ name: "", role: { name: { in: ["GUARD", "SHIFT", "MAINT"] } } });
  });

  it("buscar, limpiar y actualizar", async () => {
    const { user, bodies } = await open();
    await user.type(screen.getByPlaceholderText("Buscar guardia..."), "an");
    await waitFor(() => expect(bodies.at(-1).filters.name).toBe("an"));
    await user.click(screen.getByRole("button", { name: "Limpiar búsqueda" }));
    await waitFor(() => expect(bodies.at(-1).filters.name).toBe(""));
    const n = bodies.length;
    await user.click(screen.getByRole("button", { name: "Actualizar" }));
    await waitFor(() => expect(bodies.length).toBeGreaterThan(n));
  });

  it("filtra por turno y por tareas pendientes", async () => {
    const { user, bodies } = await open();
    await pickOption(user, screen.getByDisplayValue("Todos los turnos"), "Nocturno");
    await waitFor(() => expect(bodies.at(-1).filters.scheduleId).toBe("2"));
    await pickOption(user, screen.getByDisplayValue("Todas"), "Con pendientes");
    await waitFor(() => expect(bodies.at(-1).filters.pendingTasks).toBe(true));
    await pickOption(user, screen.getByDisplayValue("Con pendientes"), "Sin pendientes");
    await waitFor(() => expect(bodies.at(-1).filters.pendingTasks).toBe(false));
    await pickOption(user, screen.getByDisplayValue("Nocturno"), "Todos los turnos");
    await pickOption(user, screen.getByDisplayValue("Sin pendientes"), "Todas");
    await waitFor(() => expect(bodies.at(-1).filters.scheduleId).toBeUndefined());
    expect(bodies.at(-1).filters.pendingTasks).toBeUndefined();
  });

  it("si los horarios no cargan, el filtro de turno queda solo con 'Todos'", async () => {
    fail("get", "/schedules", ["x"], 500);
    table("/users/datatable", guards);
    renderApp({ route: "/guards", role: "ADMIN" });
    await screen.findByText("@ana");
    expect(screen.getByDisplayValue("Todos los turnos")).toBeInTheDocument();
  });
});

describe("guardias: nueva asignación", () => {
  const locations = [{ id: 7, name: "Puerta Norte", aisle: "N", number: "1" }, { id: 8, name: "Alberca", aisle: "A", number: "2" }];
  const openModal = async () => {
    stub("get", "/locations", { success: true, data: locations });
    const ctx = await open();
    await ctx.user.click(rowBtn("Asignar tarea", 0));
    const dialog = (await screen.findByText("Nueva asignación")).closest("[data-it-dialog]") as HTMLElement;
    return { ...ctx, dialog };
  };
  const placeholder = "Selecciona el punto de control...";

  it("sin punto de control no deja crear", async () => {
    const created = stub("post", "/assignments");
    const { dialog } = await openModal();
    expect(within(dialog).getByText("Ana Pérez")).toBeInTheDocument();
    expect(within(dialog).getAllByRole("img", { name: /Ana Pérez/i }).length).toBeGreaterThan(0);
    expect(within(dialog).getByRole("button", { name: "Crear asignación" })).toBeDisabled();
    expect(created.method).toBe("");
  });

  it("agrega y quita consignas; ignora vacías", async () => {
    const { user, dialog } = await openModal();
    const add = within(dialog).getByRole("button", { name: "Agregar consigna" });
    expect(add).toBeDisabled();
    expect(within(dialog).getByText("Aún no hay consignas. Agrega la primera arriba.")).toBeInTheDocument();
    await user.type(within(dialog).getByPlaceholderText("Describe la consigna..."), "Revisar puerta");
    await user.click(add);
    await user.type(within(dialog).getByPlaceholderText("Describe la consigna..."), "Cerrar alberca");
    await user.click(within(dialog).getByRole("button", { name: "Agregar consigna" }));
    expect(within(dialog).getByText("Revisar puerta")).toBeInTheDocument();
    expect(within(dialog).getByText("Cerrar alberca")).toBeInTheDocument();
    await user.click(within(dialog).getAllByRole("button", { name: "Quitar consigna" })[0]);
    expect(within(dialog).queryByText("Revisar puerta")).toBeNull();
  });

  it("crea la asignación con punto, consignas y notas", async () => {
    const created = stub("post", "/assignments", { success: true, data: { id: 1 } });
    const { user, dialog, bodies } = await openModal();
    const n = bodies.length;
    await pickOption(user, within(dialog).getByPlaceholderText(placeholder), "Alberca (A-2)");
    await user.type(within(dialog).getByPlaceholderText("Describe la consigna..."), "Revisar bomba");
    await user.click(within(dialog).getByRole("button", { name: "Agregar consigna" }));
    await user.type(within(dialog).getByPlaceholderText("Instrucciones generales para la asignación..."), "Urgente");
    await user.click(within(dialog).getByRole("button", { name: "Crear asignación" }));
    await waitFor(() => expect(created.body).toEqual({ guardId: 1, locationId: 8, assignedBy: 1, notes: "Urgente", tasks: [{ description: "Revisar bomba", reqPhoto: false }] }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Asignación creada correctamente", type: "success" }));
    await waitFor(() => expect(bodies.length).toBeGreaterThan(n));
    await waitFor(() => expect(screen.queryByText("Nueva asignación")).toBeNull());
  });

  it("sin id de usuario en el token asigna con el usuario 1 por defecto", async () => {
    stub("get", "/locations", { success: true, data: locations });
    stub("get", "/schedules", { success: true, data: schedules });
    const bodies = table("/users/datatable", guards);
    const created = stub("post", "/assignments", { success: true });
    const r = renderApp({ route: "/guards", role: "ADMIN", claims: { id: null } });
    await waitFor(() => expect(bodies.length).toBeGreaterThanOrEqual(2));
    await screen.findByText("@ana");
    await r.user.click(rowBtn("Asignar tarea", 0));
    const dialog = (await screen.findByText("Nueva asignación")).closest("[data-it-dialog]") as HTMLElement;
    await pickOption(r.user, within(dialog).getByPlaceholderText(placeholder), "Alberca (A-2)");
    await r.user.click(within(dialog).getByRole("button", { name: "Crear asignación" }));
    await waitFor(() => expect(created.body).toMatchObject({ assignedBy: 1 }));
  });

  it("sin consignas no manda 'tasks'", async () => {
    const created = stub("post", "/assignments", { success: true });
    const { user, dialog } = await openModal();
    await pickOption(user, within(dialog).getByPlaceholderText(placeholder), "Puerta Norte (N-1)");
    await user.click(within(dialog).getByRole("button", { name: "Crear asignación" }));
    await waitFor(() => expect(created.body).toMatchObject({ locationId: 7, assignedBy: 1 }));
    expect((created.body as any).tasks).toBeUndefined();
  });

  it("el API rechaza: muestra su mensaje o el genérico", async () => {
    stub("post", "/assignments", { success: false, messages: ["Guardia ocupado"] });
    const { user, dialog } = await openModal();
    await pickOption(user, within(dialog).getByPlaceholderText(placeholder), "Alberca (A-2)");
    await user.click(within(dialog).getByRole("button", { name: "Crear asignación" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Guardia ocupado", type: "error" }));
    stub("post", "/assignments", { success: false });
    await user.click(within(dialog).getByRole("button", { name: "Crear asignación" }));
    await waitFor(() => expect(toast().message).toBe("Error al crear asignación"));
  });

  it("error HTTP: usa el mensaje del error o el genérico", async () => {
    stub("post", "/assignments", { message: "Sin permiso" }, 403);
    const { user, dialog } = await openModal();
    await pickOption(user, within(dialog).getByPlaceholderText(placeholder), "Alberca (A-2)");
    await user.click(within(dialog).getByRole("button", { name: "Crear asignación" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Sin permiso", type: "error" }));
    stub("post", "/assignments", {}, 500);
    await user.click(within(dialog).getByRole("button", { name: "Crear asignación" }));
    await waitFor(() => expect(toast().message).toBe("Error al crear asignación"));
  });

  it("si no se cargan las ubicaciones el selector queda vacío; cancelar cierra", async () => {
    stub("get", "/locations", { success: false });
    const ctx = await open();
    await ctx.user.click(rowBtn("Asignar tarea", 0));
    const dialog = (await screen.findByText("Nueva asignación")).closest("[data-it-dialog]") as HTMLElement;
    await ctx.user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByText("Nueva asignación")).toBeNull());
  });

  it("al reabrir el formulario empieza limpio", async () => {
    const { user, dialog } = await openModal();
    await user.type(within(dialog).getByPlaceholderText("Describe la consigna..."), "Algo");
    await user.click(within(dialog).getByRole("button", { name: "Agregar consigna" }));
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByText("Nueva asignación")).toBeNull());
    await user.click(rowBtn("Asignar tarea", 0));
    const again = (await screen.findByText("Nueva asignación")).closest("[data-it-dialog]") as HTMLElement;
    expect(within(again).queryByText("Algo")).toBeNull();
  });
});

describe("guardias: ver tareas", () => {
  const assignment = (over: Record<string, unknown> = {}) => ({
    id: 10, guardId: 1, locationId: 7, assignedBy: 1, status: "PENDING", createdAt: "2026-10-01T15:00:00.000Z", updatedAt: "",
    location: { name: "Puerta Norte", aisle: "N" }, tasks: [{ id: 1, description: "Revisar", reqPhoto: false, completed: true }, { id: 2, description: "Cerrar", reqPhoto: false, completed: false }],
    notes: "Con prisa", kardex: [{ media: [{ type: "IMAGE", url: "http://x/a.png" }, { type: "IMAGE", url: "/api/v1/uploads/b.png" }] }, {}], ...over,
  });
  const list = [
    assignment(),
    assignment({ id: 11, status: "CHECKING", location: null, tasks: [], notes: null, kardex: undefined }),
    assignment({ id: 12, status: "UNDER_REVIEW" }),
    assignment({ id: 13, status: "REVIEWED" }),
    assignment({ id: 14, status: "ANOMALY" }),
    assignment({ id: 15, status: "COMPLETED" }),
    assignment({ id: 16, status: "CANCELLED", kardex: [{ media: [] }] }),
  ];
  const openView = async (data: unknown = { success: true, data: list }) => {
    stub("get", "/assignments/all", data);
    const ctx = await open();
    await ctx.user.click(rowBtn("Ver tareas", 0));
    const dialog = (await screen.findByText("Tareas asignadas")).closest("[data-it-dialog]") as HTMLElement;
    return { ...ctx, dialog };
  };

  it("lista el historial con estados traducidos", async () => {
    const { dialog } = await openView();
    expect(await within(dialog).findByText("Asignación #10")).toBeInTheDocument();
    expect(within(dialog).getByText("Historial de tareas especiales")).toBeInTheDocument();
    expect(within(dialog).getByText("Pendiente")).toBeInTheDocument();
    expect(within(dialog).getByText("En proceso")).toBeInTheDocument();
    expect(within(dialog).getByText("Sin ubicación")).toBeInTheDocument();
    expect(within(dialog).getByText("Bajo revisión")).toBeInTheDocument();
  });

  it("sin asignaciones muestra el estado vacío", async () => {
    const { dialog } = await openView({ success: true, data: [] });
    expect(await within(dialog).findByText("Sin asignaciones")).toBeInTheDocument();
  });

  it("mientras carga muestra el indicador", async () => {
    let release!: () => void;
    server.use(
      http.get(`${API}/assignments/all`, async () => {
        await new Promise<void>((r) => (release = r));
        return HttpResponse.json({ success: true, data: list });
      }),
    );
    const r = await open();
    await r.user.click(rowBtn("Ver tareas", 0));
    const dialog = (await screen.findByText("Tareas asignadas")).closest("[data-it-dialog]") as HTMLElement;
    expect(within(dialog).queryByText("Sin asignaciones")).toBeNull();
    release();
    expect(await within(dialog).findByText("Asignación #10")).toBeInTheDocument();
  });

  it("si la carga falla deja el historial vacío", async () => {
    const { dialog } = await openView({ success: false });
    await waitFor(() => expect(within(dialog).getByText("Sin asignaciones")).toBeInTheDocument());
  });

  it("detalle: tareas, progreso, observaciones y evidencia con urls normalizadas", async () => {
    const { user, dialog } = await openView();
    await user.click(await within(dialog).findByText("Asignación #10"));
    expect(await within(dialog).findByText("Detalle de asignación")).toBeInTheDocument();
    expect(within(dialog).getAllByText("1/2").length).toBeGreaterThan(0);
    expect(within(dialog).getByText("1/2 tareas")).toBeInTheDocument();
    expect(within(dialog).getByText("Revisar")).toHaveClass("line-through");
    expect(within(dialog).getByText("“Con prisa”")).toBeInTheDocument();
    expect(within(dialog).getByText(/Pasillo N/)).toBeInTheDocument();
    const imgs = Array.from(document.querySelectorAll("img")).map((i) => i.getAttribute("src"));
    expect(imgs).toContain("http://x/a.png");
    expect(imgs).toContain("http://localhost:4444/uploads/b.png");
  });

  it("detalle sin ubicación, sin tareas, sin notas y sin evidencia", async () => {
    const { user, dialog } = await openView();
    await user.click(await within(dialog).findByText("Asignación #11"));
    expect(await within(dialog).findByText("Sin consignas registradas.")).toBeInTheDocument();
    expect(within(dialog).getByText("Sin evidencia visual")).toBeInTheDocument();
    expect(within(dialog).getByText("Sin ubicación")).toBeInTheDocument();
    expect(within(dialog).getByText(/Pasillo —/)).toBeInTheDocument();
    expect(within(dialog).queryByText("Observaciones")).toBeNull();
  });

  it("detalle con kardex sin media usa evidencia vacía", async () => {
    const { user, dialog } = await openView({ success: true, data: [list[6]] });
    await user.click(await within(dialog).findByText("Asignación #16"));
    expect(await within(dialog).findByText("Sin evidencia visual")).toBeInTheDocument();
    expect(within(dialog).getAllByText("Cancelado").length).toBeGreaterThan(0);
  });

  it.each([
    [13, "Revisado"],
    [14, "Anomalía"],
    [15, "Completado"],
  ])("el estado de la asignación #%i se muestra como %s", async (id, label) => {
    const { user, dialog } = await openView({ success: true, data: list.filter((a) => a.id === id) });
    await user.click(await within(dialog).findByText(`Asignación #${id}`));
    expect((await within(dialog).findAllByText(label)).length).toBeGreaterThan(0);
  });

  it("aprobar una asignación en revisión la finaliza y refresca el detalle", async () => {
    const approve = stub("patch", "/assignments/12/status", { success: true });
    const { user, dialog } = await openView();
    await user.click(await within(dialog).findByText("Asignación #12"));
    stub("get", "/assignments/all", { success: true, data: list.map((a) => (a.id === 12 ? { ...a, status: "REVIEWED" } : a)) });
    await user.click(await within(dialog).findByRole("button", { name: /aprobar y finalizar/i }));
    await waitFor(() => expect(approve.body).toEqual({ status: "REVIEWED" }));
    await waitFor(() => expect(within(dialog).queryByRole("button", { name: /aprobar y finalizar/i })).toBeNull());
    expect(within(dialog).getAllByText("Revisado").length).toBeGreaterThan(0);
  });

  it("si la aprobación falla no refresca", async () => {
    stub("patch", "/assignments/12/status", { success: false });
    const { user, dialog } = await openView();
    await user.click(await within(dialog).findByText("Asignación #12"));
    await user.click(await within(dialog).findByRole("button", { name: /aprobar y finalizar/i }));
    expect(await within(dialog).findByRole("button", { name: /aprobar y finalizar/i })).toBeEnabled();
  });

  it("refrescar con una asignación abierta que ya no existe conserva el detalle", async () => {
    const { user, dialog } = await openView();
    await user.click(await within(dialog).findByText("Asignación #10"));
    stub("get", "/assignments/all", { success: true, data: [list[1]] });
    await user.click(within(dialog).getByRole("button", { name: "Actualizar" }));
    await waitFor(() => expect(within(dialog).getByText("Detalle de asignación")).toBeInTheDocument());
  });

  it("volver al historial y cerrar con Escape", async () => {
    const { user, dialog } = await openView();
    await user.click(await within(dialog).findByText("Asignación #10"));
    await user.click(await within(dialog).findByRole("button", { name: "Volver al historial" }));
    expect(await within(dialog).findByText("Historial de tareas especiales")).toBeInTheDocument();
    await user.click((await within(dialog).findAllByRole("button", { name: "Ver detalle" }))[0]);
    expect(await within(dialog).findByText("Detalle de asignación")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByText("Detalle de asignación")).toBeNull());
    await user.click(rowBtn("Ver tareas", 0));
    expect(await screen.findByText("Tareas asignadas")).toBeInTheDocument();
  });

  it("nombres de guardia con espacios extra generan iniciales limpias", async () => {
    stub("get", "/assignments/all", { success: true, data: [] });
    const ctx = await open();
    await ctx.user.click(rowBtn("Ver tareas", 3));
    const dialog = (await screen.findByText("Tareas asignadas")).closest("[data-it-dialog]") as HTMLElement;
    expect(within(dialog).getByRole("img", { name: /Dani/i })).toBeInTheDocument();
  });
});
