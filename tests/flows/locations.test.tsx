import { screen, waitFor, within } from "@testing-library/react";
import QRCode from "qrcode";
import { describe, expect, it, vi } from "vitest";
import store from "@app/core/store/store";
import { fail, stub, table } from "../helpers/api";
import LocationsPage from "@app/modules/locations/pages/LocationsPage";
import { renderApp, renderWithProviders } from "../helpers/render";

const rows = [
  { id: 1, name: "A-101-Calle 1", aisle: "A", spot: "101", number: "Calle 1" },
  { id: 2, name: "B-202-Calle 2", aisle: "B", spot: "202", number: "Calle 2" },
];
const toast = () => store.getState().toast;

const open = async (role = "ADMIN") => {
  const bodies = table("/locations/datatable", rows);
  const r = renderApp({ route: "/locations", role });
  // La página remonta la tabla tras 500 ms de debounce: se espera esa segunda carga para no leer en el hueco.
  await waitFor(() => expect(bodies.length).toBeGreaterThanOrEqual(2));
  await screen.findByText("A-101-Calle 1");
  return { ...r, bodies };
};
const actionIn = (rowName: string, label: string) => {
  const idx = rows.findIndex((r) => r.name === rowName);
  return screen.getAllByRole("button", { name: label })[idx];
};

describe("ubicaciones", () => {
  it("lista las ubicaciones y pide la primera página", async () => {
    const { bodies } = await open();
    expect(screen.getByText("B-202-Calle 2")).toBeInTheDocument();
    expect(bodies[0]).toMatchObject({ page: 1, limit: 50, filters: { name: "" } });
  });

  it("buscar filtra por nombre (con debounce) y limpiar quita el filtro", async () => {
    const { user, bodies } = await open();
    await user.type(screen.getByPlaceholderText("Buscar por nombre..."), "A-1");
    await waitFor(() => expect(bodies.at(-1).filters.name).toBe("A-1"));
    await user.click(screen.getByRole("button", { name: "Limpiar búsqueda" }));
    await waitFor(() => expect(bodies.at(-1).filters.name).toBe(""));
    expect(screen.queryByRole("button", { name: "Limpiar búsqueda" })).toBeNull();
  });

  it("actualizar vuelve a pedir los datos", async () => {
    const { user, bodies } = await open();
    const before = bodies.length;
    await user.click(screen.getByRole("button", { name: "Actualizar" }));
    await waitFor(() => expect(bodies.length).toBeGreaterThan(before));
  });

  it("crea una ubicación y refresca", async () => {
    const created = stub("post", "/locations", { success: true, data: { id: 3 } });
    const { user, bodies } = await open();
    const before = bodies.length;
    await user.click(screen.getByRole("button", { name: /nueva ubicación/i }));
    const dialog = await screen.findByRole("dialog", {}).catch(() => document.querySelector("[data-it-dialog]") as HTMLElement);
    await user.type(within(dialog).getByPlaceholderText("Ej: A, SECC-1"), "C");
    await user.type(within(dialog).getByPlaceholderText("Ej: 101, B2"), "303");
    await user.type(within(dialog).getByPlaceholderText("Ej: Calle Principal 123"), "Calle 3");
    expect(within(dialog).getByText("C-303-Calle 3")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(created.body).toEqual({ aisle: "C", spot: "303", number: "Calle 3" }));
    await waitFor(() => expect(bodies.length).toBeGreaterThan(before));
    await waitFor(() => expect(screen.queryByPlaceholderText("Ej: A, SECC-1")).toBeNull());
  });

  it("valida campos requeridos al crear y permite cancelar", async () => {
    const created = stub("post", "/locations");
    const { user } = await open();
    await user.click(screen.getByRole("button", { name: /nueva ubicación/i }));
    await user.click(await screen.findByRole("button", { name: "Guardar" }));
    expect(await screen.findByText("El pasillo es requerido")).toBeInTheDocument();
    expect(screen.getByText("El cajón es requerido")).toBeInTheDocument();
    expect(screen.getByText("El número es requerido")).toBeInTheDocument();
    expect(screen.getByText("Sin nombre")).toBeInTheDocument();
    expect(created.method).toBe("");
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByPlaceholderText("Ej: A, SECC-1")).toBeNull());
  });

  it("edita una ubicación y manda el nombre compuesto", async () => {
    const updated = stub("put", "/locations/2", { success: true, data: {} });
    const { user } = await open();
    await user.click(actionIn("B-202-Calle 2", "Editar"));
    const section = await screen.findByPlaceholderText("Ej: A, SECC-1");
    expect(section).toHaveValue("B");
    await user.clear(section);
    await user.type(section, "Z");
    await user.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(updated.body).toEqual({ aisle: "Z", spot: "202", number: "Calle 2", name: "Z-202-Calle 2" }));
    await waitFor(() => expect(screen.queryByPlaceholderText("Ej: A, SECC-1")).toBeNull());
  });

  it("eliminar pide confirmación y se puede cancelar", async () => {
    const del = stub("delete", "/locations/1");
    const { user } = await open();
    await user.click(actionIn("A-101-Calle 1", "Eliminar"));
    expect(await screen.findByText("Confirmar eliminación")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByText("Confirmar eliminación")).toBeNull());
    expect(del.method).toBe("");
  });

  it("elimina y avisa", async () => {
    const del = stub("delete", "/locations/1", { success: true });
    const { user, bodies } = await open();
    const before = bodies.length;
    await user.click(actionIn("A-101-Calle 1", "Eliminar"));
    const dialog = (await screen.findByText("Confirmar eliminación")).closest("[data-it-dialog]") as HTMLElement;
    await user.click(within(dialog).getByRole("button", { name: "Eliminar" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Ubicación eliminada correctamente", type: "success" }));
    expect(del.path).toBe("/locations/1");
    await waitFor(() => expect(bodies.length).toBeGreaterThan(before));
  });

  it("si el API rechaza la baja muestra los mensajes", async () => {
    stub("delete", "/locations/1", { success: false, messages: ["Tiene rondas", "asociadas"] });
    const { user } = await open();
    await user.click(actionIn("A-101-Calle 1", "Eliminar"));
    const dialog = (await screen.findByText("Confirmar eliminación")).closest("[data-it-dialog]") as HTMLElement;
    await user.click(within(dialog).getByRole("button", { name: "Eliminar" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Tiene rondas, asociadas", type: "error" }));
  });

  it("baja rechazada sin mensajes usa el texto por defecto", async () => {
    stub("delete", "/locations/1", { success: false });
    const { user } = await open();
    await user.click(actionIn("A-101-Calle 1", "Eliminar"));
    const dialog = (await screen.findByText("Confirmar eliminación")).closest("[data-it-dialog]") as HTMLElement;
    await user.click(within(dialog).getByRole("button", { name: "Eliminar" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Error al eliminar", type: "error" }));
  });

  it("error HTTP al eliminar muestra aviso de error", async () => {
    fail("delete", "/locations/1", ["x"], 500);
    const { user } = await open();
    await user.click(actionIn("A-101-Calle 1", "Eliminar"));
    const dialog = (await screen.findByText("Confirmar eliminación")).closest("[data-it-dialog]") as HTMLElement;
    await user.click(within(dialog).getByRole("button", { name: "Eliminar" }));
    await waitFor(() => expect(toast().type).toBe("error"));
  });

  it("muestra el QR de la ubicación y cierra", async () => {
    const { user } = await open();
    await user.click(actionIn("B-202-Calle 2", "Ver código QR"));
    expect(await screen.findByAltText("Código QR de B-202-Calle 2")).toBeInTheDocument();
    expect(screen.getByText("Sección B · #202 · Calle 2")).toBeInTheDocument();
    await user.click(screen.getByText("Cerrar", { selector: "button" }));
    await waitFor(() => expect(screen.queryByAltText("Código QR de B-202-Calle 2")).toBeNull());
  });

  it("si falla la generación del QR avisa", async () => {
    vi.spyOn(QRCode, "toDataURL").mockRejectedValue(new Error("x"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { user } = await open();
    await user.click(actionIn("A-101-Calle 1", "Ver código QR"));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Error al generar el código QR", type: "error" }));
  });

  it("imprimir QR sin permiso de pop-ups avisa", async () => {
    vi.spyOn(window, "open").mockReturnValue(null);
    const { user } = await open();
    await user.click(actionIn("A-101-Calle 1", "Ver código QR"));
    await user.click(await screen.findByRole("button", { name: "Imprimir" }));
    expect(toast()).toMatchObject({ message: "Por favor habilita los pop-ups para imprimir.", type: "warning" });
  });

  it("imprimir QR escribe el documento en la ventana", async () => {
    const win = { document: { write: vi.fn(), close: vi.fn() } };
    vi.spyOn(window, "open").mockReturnValue(win as never);
    const { user } = await open();
    await user.click(actionIn("A-101-Calle 1", "Ver código QR"));
    await user.click(await screen.findByRole("button", { name: "Imprimir" }));
    expect(win.document.write.mock.calls[0][0]).toContain("<h1>A-101-Calle 1</h1>");
    expect(win.document.close).toHaveBeenCalled();
  });

  it("Escape cierra cada diálogo (nueva, editar, QR y eliminar)", async () => {
    const { user } = await open();
    await user.click(screen.getByRole("button", { name: /nueva ubicación/i }));
    await screen.findByPlaceholderText("Ej: A, SECC-1");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByPlaceholderText("Ej: A, SECC-1")).toBeNull());

    await user.click(actionIn("A-101-Calle 1", "Editar"));
    await screen.findByPlaceholderText("Ej: A, SECC-1");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByPlaceholderText("Ej: A, SECC-1")).toBeNull());

    await user.click(actionIn("A-101-Calle 1", "Editar"));
    await screen.findByPlaceholderText("Ej: A, SECC-1");
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByPlaceholderText("Ej: A, SECC-1")).toBeNull());

    await user.click(actionIn("A-101-Calle 1", "Ver código QR"));
    await screen.findByAltText("Código QR de A-101-Calle 1");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByAltText("Código QR de A-101-Calle 1")).toBeNull());

    await user.click(actionIn("A-101-Calle 1", "Eliminar"));
    await screen.findByText("Confirmar eliminación");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByText("Confirmar eliminación")).toBeNull());
  });

  it("error HTTP sin mensaje usa el texto por defecto", async () => {
    stub("delete", "/locations/1", {}, 500);
    const { user } = await open();
    await user.click(actionIn("A-101-Calle 1", "Eliminar"));
    const dialog = (await screen.findByText("Confirmar eliminación")).closest("[data-it-dialog]") as HTMLElement;
    await user.click(within(dialog).getByRole("button", { name: "Eliminar" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Error al eliminar", type: "error" }));
  });

  it("el rol OPERATOR solo puede ver QR (sin crear, editar ni eliminar)", async () => {
    table("/locations/datatable", rows);
    renderWithProviders(<LocationsPage />, { role: "OPERATOR" });
    await screen.findByText("A-101-Calle 1");
    expect(screen.getAllByRole("button", { name: "Ver código QR" })).toHaveLength(2);
    expect(screen.queryByRole("button", { name: "Editar" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Eliminar" })).toBeNull();
    expect(screen.queryByRole("button", { name: /nueva ubicación/i })).toBeNull();
  });
});
