import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import store from "@app/core/store/store";
import { fail, stub, table } from "../helpers/api";
import { schedules } from "../helpers/fixtures";
import { renderApp } from "../helpers/render";

const toast = () => store.getState().toast;
const open = async () => {
  const bodies = table("/schedules/datatable", schedules);
  const r = renderApp({ route: "/schedules", role: "ADMIN" });
  await screen.findByText("Matutino");
  return { ...r, bodies };
};
const dialogOf = (title: string) => screen.findByText(title).then((el) => el.closest("[data-it-dialog]") as HTMLElement);
const rowBtn = (label: string, idx: number) => screen.getAllByRole("button", { name: label })[idx];

describe("horarios", () => {
  it("lista horarios con entrada, salida y estado", async () => {
    await open();
    expect(screen.getByText("Nocturno")).toBeInTheDocument();
    expect(screen.getByText("ID: 1")).toBeInTheDocument();
    expect(screen.getAllByText("07:00").length).toBeGreaterThan(0);
    expect(screen.getByText("Activo")).toBeInTheDocument();
    expect(screen.getByText("Inactivo")).toBeInTheDocument();
  });

  it("actualizar vuelve a pedir datos", async () => {
    const { user, bodies } = await open();
    const n = bodies.length;
    await user.click(screen.getByRole("button", { name: "Actualizar" }));
    await waitFor(() => expect(bodies.length).toBeGreaterThan(n));
  });

  it("crea un horario con los valores por defecto editados", async () => {
    const created = stub("post", "/schedules", { success: true, data: { id: 3 } });
    const { user, bodies } = await open();
    const n = bodies.length;
    await user.click(screen.getByRole("button", { name: /alta de horario/i }));
    const dialog = await dialogOf("Nuevo Horario");
    const [start, end] = [within(dialog).getByLabelText("Entrada"), within(dialog).getByLabelText("Salida")];
    expect(start).toHaveValue("07:00");
    expect(end).toHaveValue("15:00");
    await user.type(within(dialog).getByPlaceholderText("Ej. Matutino"), "Vespertino");
    await user.clear(start);
    await user.type(start, "15:00");
    await user.clear(end);
    await user.type(end, "23:00");
    await user.click(within(dialog).getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(created.body).toEqual({ name: "Vespertino", startTime: "15:00", endTime: "23:00" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Horario creado correctamente", type: "success" }));
    await waitFor(() => expect(bodies.length).toBeGreaterThan(n));
    await waitFor(() => expect(screen.queryByText("Nuevo Horario")).toBeNull());
  });

  it("edita un horario existente y reabre limpio para uno nuevo", async () => {
    const updated = stub("put", "/schedules/2", { success: true, data: {} });
    const { user } = await open();
    await user.click(rowBtn("Editar", 1));
    const dialog = await dialogOf("Editar Horario");
    const name = within(dialog).getByPlaceholderText("Ej. Matutino");
    expect(name).toHaveValue("Nocturno");
    await user.clear(name);
    await user.type(name, "Noche");
    await user.click(within(dialog).getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(updated.body).toEqual({ name: "Noche", startTime: "19:00", endTime: "07:00" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Horario actualizado correctamente", type: "success" }));
    await waitFor(() => expect(screen.queryByText("Editar Horario")).toBeNull());
    await user.click(screen.getByRole("button", { name: /alta de horario/i }));
    const fresh = await dialogOf("Nuevo Horario");
    expect(within(fresh).getByPlaceholderText("Ej. Matutino")).toHaveValue("");
  });

  it("error al guardar muestra el mensaje del servidor", async () => {
    fail("post", "/schedules", ["Duplicado"], 400);
    const { user } = await open();
    await user.click(screen.getByRole("button", { name: /alta de horario/i }));
    const dialog = await dialogOf("Nuevo Horario");
    await user.click(within(dialog).getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Duplicado", type: "error" }));
    expect(screen.getByText("Nuevo Horario")).toBeInTheDocument();
  });

  it("error al guardar sin mensaje usa el texto por defecto", async () => {
    stub("post", "/schedules", {}, 500);
    const { user } = await open();
    await user.click(screen.getByRole("button", { name: /alta de horario/i }));
    const dialog = await dialogOf("Nuevo Horario");
    await user.click(within(dialog).getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Error al guardar el horario", type: "error" }));
  });

  it("cancelar cierra el formulario", async () => {
    const { user } = await open();
    await user.click(screen.getByRole("button", { name: /alta de horario/i }));
    const dialog = await dialogOf("Nuevo Horario");
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByText("Nuevo Horario")).toBeNull());
  });

  it("elimina con confirmación", async () => {
    const del = stub("delete", "/schedules/1", { success: true, data: true });
    const { user, bodies } = await open();
    const n = bodies.length;
    await user.click(rowBtn("Eliminar", 0));
    const dialog = await dialogOf("Confirmar Eliminación");
    await user.click(within(dialog).getByRole("button", { name: "Eliminar horario" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Horario eliminado correctamente", type: "success" }));
    expect(del.path).toBe("/schedules/1");
    await waitFor(() => expect(bodies.length).toBeGreaterThan(n));
  });

  it("error al eliminar avisa", async () => {
    fail("delete", "/schedules/1", ["En uso"], 409);
    const { user } = await open();
    await user.click(rowBtn("Eliminar", 0));
    const dialog = await dialogOf("Confirmar Eliminación");
    await user.click(within(dialog).getByRole("button", { name: "Eliminar horario" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "En uso", type: "error" }));
  });

  it("error al eliminar sin mensaje usa el texto por defecto", async () => {
    stub("delete", "/schedules/1", {}, 500);
    const { user } = await open();
    await user.click(rowBtn("Eliminar", 0));
    const dialog = await dialogOf("Confirmar Eliminación");
    await user.click(within(dialog).getByRole("button", { name: "Eliminar horario" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Error al eliminar el horario", type: "error" }));
  });

  it("cancelar y Escape cierran la confirmación sin eliminar", async () => {
    const del = stub("delete", "/schedules/1");
    const { user } = await open();
    await user.click(rowBtn("Eliminar", 0));
    const dialog = await dialogOf("Confirmar Eliminación");
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByText("Confirmar Eliminación")).toBeNull());
    await user.click(rowBtn("Eliminar", 0));
    await screen.findByText("Confirmar Eliminación");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByText("Confirmar Eliminación")).toBeNull());
    expect(del.method).toBe("");
  });

  it("Escape cierra el formulario", async () => {
    const { user } = await open();
    await user.click(screen.getByRole("button", { name: /alta de horario/i }));
    await screen.findByText("Nuevo Horario");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByText("Nuevo Horario")).toBeNull());
  });
});
