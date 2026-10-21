import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import store from "@app/core/store/store";
import { fail, stub, table } from "../helpers/api";
import { schedules } from "../helpers/fixtures";
import { renderApp } from "../helpers/render";
import { pickOption } from "../helpers/ui";

const toast = () => store.getState().toast;
const ALL = { pantalon: true, botas: true, cinturon: true, camisa: true, pluma: true, gorra: true, unas: true, orejas: true, desodorante: true, afeitado: true, peinado: true };
const MOST = { ...ALL, peinado: false, afeitado: false, gorra: false }; // 8/11 = 73% → "primary"
const FEW = Object.fromEntries(Object.keys(ALL).map((k) => [k, false])); // 0/11

const checks = [
  { id: 1, createdAt: "2026-10-01T15:00:00.000Z", guard: { name: "Ana", lastName: "Pérez" }, evaluatedBy: { name: "Luis", lastName: "Soto" }, ...ALL, notes: "Todo en orden" },
  { id: 2, createdAt: "2026-10-02T15:00:00.000Z", guard: { name: "Beto", lastName: "" }, evaluatedBy: { name: "Luis", lastName: "Soto" }, ...MOST },
  { id: 3, createdAt: "2026-10-03T15:00:00.000Z", ...FEW },
];

describe("uniforme: listado", () => {
  const open = async () => {
    table("/uniform/datatable", checks);
    const r = renderApp({ route: "/uniform", role: "ADMIN" });
    await screen.findByText("11/11");
    return r;
  };

  it("lista con cumplimiento y valores faltantes", async () => {
    await open();
    expect(screen.getByText("8/11")).toBeInTheDocument();
    expect(screen.getByText("0/11")).toBeInTheDocument();
    expect(screen.getByText("Todo en orden")).toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBe(2);
    expect(screen.getByText("?")).toBeInTheDocument(); // fila sin guardia
  });

  it("ver detalle: cumple, con notas y checklist", async () => {
    const { user } = await open();
    await user.click(screen.getAllByRole("button", { name: "Ver detalles" })[0]);
    const dialog = (await screen.findByText("Detalle de uniforme")).closest("[data-it-dialog]") as HTMLElement;
    expect(within(dialog).getByText("100%")).toBeInTheDocument();
    expect(within(dialog).getByText("Cumple")).toBeInTheDocument();
    expect(within(dialog).getByText("11/11 puntos")).toBeInTheDocument();
    expect(within(dialog).getAllByText("Sí")).toHaveLength(11);
    expect(within(dialog).getByText("Todo en orden")).toBeInTheDocument();
    expect(within(dialog).getByText(/Evaluó: Luis Soto/)).toBeInTheDocument();
  });

  it("ver detalle: no cumple, sin guardia ni notas", async () => {
    const { user } = await open();
    await user.click(screen.getAllByRole("button", { name: "Ver detalles" })[2]);
    const dialog = (await screen.findByText("Detalle de uniforme")).closest("[data-it-dialog]") as HTMLElement;
    expect(within(dialog).getByText("0%")).toBeInTheDocument();
    expect(within(dialog).getByText("No cumple")).toBeInTheDocument();
    expect(within(dialog).getAllByText("No")).toHaveLength(11);
    expect(within(dialog).queryByText("Notas")).toBeNull();
  });

  it("Escape cierra el detalle y el botón lleva al alta", async () => {
    const { user } = await open();
    await user.click(screen.getAllByRole("button", { name: "Ver detalles" })[0]);
    await screen.findByText("Detalle de uniforme");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByText("Detalle de uniforme")).toBeNull());
    stub("get", "/users", { success: true, data: [] });
    await user.click(screen.getByRole("button", { name: /nuevo checklist/i }));
    expect(await screen.findByText("Nuevo checklist de uniforme")).toBeInTheDocument();
  });
});

describe("uniforme: nuevo checklist", () => {
  const users = [
    { id: 1, name: "Ana", lastName: "Pérez", username: "ana", role: { name: "GUARD", value: "Guardia" }, schedule: schedules[0] },
    { id: 2, name: "Beto", lastName: null, username: "beto", role: { name: "GUARD" } },
    { id: 3, name: "Eva", lastName: "Gil", username: "eva", role: { name: "ADMIN", value: "Administrador" } },
    { id: 4, name: "", lastName: "", username: "anon", role: { name: "GUARD", value: "Guardia" } },
  ];
  const open = async (data: unknown = { success: true, data: users }) => {
    stub("get", "/users", data);
    table("/uniform/datatable", []);
    const r = renderApp({ route: "/uniform/nuevo", role: "ADMIN" });
    await screen.findByText("Registrar checklist");
    return r;
  };
  const guardInput = () => screen.getByPlaceholderText("Selecciona un guardia...");

  it("solo ofrece guardias y muestra su ficha con turno", async () => {
    const { user } = await open();
    await user.click(guardInput());
    expect(await screen.findByText("Ana Pérez")).toBeInTheDocument();
    expect(screen.getByText("Beto")).toBeInTheDocument();
    expect(screen.queryByText("Eva Gil")).toBeNull();
    await user.click(screen.getByText("Ana Pérez"));
    expect(await screen.findByText("@ana · Guardia")).toBeInTheDocument();
    expect(screen.getByText("Matutino")).toBeInTheDocument();
    expect(screen.getByText("07:00 – 15:00")).toBeInTheDocument();
  });

  it("guardia sin turno ni apellido ni etiqueta de rol", async () => {
    const { user } = await open();
    await pickOption(user, guardInput(), "Beto");
    expect(await screen.findByText("Sin turno")).toBeInTheDocument();
    expect(screen.getByText("@beto · GUARD")).toBeInTheDocument();
  });

  it("guardia sin nombre muestra '?' como inicial", async () => {
    const { user } = await open();
    await user.click(guardInput());
    await user.click((await screen.findAllByText(/^\s*$/, { selector: "[data-it-floating] span" }))[0]);
    expect(await screen.findByText("?")).toBeInTheDocument();
  });

  it("si no se pueden cargar los usuarios la lista queda vacía", async () => {
    await open({ success: false });
    expect(guardInput()).toBeInTheDocument();
  });

  it("sin guardia no registra", async () => {
    const created = stub("post", "/uniform");
    const { user } = await open();
    await user.click(screen.getByRole("button", { name: "Registrar checklist" }));
    expect(toast()).toMatchObject({ message: "Selecciona al guardia a evaluar", type: "warning" });
    expect(created.method).toBe("");
  });

  it("marca elementos, 'Todo bien' y 'Limpiar' actualizan el resumen", async () => {
    const { user } = await open();
    expect(screen.getByText("0%")).toBeInTheDocument();
    expect(screen.getByText("No cumple")).toBeInTheDocument();
    await user.click(screen.getByRole("switch", { name: "Pantalón" }));
    expect(screen.getByText("1/11")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Todo bien" }));
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByText("Cumple")).toBeInTheDocument();
    await user.click(screen.getByRole("switch", { name: "Botas" }));
    expect(screen.getByText("10/11")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Limpiar" }));
    expect(screen.getByText("0/11")).toBeInTheDocument();
  });

  it("registra el checklist con notas y vuelve al listado", async () => {
    const created = stub("post", "/uniform", { success: true, data: { id: 9 } });
    const { user } = await open();
    await pickOption(user, guardInput(), "Ana Pérez");
    await user.click(screen.getByRole("switch", { name: "Camisa" }));
    await user.type(screen.getByPlaceholderText("Observaciones sobre la uniformidad..."), "Falta pluma");
    await user.click(screen.getByRole("button", { name: "Registrar checklist" }));
    await waitFor(() => expect(created.body).toMatchObject({ guardId: 1, camisa: true, pantalon: false, notes: "Falta pluma" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Checklist de uniforme registrado", type: "success" }));
    expect(await screen.findByRole("button", { name: /nuevo checklist/i })).toBeInTheDocument();
  });

  it("sin notas no manda el campo", async () => {
    const created = stub("post", "/uniform", { success: true });
    const { user } = await open();
    await pickOption(user, guardInput(), "Ana Pérez");
    await user.click(screen.getByRole("button", { name: "Registrar checklist" }));
    await waitFor(() => expect(created.body).toBeDefined());
    expect((created.body as any).notes).toBeUndefined();
  });

  it("API sin éxito: muestra su mensaje o el genérico", async () => {
    stub("post", "/uniform", { success: false, messages: ["Ya evaluado hoy"] });
    const { user } = await open();
    await pickOption(user, guardInput(), "Ana Pérez");
    await user.click(screen.getByRole("button", { name: "Registrar checklist" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Ya evaluado hoy", type: "error" }));
    stub("post", "/uniform", { success: false });
    await user.click(screen.getByRole("button", { name: "Registrar checklist" }));
    await waitFor(() => expect(toast().message).toBe("No se pudo registrar"));
  });

  it("error HTTP: mensaje del servidor o 'Error de conexión'", async () => {
    fail("post", "/uniform", ["Sin permiso"], 403);
    const { user } = await open();
    await pickOption(user, guardInput(), "Ana Pérez");
    await user.click(screen.getByRole("button", { name: "Registrar checklist" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Sin permiso", type: "error" }));
    stub("post", "/uniform", {}, 500);
    await user.click(screen.getByRole("button", { name: "Registrar checklist" }));
    await waitFor(() => expect(toast().message).toBe("Error de conexión"));
  });

  it("cancelar y la flecha de regreso vuelven al listado", async () => {
    const { user } = await open();
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(await screen.findByRole("button", { name: /nuevo checklist/i })).toBeInTheDocument();
  });

  it("la flecha de regreso vuelve al listado", async () => {
    const { user } = await open();
    await user.click(screen.getByRole("button", { name: /volver|atrás|back/i }));
    expect(await screen.findByRole("button", { name: /nuevo checklist/i })).toBeInTheDocument();
  });
});
