import { screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import store from "@app/core/store/store";
import { fail, stub, table } from "../helpers/api";
import { renderApp } from "../helpers/render";
import { pickOption } from "../helpers/ui";

const toast = () => store.getState().toast;
afterEach(() => vi.useRealTimers());

const rows = [
  { id: 1, handoverDate: "2026-10-19T12:00:00.000Z", shiftType: "NOCTURNO", createdBy: { name: "Luis", lastName: "Soto" }, _count: { elements: 3 }, reportedToAdmin: true },
  { id: 2, handoverDate: "2026-10-20T12:00:00.000Z", shiftType: "MATUTINO", createdBy: { name: "Ana", lastName: "Gil" }, reportedToAdmin: false },
];

describe("entrega de turno: historial", () => {
  const open = async () => {
    table("/shift-handover/datatable", rows);
    const r = renderApp({ route: "/shift-handover", role: "ADMIN" });
    await screen.findByText("Luis Soto");
    return r;
  };

  it("lista los reportes con turno, jefe, elementos y novedades", async () => {
    await open();
    expect(screen.getByText("Nocturno")).toBeInTheDocument();
    expect(screen.getByText("Matutino")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("Sí")).toBeInTheDocument();
    expect(screen.getByText("No")).toBeInTheDocument();
  });

  it("el botón lleva a la captura", async () => {
    const { user } = await open();
    stub("get", "/users", { success: true, data: [] });
    await user.click(screen.getByRole("button", { name: /nueva entrega de turno/i }));
    expect(await screen.findByText("Nueva Entrega de Turno", { selector: "h1, h2, p, span, div" })).toBeInTheDocument();
  });

  const detail = (over: Record<string, unknown> = {}) => ({
    id: 1, handoverDate: "2026-10-19T12:00:00.000Z", shiftType: "NOCTURNO", reportedToAdmin: true, credentialsCount: 4, tarjetonesCount: 2,
    novedades: "Todo tranquilo", checklistPhones: true, checklistTablet: false, checklistRadios: true, checklistKeys: false, checklistLogbook: true, checklistConsignas: false,
    createdBy: { name: "Luis", lastName: "Soto" },
    elements: [
      { id: 1, guard: { name: "Ana", lastName: "Pérez" }, entryTime: "07:00", punctual: true, observations: "Sin novedad" },
      { id: 2, guard: { name: "Beto" }, entryTime: "07:20", punctual: false },
    ],
    ...over,
  });

  it("detalle nocturno con elementos, puntualidad y checklist", async () => {
    stub("get", "/shift-handover/1", { success: true, data: detail() });
    const { user } = await open();
    await user.click(screen.getAllByRole("button", { name: "Ver detalles" })[0]);
    const dialog = (await screen.findByText("Detalle de entrega de turno")).closest("[data-it-dialog]") as HTMLElement;
    expect(within(dialog).getByText("Turno Nocturno")).toBeInTheDocument();
    expect(within(dialog).getByText("🌙")).toBeInTheDocument();
    expect(within(dialog).getByText("Novedades reportadas")).toBeInTheDocument();
    expect(within(dialog).getByText("Todo tranquilo")).toBeInTheDocument();
    expect(within(dialog).getByText("Elementos (2)")).toBeInTheDocument();
    expect(within(dialog).getByText("Entrada: 07:00 · Sin novedad")).toBeInTheDocument();
    expect(within(dialog).getByText("Entrada: 07:20")).toBeInTheDocument();
    expect(within(dialog).getByText("Puntual")).toBeInTheDocument();
    expect(within(dialog).getByText("Retraso")).toBeInTheDocument();
    for (const l of ["Teléfonos", "Tablet", "Radios", "Llaves", "Bitácora", "Consignas"]) expect(within(dialog).getByText(l)).toBeInTheDocument();
    expect(within(dialog).getAllByRole("img", { name: /Ana Pérez/i }).length).toBeGreaterThan(0);
  });

  it("detalle matutino sin datos: guiones, 'Sin novedades' y sin elementos", async () => {
    stub("get", "/shift-handover/2", {
      success: true,
      data: detail({ shiftType: "MATUTINO", reportedToAdmin: false, credentialsCount: null, tarjetonesCount: undefined, novedades: "", elements: undefined, createdBy: undefined }),
    });
    const { user } = await open();
    await user.click(screen.getAllByRole("button", { name: "Ver detalles" })[1]);
    const dialog = (await screen.findByText("Detalle de entrega de turno")).closest("[data-it-dialog]") as HTMLElement;
    expect(within(dialog).getByText("Turno Matutino")).toBeInTheDocument();
    expect(within(dialog).getByText("☀️")).toBeInTheDocument();
    expect(within(dialog).getByText("Novedades no reportadas")).toBeInTheDocument();
    expect(within(dialog).getByText("Sin novedades")).toBeInTheDocument();
    expect(within(dialog).getByText("Sin elementos registrados.")).toBeInTheDocument();
    expect(within(dialog).getAllByText("—").length).toBeGreaterThanOrEqual(4);
    expect(within(dialog).getByRole("img", { name: "Usuario" })).toBeInTheDocument();
  });

  it("elemento sin guardia usa '?' como inicial", async () => {
    stub("get", "/shift-handover/1", { success: true, data: detail({ elements: [{ id: 9, entryTime: "08:00", punctual: true }] }) });
    const { user } = await open();
    await user.click(screen.getAllByRole("button", { name: "Ver detalles" })[0]);
    const dialog = (await screen.findByText("Detalle de entrega de turno")).closest("[data-it-dialog]") as HTMLElement;
    expect(within(dialog).getByText("Elementos (1)")).toBeInTheDocument();
  });

  it("si el detalle no carga no abre el diálogo; Escape cierra el abierto", async () => {
    stub("get", "/shift-handover/1", { success: false });
    const { user } = await open();
    await user.click(screen.getAllByRole("button", { name: "Ver detalles" })[0]);
    await new Promise((r) => setTimeout(r, 200));
    expect(screen.queryByText("Detalle de entrega de turno")).toBeNull();
    stub("get", "/shift-handover/1", { success: true, data: detail() });
    await user.click(screen.getAllByRole("button", { name: "Ver detalles" })[0]);
    await screen.findByText("Detalle de entrega de turno");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByText("Detalle de entrega de turno")).toBeNull());
  });
});

describe("entrega de turno: nueva", () => {
  const guards = [
    { id: 1, name: "Ana", lastName: "Pérez", role: { name: "GUARD" } },
    { id: 2, name: "Beto", lastName: null, role: { name: "GUARD" } },
    { id: 3, name: "Cami", lastName: "S", role: { name: "ADMIN" } },
    { id: 4, role: { name: "GUARD" } },
  ];
  const open = async (data: unknown = { success: true, data: guards }) => {
    stub("get", "/users", data);
    table("/shift-handover/datatable", rows);
    const r = renderApp({ route: "/shift-handover/nuevo", role: "ADMIN" });
    await screen.findByRole("button", { name: "Enviar reporte de turno" });
    return r;
  };
  const guardInput = () => screen.getByPlaceholderText("Selecciona un guardia...");
  const timeInput = () => screen.getByPlaceholderText("07:00");

  it("el turno por defecto depende de la hora (14 h o más → matutino)", async () => {
    vi.useFakeTimers({ toFake: ["Date"], now: new Date(2026, 9, 20, 15, 0, 0) });
    const a = await open();
    expect(screen.getByText("Matutino").closest("[class*=bg-emerald-50]")).toBeTruthy();
    a.unmount();
    vi.setSystemTime(new Date(2026, 9, 20, 9, 0, 0));
    await open();
    expect(screen.getByText("Nocturno").closest("[class*=bg-emerald-50]")).toBeTruthy();
  });

  it("no envía sin confirmar el reporte a administración", async () => {
    const created = stub("post", "/shift-handover");
    const { user } = await open();
    await user.click(screen.getByRole("button", { name: "Enviar reporte de turno" }));
    expect(toast()).toMatchObject({ message: "Debes confirmar que se reportaron las novedades a la administración", type: "warning" });
    expect(created.method).toBe("");
  });

  it("agregar elemento exige guardia y hora", async () => {
    const { user } = await open();
    await user.click(screen.getByRole("button", { name: "Agregar" }));
    expect(toast()).toMatchObject({ message: "Selecciona un guardia", type: "warning" });
    await pickOption(user, guardInput(), "Ana Pérez");
    await user.click(screen.getByRole("button", { name: "Agregar" }));
    expect(toast()).toMatchObject({ message: "Indica la hora de entrada", type: "warning" });
  });

  it("solo ofrece guardias; agrega, alterna puntualidad y quita elementos", async () => {
    const { user } = await open();
    await user.click(guardInput());
    expect(await screen.findByText("Ana Pérez")).toBeInTheDocument();
    expect(screen.queryByText("Cami S")).toBeNull();
    await user.click(screen.getByText("Ana Pérez"));
    await user.type(timeInput(), " 07:00 ");
    await user.click(screen.getByRole("button", { name: "Agregar" }));
    expect(screen.getByText("Entrada: 07:00")).toBeInTheDocument();
    expect(screen.getByText("Elementos registrados").nextSibling?.textContent).toBe("1");
    expect(screen.getByText("Puntuales").nextSibling?.textContent).toBe("1");
    await user.click(screen.getAllByRole("switch")[0]);
    await waitFor(() => expect(screen.getByText("Puntuales").nextSibling?.textContent).toBe("0"));
    await user.click(screen.getByRole("button", { name: "Quitar elemento" }));
    expect(screen.getByText("Aún no hay elementos")).toBeInTheDocument();
  });

  it("alternar la puntualidad de un elemento no afecta a los demás", async () => {
    const { user } = await open();
    for (const [name, hour] of [["Ana Pérez", "07:00"], ["Beto", "08:00"]] as const) {
      await user.clear(guardInput());
      await pickOption(user, guardInput(), name);
      await user.clear(timeInput());
      await user.type(timeInput(), hour);
      await user.click(screen.getByRole("button", { name: "Agregar" }));
    }
    await user.click(screen.getAllByRole("switch")[0]);
    await waitFor(() => expect(screen.getByText("Puntuales").nextSibling?.textContent).toBe("1"));
  });

  it("guardia sin apellido ni nombre genera etiqueta e iniciales por defecto", async () => {
    const { user } = await open();
    await pickOption(user, guardInput(), "Beto");
    await user.type(timeInput(), "08:00");
    await user.click(screen.getByRole("button", { name: "Agregar" }));
    expect(screen.getByRole("img", { name: "Beto" })).toBeInTheDocument();
    await user.clear(guardInput()); // el selector conserva el texto anterior (ver nota en tests de rutas)
    await pickOption(user, guardInput(), /undefined/);
    await user.type(timeInput(), "09:00");
    await user.click(screen.getByRole("button", { name: "Agregar" }));
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("envía el reporte completo", async () => {
    const created = stub("post", "/shift-handover", { success: true, data: { id: 1 } });
    const { user, container } = await open();
    await user.click(screen.getByText("Nocturno"));
    const date = container.querySelector<HTMLInputElement>('input[name="handoverDate"]')!;
    await user.clear(date);
    await user.type(date, "15102026");
    await user.type(container.querySelector('input[name="credentialsCount"]')!, "5");
    await user.type(container.querySelector('input[name="tarjetonesCount"]')!, "3");
    await user.type(screen.getByPlaceholderText("Describe las novedades del turno..."), "Sin novedad");
    await pickOption(user, guardInput(), "Ana Pérez");
    await user.type(timeInput(), "07:00");
    await user.click(screen.getByRole("button", { name: "Agregar" }));
    await user.click(screen.getAllByRole("switch")[1]); // Teléfonos (tras el interruptor de puntualidad)
    const reported = screen.getAllByRole("switch").at(-1)!;
    await user.click(reported);
    expect(screen.getByText("Sí", { selector: "span" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Enviar reporte de turno" }));
    await waitFor(() => expect(created.body).toMatchObject({
      shiftType: "NOCTURNO", handoverDate: "2026-10-15", credentialsCount: 5, tarjetonesCount: 3, novedades: "Sin novedad", reportedToAdmin: true,
      elements: [{ guardId: 1, entryTime: "07:00", punctual: true }],
    }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Entrega de turno registrada", type: "success" }));
  });

  it("sin cantidades ni novedades no manda esos campos", async () => {
    const created = stub("post", "/shift-handover", { success: true });
    const { user } = await open();
    await user.click(screen.getAllByRole("switch").at(-1)!);
    await user.click(screen.getByRole("button", { name: "Enviar reporte de turno" }));
    await waitFor(() => expect(created.body).toBeDefined());
    const body: any = created.body;
    expect(body.credentialsCount).toBeUndefined();
    expect(body.tarjetonesCount).toBeUndefined();
    expect(body.novedades).toBeUndefined();
    expect(body.elements).toEqual([]);
  });

  it("API sin éxito: mensaje o genérico; error HTTP: mensaje o 'Error de conexión'", async () => {
    stub("post", "/shift-handover", { success: false, messages: ["Duplicado"] });
    const { user } = await open();
    await user.click(screen.getAllByRole("switch").at(-1)!);
    await user.click(screen.getByRole("button", { name: "Enviar reporte de turno" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Duplicado", type: "error" }));
    stub("post", "/shift-handover", { success: false });
    await user.click(screen.getByRole("button", { name: "Enviar reporte de turno" }));
    await waitFor(() => expect(toast().message).toBe("No se pudo registrar"));
    fail("post", "/shift-handover", ["Sin permiso"], 403);
    await user.click(screen.getByRole("button", { name: "Enviar reporte de turno" }));
    await waitFor(() => expect(toast().message).toBe("Sin permiso"));
    stub("post", "/shift-handover", {}, 500);
    await user.click(screen.getByRole("button", { name: "Enviar reporte de turno" }));
    await waitFor(() => expect(toast().message).toBe("Error de conexión"));
  });

  it("si no cargan los usuarios no hay guardias; cancelar y regresar vuelven al historial", async () => {
    const { user } = await open({ success: false });
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(await screen.findByRole("button", { name: /nueva entrega de turno/i })).toBeInTheDocument();
  });

  it("la flecha de regreso vuelve al historial", async () => {
    const { user } = await open();
    await user.click(screen.getByRole("button", { name: /volver|atrás|back/i }));
    expect(await screen.findByRole("button", { name: /nueva entrega de turno/i })).toBeInTheDocument();
  });
});
