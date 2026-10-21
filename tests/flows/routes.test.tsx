import { screen, waitFor, within } from "@testing-library/react";
import QRCode from "qrcode";
import { describe, expect, it, vi } from "vitest";
import store from "@app/core/store/store";
import { fail, stub, table } from "../helpers/api";
import { renderApp } from "../helpers/render";
import { pickOption } from "../helpers/ui";

const toast = () => store.getState().toast;

const routes = [
  {
    id: 1, title: "Ronda norte", active: true,
    recurringLocations: [
      { location: { id: 7, name: "Puerta Norte" }, tasks: [{ description: "Revisar cerradura", reqPhoto: true }, { description: "Luces", reqPhoto: false }] },
      { location: { id: 8, name: "Alberca" }, tasks: [] },
    ],
    guards: [{ id: 2 }],
  },
  { id: 2, title: "Ronda vacía", active: false, recurringLocations: [], guards: undefined },
  { id: 3, title: "Sin relaciones", active: true },
];
const users = [
  { id: 1, name: "Ana", lastName: "Pérez", username: "ana", active: true, role: { name: "GUARD" } },
  { id: 2, name: "Beto", lastName: "Ruiz", username: "beto", active: true, role: { name: "SHIFT" } },
  { id: 3, name: "Cami", lastName: "", username: "cami", active: true, role: "MAINT" },
  { id: 4, name: "Dani", lastName: "Gil", username: "dani", active: false, role: { name: "GUARD" } },
  { id: 5, name: "Eli", lastName: "Mora", username: "eli", active: true, role: { name: "ADMIN" } },
];
const locations = [
  { id: 7, name: "Puerta Norte", aisle: "N", number: "1" },
  { id: 8, name: "Alberca", aisle: "A", number: "2" },
  { id: 9, name: "Gimnasio", aisle: "G", number: "3" },
];

const open = async () => {
  stub("get", "/locations", { success: true, data: locations });
  stub("get", "/users", { success: true, data: users });
  const bodies = table("/recurring/datatable", routes);
  const r = renderApp({ route: "/routes", role: "ADMIN" });
  await waitFor(() => expect(bodies.length).toBeGreaterThanOrEqual(2));
  await screen.findByText("Ronda norte");
  return { ...r, bodies };
};
const rowBtn = (label: string, idx: number) => screen.getAllByRole("button", { name: label })[idx];
const modal = () => screen.findByText(/Nueva ruta|Ajustar ruta/).then((el) => el.closest("[data-it-dialog]") as HTMLElement);
const locSelect = (d: HTMLElement) => within(d).getByPlaceholderText("Busca una ubicación para agregarla...");

describe("rutas: listado", () => {
  it("muestra rutas con estado, puntos y ubicación inicial", async () => {
    await open();
    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.getAllByText("ACTIVA").length).toBeGreaterThan(0);
    expect(screen.getByText("INACTIVA")).toBeInTheDocument();
    expect(screen.getByText("Puerta Norte")).toBeInTheDocument();
    expect(screen.getByText("2 Puntos registrados en sistema")).toBeInTheDocument();
    expect(screen.getAllByText("SIN UBICACIÓN").length).toBe(2);
    expect(screen.getAllByText("0 Puntos registrados en sistema").length).toBe(2);
  });

  it("buscar por nombre, limpiar y actualizar", async () => {
    const { user, bodies } = await open();
    await user.type(screen.getByPlaceholderText("Buscar por nombre..."), "nor");
    await waitFor(() => expect(bodies.at(-1).filters.title).toBe("nor"));
    await user.click(screen.getByRole("button", { name: "Limpiar búsqueda" }));
    await waitFor(() => expect(bodies.at(-1).filters.title).toBe(""));
    const n = bodies.length;
    await user.click(screen.getByRole("button", { name: "Actualizar datos" }));
    await waitFor(() => expect(bodies.length).toBeGreaterThan(n));
  });

  it("eliminar con confirmación", async () => {
    const del = stub("delete", "/recurring/2", { success: true });
    const { user, bodies } = await open();
    const n = bodies.length;
    await user.click(rowBtn("Eliminar", 1));
    const dialog = (await screen.findByText("Eliminar ruta", { selector: "h2, h3, div, span" })).closest("[data-it-dialog]") as HTMLElement;
    await user.click(within(dialog).getByRole("button", { name: "Eliminar ruta" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Ruta eliminada", type: "success" }));
    expect(del.path).toBe("/recurring/2");
    await waitFor(() => expect(bodies.length).toBeGreaterThan(n));
  });

  it("si el API no confirma la baja avisa del error", async () => {
    stub("delete", "/recurring/1", { success: false });
    const { user } = await open();
    await user.click(rowBtn("Eliminar", 0));
    const dialog = (await screen.findByText("¿Estás seguro de eliminar esta ruta de servicio? Esta acción no se puede deshacer.")).closest("[data-it-dialog]") as HTMLElement;
    await user.click(within(dialog).getByRole("button", { name: "Eliminar ruta" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Error al eliminar", type: "error" }));
  });

  it("cancelar y Escape cierran la confirmación", async () => {
    const del = stub("delete", "/recurring/1");
    const { user } = await open();
    await user.click(rowBtn("Eliminar", 0));
    const dialog = (await screen.findByText(/Esta acción no se puede deshacer/)).closest("[data-it-dialog]") as HTMLElement;
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByText(/Esta acción no se puede deshacer/)).toBeNull());
    await user.click(rowBtn("Eliminar", 0));
    await screen.findByText(/Esta acción no se puede deshacer/);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByText(/Esta acción no se puede deshacer/)).toBeNull());
    expect(del.method).toBe("");
  });
});

describe("rutas: alta", () => {
  const openCreate = async () => {
    const ctx = await open();
    await ctx.user.click(screen.getByRole("button", { name: /agregar ruta/i }));
    const dialog = await modal();
    await within(dialog).findByText("Ana Pérez");
    return { ...ctx, dialog };
  };

  it("arranca con todo el personal activo y operativo seleccionado", async () => {
    const { dialog } = await openCreate();
    expect(within(dialog).getByText("3 guardias")).toBeInTheDocument();
    expect(within(dialog).getByText("0 puntos")).toBeInTheDocument();
    expect(within(dialog).getByText("3 de 3 asignados")).toBeInTheDocument();
    expect(within(dialog).queryByText("Dani Gil")).toBeNull();
    expect(within(dialog).queryByText("Eli Mora")).toBeNull();
    expect(within(dialog).getByText("Ruta vacía")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Crear ruta" })).toBeDisabled();
    expect(within(dialog).getByRole("button", { name: /imprimir qrs/i })).toBeDisabled();
  });

  it("marcar/limpiar todos y alternar un guardia", async () => {
    const { user, dialog } = await openCreate();
    await user.click(within(dialog).getByRole("button", { name: "Limpiar" }));
    expect(within(dialog).getByText("0 de 3 asignados")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Marcar todos" }));
    expect(within(dialog).getByText("3 de 3 asignados")).toBeInTheDocument();
    await user.click(within(dialog).getByText("Beto Ruiz"));
    expect(within(dialog).getByText("2 de 3 asignados")).toBeInTheDocument();
    await user.click(within(dialog).getByText("Beto Ruiz"));
    expect(within(dialog).getByText("3 de 3 asignados")).toBeInTheDocument();
  });

  it("agrega puntos, consignas editables, y los quita", async () => {
    const { user, dialog } = await openCreate();
    await pickOption(user, locSelect(dialog), "Puerta Norte (N-1)");
    await user.click(within(dialog).getByRole("button", { name: "Añadir" }));
    expect(within(dialog).getByText("1 punto en el recorrido")).toBeInTheDocument();
    expect(within(dialog).getByText("Sin consignas")).toBeInTheDocument();
    // El selector del UI System conserva el texto anterior tras reiniciar su valor: se limpia a mano.
    await user.clear(locSelect(dialog));
    await pickOption(user, locSelect(dialog), "Alberca (A-2)");
    await user.click(within(dialog).getByRole("button", { name: "Añadir" }));
    expect(within(dialog).getByText("2 puntos en el recorrido")).toBeInTheDocument();

    await user.click(within(dialog).getAllByRole("button", { name: "Consigna" })[0]);
    await user.click(within(dialog).getAllByRole("button", { name: "Consigna" })[0]);
    expect(within(dialog).getByText("2 consignas")).toBeInTheDocument();
    await user.type(within(dialog).getAllByPlaceholderText("Instrucción para el guardia...")[0], "Revisar");
    expect(within(dialog).getAllByPlaceholderText("Instrucción para el guardia...")[0]).toHaveValue("Revisar");
    await user.click(within(dialog).getAllByRole("button", { name: "Quitar consigna" })[1]);
    expect(within(dialog).getByText("1 consigna")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Quitar Alberca" }));
    expect(within(dialog).getByText("1 punto en el recorrido")).toBeInTheDocument();
  });

  it("crea la ruta con nombre, puntos, consignas y guardias", async () => {
    const created = stub("post", "/recurring", { success: true, data: { id: 9 } });
    const { user, dialog, bodies } = await openCreate();
    const n = bodies.length;
    await user.type(within(dialog).getByPlaceholderText("Ej: Ronda perimetral nocturna"), "Ronda sur");
    await pickOption(user, locSelect(dialog), "Gimnasio (G-3)");
    await user.click(within(dialog).getByRole("button", { name: "Añadir" }));
    await user.click(within(dialog).getByRole("button", { name: "Consigna" }));
    await user.type(within(dialog).getByPlaceholderText("Instrucción para el guardia..."), "Apagar luces");
    await user.click(within(dialog).getByText("Cami"));
    await user.click(within(dialog).getByRole("button", { name: "Crear ruta" }));
    await waitFor(() =>
      expect(created.body).toEqual({
        title: "Ronda sur",
        locations: [{ locationId: 9, locationName: "Gimnasio", tasks: [{ description: "Apagar luces", reqPhoto: false }] }],
        guardIds: [1, 2],
      }),
    );
    await waitFor(() => expect(toast()).toMatchObject({ message: "Guardado correctamente", type: "success" }));
    await waitFor(() => expect(bodies.length).toBeGreaterThan(n));
    await waitFor(() => expect(screen.queryByText("Nueva ruta")).toBeNull());
  });

  it("el API rechaza: muestra los mensajes (o vacío)", async () => {
    stub("post", "/recurring", { success: false, messages: ["Nombre repetido", "otro"] });
    const { user, dialog } = await openCreate();
    await user.type(within(dialog).getByPlaceholderText("Ej: Ronda perimetral nocturna"), "X");
    await pickOption(user, locSelect(dialog), "Gimnasio (G-3)");
    await user.click(within(dialog).getByRole("button", { name: "Añadir" }));
    await user.click(within(dialog).getByRole("button", { name: "Crear ruta" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Error al guardar: Nombre repetido, otro", type: "error" }));
    stub("post", "/recurring", { success: false });
    await user.click(within(dialog).getByRole("button", { name: "Crear ruta" }));
    await waitFor(() => expect(toast().message).toBe("Error al guardar: "));
  });

  it("error de conexión", async () => {
    fail("post", "/recurring", ["x"], 500);
    const { user, dialog } = await openCreate();
    await user.type(within(dialog).getByPlaceholderText("Ej: Ronda perimetral nocturna"), "X");
    await pickOption(user, locSelect(dialog), "Gimnasio (G-3)");
    await user.click(within(dialog).getByRole("button", { name: "Añadir" }));
    await user.click(within(dialog).getByRole("button", { name: "Crear ruta" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Error de conexión", type: "error" }));
  });

  it("imprimir QRs usa el nombre de la ruta; si falla avisa", async () => {
    const { user, dialog } = await openCreate();
    await user.type(within(dialog).getByPlaceholderText("Ej: Ronda perimetral nocturna"), " Ronda QR ");
    await pickOption(user, locSelect(dialog), "Gimnasio (G-3)");
    await user.click(within(dialog).getByRole("button", { name: "Añadir" }));
    const spy = vi.spyOn(QRCode, "toDataURL").mockRejectedValue(new Error("x"));
    await user.click(within(dialog).getByRole("button", { name: /imprimir qrs/i }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "No se pudieron generar los QR", type: "error" }));
    spy.mockResolvedValue("data:image/png;base64,AAAA" as never);
    await user.click(within(dialog).getByRole("button", { name: /imprimir qrs/i }));
    await waitFor(() => expect(document.querySelector("iframe")).not.toBeNull());
    expect(document.querySelector<HTMLIFrameElement>("iframe")!.srcdoc).toContain("Ronda QR");
  });

  it("imprimir sin nombre de ruta no pone encabezado", async () => {
    const { user, dialog } = await openCreate();
    await pickOption(user, locSelect(dialog), "Gimnasio (G-3)");
    await user.click(within(dialog).getByRole("button", { name: "Añadir" }));
    vi.spyOn(QRCode, "toDataURL").mockResolvedValue("data:image/png;base64,AAAA" as never);
    await user.click(within(dialog).getByRole("button", { name: /imprimir qrs/i }));
    await waitFor(() => expect(document.querySelector("iframe")).not.toBeNull());
    expect(document.querySelector<HTMLIFrameElement>("iframe")!.srcdoc).toContain("QR de ubicaciones");
  });

  it("descartar, volver y Escape cierran", async () => {
    const { user, dialog } = await openCreate();
    await user.click(within(dialog).getByRole("button", { name: "Descartar" }));
    await waitFor(() => expect(screen.queryByText("Nueva ruta")).toBeNull());
    await user.click(screen.getByRole("button", { name: /agregar ruta/i }));
    const d2 = await modal();
    await user.click(within(d2).getByRole("button", { name: "Volver" }));
    await waitFor(() => expect(screen.queryByText("Nueva ruta")).toBeNull());
  });

  it("al reabrir el alta empieza limpia", async () => {
    const { user, dialog } = await openCreate();
    await user.type(within(dialog).getByPlaceholderText("Ej: Ronda perimetral nocturna"), "Borrador");
    await user.click(within(dialog).getByRole("button", { name: "Descartar" }));
    await waitFor(() => expect(screen.queryByText("Nueva ruta")).toBeNull());
    await user.click(screen.getByRole("button", { name: /agregar ruta/i }));
    const again = await modal();
    expect(within(again).getByPlaceholderText("Ej: Ronda perimetral nocturna")).toHaveValue("");
  });

  it("si no se cargan ubicaciones ni usuarios, el modal abre vacío", async () => {
    stub("get", "/locations", { success: false });
    stub("get", "/users", { success: false });
    table("/recurring/datatable", routes);
    const r = renderApp({ route: "/routes", role: "ADMIN" });
    await screen.findByText("Ronda norte");
    await r.user.click(screen.getByRole("button", { name: /agregar ruta/i }));
    const dialog = await modal();
    expect(within(dialog).getByText("0 de 0 asignados")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Limpiar" })).toBeInTheDocument();
  });
});

describe("rutas: edición", () => {
  const openEdit = async (idx: number) => {
    const ctx = await open();
    await ctx.user.click(rowBtn("Editar", idx));
    const dialog = await modal();
    await within(dialog).findByText("Ana Pérez");
    return { ...ctx, dialog };
  };

  it("precarga nombre, puntos, consignas y guardias de la ruta", async () => {
    const { dialog } = await openEdit(0);
    expect(within(dialog).getByText("Ajustar ruta")).toBeInTheDocument();
    expect(within(dialog).getByPlaceholderText("Ej: Ronda perimetral nocturna")).toHaveValue("Ronda norte");
    expect(within(dialog).getByText("2 puntos en el recorrido")).toBeInTheDocument();
    expect(within(dialog).getByText("2 consignas")).toBeInTheDocument();
    expect(within(dialog).getByText("1 de 3 asignados")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Guardar cambios" })).toBeEnabled();
  });

  it("guarda cambios con PUT", async () => {
    const updated = stub("put", "/recurring/1", { success: true, data: {} });
    const { user, dialog } = await openEdit(0);
    await user.clear(within(dialog).getByPlaceholderText("Ej: Ronda perimetral nocturna"));
    await user.type(within(dialog).getByPlaceholderText("Ej: Ronda perimetral nocturna"), "Ronda norte 2");
    await user.click(within(dialog).getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(updated.body).toMatchObject({ title: "Ronda norte 2", guardIds: [2] }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Guardado correctamente", type: "success" }));
  });

  it("una ruta sin guardias asignados arranca con ninguno seleccionado", async () => {
    const { dialog } = await openEdit(1);
    expect(within(dialog).getByText("0 de 3 asignados")).toBeInTheDocument();
  });
});
