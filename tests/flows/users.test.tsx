import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import store from "@app/core/store/store";
import { fail, stub, table } from "../helpers/api";
import { roles, schedules } from "../helpers/fixtures";
import { renderApp } from "../helpers/render";
import { pickOption } from "../helpers/ui";

const users = [
  { id: 1, name: "Ana", lastName: "Pérez", username: "ana", roleId: 1, scheduleId: 1, active: true, role: { name: "ADMIN", value: "Administrador" }, schedule: schedules[0] },
  { id: 2, name: "Luis", lastName: "", username: "luis", roleId: 2, scheduleId: 2, active: false, role: { name: "GUARD", value: "Guardia" }, schedule: schedules[1] },
  { id: 3, name: "Eva", lastName: "Gil", username: "eva", roleId: 3, active: true, role: { name: "SHIFT", value: "Supervisor" } },
  { id: 4, name: "Omar", lastName: "Ruiz", username: "omar", roleId: 4, active: true, role: { name: "MAINT", value: "Mantenimiento" } },
  { id: 5, name: "Sin", lastName: "Rol", username: "sinrol", active: true },
];
const toast = () => store.getState().toast;

const open = async () => {
  stub("get", "/catalog/role", { success: true, data: roles });
  stub("get", "/schedules", { success: true, data: schedules });
  const bodies = table("/users/datatable", users);
  const r = renderApp({ route: "/users", role: "ADMIN" });
  // La página remonta la tabla tras 500 ms de debounce: se espera esa segunda carga para no leer en el hueco.
  await waitFor(() => expect(bodies.length).toBeGreaterThanOrEqual(2));
  await screen.findByText("@ana");
  return { ...r, bodies };
};
const rowBtn = (label: string, idx: number) => screen.getAllByRole("button", { name: label })[idx];
const dialogOf = (title: string | RegExp) => screen.findByText(title).then((el) => el.closest("[data-it-dialog]") as HTMLElement);
const typeIn = async (user: any, scope: HTMLElement, placeholder: string, text: string) =>
  user.type(within(scope).getByPlaceholderText(placeholder), text);

describe("usuarios: listado", () => {
  it("muestra usuarios con rol, horario, estado e iniciales", async () => {
    await open();
    expect(screen.getByText("Ana Pérez")).toBeInTheDocument();
    expect(screen.getAllByRole("img", { name: /Ana Pérez/i }).length).toBeGreaterThan(0);
    expect(screen.getByText("Administrador")).toBeInTheDocument();
    expect(screen.getByText("S/R")).toBeInTheDocument();
    expect(screen.getAllByText("Sin Horario").length).toBe(3);
    expect(screen.getByText("07:00 - 15:00")).toBeInTheDocument();
    expect(screen.getAllByText("Activo").length).toBe(4);
    expect(screen.getByText("Inactivo")).toBeInTheDocument();
  });

  it("buscar manda el nombre como filtro y limpiar lo quita", async () => {
    const { user, bodies } = await open();
    await user.type(screen.getByPlaceholderText("Buscar usuario..."), "an");
    await waitFor(() => expect(bodies.at(-1).filters.name).toBe("an"));
    await user.click(screen.getByRole("button", { name: "Limpiar búsqueda" }));
    await waitFor(() => expect(bodies.at(-1).filters.name).toBe(""));
  });

  it("filtrar por rol y estatus manda roleId y active al API; 'Todos' los quita; actualizar recarga", async () => {
    const { user, bodies } = await open();
    await pickOption(user, screen.getByDisplayValue("Todos los roles"), "Guardia");
    await waitFor(() => expect(bodies.at(-1).filters).toMatchObject({ name: "", roleId: "2" }));
    await pickOption(user, screen.getByDisplayValue("Todos"), "Inactivos");
    await waitFor(() => expect(bodies.at(-1).filters).toMatchObject({ roleId: "2", active: false }));
    await pickOption(user, screen.getByDisplayValue("Inactivos"), "Activos");
    await waitFor(() => expect(bodies.at(-1).filters).toMatchObject({ active: true }));
    await pickOption(user, screen.getByDisplayValue("Guardia"), "Todos los roles");
    await pickOption(user, screen.getByDisplayValue("Activos"), "Todos");
    await waitFor(() => expect(bodies.at(-1).filters).toEqual({ name: "" }));
    const n = bodies.length;
    await user.click(screen.getByRole("button", { name: "Actualizar" }));
    await waitFor(() => expect(bodies.length).toBeGreaterThan(n));
  });
});

describe("usuarios: alta", () => {
  const openCreate = async () => {
    const ctx = await open();
    await ctx.user.click(screen.getByRole("button", { name: /nuevo usuario/i }));
    const dialog = await dialogOf("Nuevo Usuario");
    await within(dialog).findByRole("button", { name: "Guardia" }).catch(() => {});
    return { ...ctx, dialog };
  };

  it("solo ofrece los roles del staff de BARCELONA", async () => {
    const { dialog } = await openCreate();
    expect(within(dialog).getAllByRole("button").map((b) => b.textContent)).toEqual(
      expect.arrayContaining(["Administrador", "Guardia", "Supervisor", "Mantenimiento"]),
    );
    expect(within(dialog).queryByText("Cliente")).toBeNull();
  });

  it("valida requeridos y que las contraseñas coincidan", async () => {
    const created = stub("post", "/users");
    const { user, dialog } = await openCreate();
    await user.click(within(dialog).getByRole("button", { name: "Crear usuario" }));
    expect(await within(dialog).findByText("El nombre es requerido")).toBeInTheDocument();
    expect(within(dialog).getByText("Los apellidos son requeridos")).toBeInTheDocument();
    expect(within(dialog).getByText("El usuario es requerido")).toBeInTheDocument();
    expect(within(dialog).getByText("La contraseña es requerida")).toBeInTheDocument();
    expect(within(dialog).getByText("Selecciona un rol")).toBeInTheDocument();
    await typeIn(user, dialog, "Mínimo 6 caracteres", "abc");
    await typeIn(user, dialog, "Repite la contraseña", "xyz");
    await user.click(within(dialog).getByRole("button", { name: "Crear usuario" }));
    expect(await within(dialog).findByText("Mínimo 6 caracteres", { selector: "p, span" })).toBeInTheDocument();
    expect(created.method).toBe("");
  });

  it("generar contraseña llena ambos campos y la muestra; mostrar/ocultar alterna", async () => {
    const { user, dialog } = await openCreate();
    const pass = within(dialog).getByPlaceholderText("Mínimo 6 caracteres") as HTMLInputElement;
    const confirm = within(dialog).getByPlaceholderText("Repite la contraseña") as HTMLInputElement;
    expect(pass.type).toBe("password");
    await user.click(within(dialog).getByRole("button", { name: /generar contraseña segura/i }));
    await waitFor(() => expect(pass.value).toHaveLength(10));
    expect(confirm.value).toBe(pass.value);
    expect(pass.type).toBe("text");
    await user.click(within(dialog).getByRole("button", { name: "Ocultar" }));
    expect(pass.type).toBe("password");
    await user.click(within(dialog).getByRole("button", { name: "Mostrar" }));
    expect(pass.type).toBe("text");
  });

  it("administrador: crea sin horario", async () => {
    const created = stub("post", "/users", { success: true, data: { id: 9 } });
    const { user, dialog, bodies } = await openCreate();
    const n = bodies.length;
    await typeIn(user, dialog, "Ej. Roberto", "  Rob ");
    await typeIn(user, dialog, "Ej. García López", "García");
    await typeIn(user, dialog, "Ej. rgarcia", "rgarcia");
    await typeIn(user, dialog, "Mínimo 6 caracteres", "secreto1");
    await typeIn(user, dialog, "Repite la contraseña", "secreto1");
    await user.click(within(dialog).getByRole("button", { name: "Administrador" }));
    expect(within(dialog).queryByText("Horario laboral")).toBeNull();
    await user.click(within(dialog).getByRole("button", { name: "Crear usuario" }));
    await waitFor(() => expect(created.body).toEqual({ name: "Rob", lastName: "García", username: "rgarcia", roleId: 1, password: "secreto1" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Usuario creado correctamente", type: "success" }));
    await waitFor(() => expect(bodies.length).toBeGreaterThan(n));
  });

  it("guardia: exige horario y lo manda", async () => {
    const created = stub("post", "/users", { success: true, data: { id: 9 } });
    const { user, dialog } = await openCreate();
    await typeIn(user, dialog, "Ej. Roberto", "Pedro");
    await typeIn(user, dialog, "Ej. García López", "Mora");
    await typeIn(user, dialog, "Ej. rgarcia", "pmora");
    await typeIn(user, dialog, "Mínimo 6 caracteres", "secreto1");
    await typeIn(user, dialog, "Repite la contraseña", "secreto1");
    await user.click(within(dialog).getByRole("button", { name: "Guardia" }));
    expect(await within(dialog).findByText("Horario laboral")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Crear usuario" }));
    expect(await within(dialog).findByText("El horario es obligatorio para personal operativo")).toBeInTheDocument();
    expect(created.method).toBe("");
    await pickOption(user, within(dialog).getByPlaceholderText("Selecciona un horario"), "Matutino (07:00 - 15:00)");
    await user.click(within(dialog).getByRole("button", { name: "Crear usuario" }));
    await waitFor(() => expect(created.body).toMatchObject({ roleId: 2, scheduleId: 1, username: "pmora" }));
  });

  const fillValid = async (user: any, dialog: HTMLElement) => {
    await typeIn(user, dialog, "Ej. Roberto", "Pedro");
    await typeIn(user, dialog, "Ej. García López", "Mora");
    await typeIn(user, dialog, "Ej. rgarcia", "pmora");
    await typeIn(user, dialog, "Mínimo 6 caracteres", "secreto1");
    await typeIn(user, dialog, "Repite la contraseña", "secreto1");
    await user.click(within(dialog).getByRole("button", { name: "Administrador" }));
    await user.click(within(dialog).getByRole("button", { name: "Crear usuario" }));
  };

  it("si el API responde sin éxito muestra su primer mensaje", async () => {
    stub("post", "/users", { success: false, messages: ["Usuario duplicado"] });
    const { user, dialog } = await openCreate();
    await fillValid(user, dialog);
    await waitFor(() => expect(toast()).toMatchObject({ message: "Usuario duplicado", type: "error" }));
  });

  it("sin éxito y sin mensajes usa el texto por defecto", async () => {
    stub("post", "/users", { success: false });
    const { user, dialog } = await openCreate();
    await fillValid(user, dialog);
    await waitFor(() => expect(toast()).toMatchObject({ message: "Error al procesar usuario", type: "error" }));
  });

  it("error HTTP con mensajes", async () => {
    fail("post", "/users", ["Nombre inválido"], 400);
    const { user, dialog } = await openCreate();
    await fillValid(user, dialog);
    await waitFor(() => expect(toast()).toMatchObject({ message: "Nombre inválido", type: "error" }));
  });

  it("error HTTP sin mensajes", async () => {
    stub("post", "/users", {}, 500);
    const { user, dialog } = await openCreate();
    await fillValid(user, dialog);
    await waitFor(() => expect(toast()).toMatchObject({ message: "Ocurrió un error inesperado", type: "error" }));
  });

  it("cancelar cierra el diálogo", async () => {
    const { user, dialog } = await openCreate();
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByText("Nuevo Usuario")).toBeNull());
  });

  it("Escape cierra el diálogo", async () => {
    const { user } = await openCreate();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByText("Nuevo Usuario")).toBeNull());
  });
});

describe("usuarios: edición", () => {
  it("precarga datos, no pide contraseña y manda PUT", async () => {
    const updated = stub("put", "/users/2", { success: true, data: {} });
    const { user } = await open();
    await user.click(rowBtn("Editar", 1));
    const dialog = await dialogOf("Editar Usuario: Luis");
    expect(within(dialog).getByPlaceholderText("Ej. Roberto")).toHaveValue("Luis");
    expect(within(dialog).queryByPlaceholderText("Mínimo 6 caracteres")).toBeNull();
    expect(within(dialog).getByText(/la contraseña se cambia desde la tabla/)).toBeInTheDocument();
    await user.clear(within(dialog).getByPlaceholderText("Ej. García López"));
    await user.type(within(dialog).getByPlaceholderText("Ej. García López"), "Soto");
    await user.click(within(dialog).getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(updated.body).toEqual({ name: "Luis", lastName: "Soto", username: "luis", roleId: 2, scheduleId: 2 }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Usuario editado correctamente", type: "success" }));
  });

  it("editar un administrador no manda horario", async () => {
    const updated = stub("put", "/users/1", { success: true, data: {} });
    const { user } = await open();
    await user.click(rowBtn("Editar", 0));
    const dialog = await dialogOf("Editar Usuario: Ana");
    await user.click(within(dialog).getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(updated.body).toEqual({ name: "Ana", lastName: "Pérez", username: "ana", roleId: 1 }));
  });
});

describe("usuarios: cambiar contraseña", () => {
  const openPw = async () => {
    const ctx = await open();
    await ctx.user.click(rowBtn("Cambiar contraseña", 0));
    const dialog = await dialogOf("Cambiar Contraseña");
    return { ...ctx, dialog };
  };
  const pwInputs = (dialog: HTMLElement) => dialog.querySelectorAll<HTMLInputElement>('input[type="password"]');

  it("valida longitud y coincidencia", async () => {
    const reset = stub("put", "/users/1/reset-password");
    const { user, dialog } = await openPw();
    expect(within(dialog).getByText("ana")).toBeInTheDocument();
    await user.type(pwInputs(dialog)[0], "abc");
    await user.type(pwInputs(dialog)[1], "abd");
    await user.click(within(dialog).getByRole("button", { name: "Cambiar contraseña" }));
    expect(await within(dialog).findByText("Mínimo 6 caracteres")).toBeInTheDocument();
    expect(await within(dialog).findByText("Las contraseñas no coinciden")).toBeInTheDocument();
    expect(reset.method).toBe("");
  });

  it("cambia la contraseña", async () => {
    const reset = stub("put", "/users/1/reset-password", { success: true });
    const { user, dialog } = await openPw();
    await user.type(pwInputs(dialog)[0], "nueva123");
    await user.type(pwInputs(dialog)[1], "nueva123");
    await user.click(within(dialog).getByRole("button", { name: "Cambiar contraseña" }));
    await waitFor(() => expect(reset.body).toEqual({ newPassword: "nueva123" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Contraseña cambiada correctamente", type: "success" }));
    await waitFor(() => expect(screen.queryByText("Cambiar Contraseña")).toBeNull());
  });

  it("si el API no tiene éxito avisa", async () => {
    stub("put", "/users/1/reset-password", { success: false });
    const { user, dialog } = await openPw();
    await user.type(pwInputs(dialog)[0], "nueva123");
    await user.type(pwInputs(dialog)[1], "nueva123");
    await user.click(within(dialog).getByRole("button", { name: "Cambiar contraseña" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Error al cambiar contraseña", type: "error" }));
  });

  it("cancelar y Escape cierran", async () => {
    const { user, dialog } = await openPw();
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByText("Cambiar Contraseña")).toBeNull());
    await user.click(rowBtn("Cambiar contraseña", 0));
    await screen.findByText("Cambiar Contraseña");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByText("Cambiar Contraseña")).toBeNull());
  });
});

describe("usuarios: eliminar", () => {
  const openDel = async (idx = 0) => {
    const ctx = await open();
    await ctx.user.click(rowBtn("Eliminar", idx));
    const dialog = await dialogOf("Confirmar Eliminación");
    return { ...ctx, dialog };
  };

  it("elimina y refresca", async () => {
    const del = stub("delete", "/users/3", { success: true });
    const { user, dialog, bodies } = await openDel(2);
    const n = bodies.length;
    await user.click(within(dialog).getByRole("button", { name: "Eliminar usuario" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Usuario eliminado", type: "success" }));
    expect(del.path).toBe("/users/3");
    await waitFor(() => expect(bodies.length).toBeGreaterThan(n));
  });

  it("si falla avisa", async () => {
    stub("delete", "/users/1", { success: false });
    const { user, dialog } = await openDel();
    await user.click(within(dialog).getByRole("button", { name: "Eliminar usuario" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Error al eliminar usuario", type: "error" }));
  });

  it("cancelar y Escape cierran sin eliminar", async () => {
    const del = stub("delete", "/users/1");
    const { user, dialog } = await openDel();
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByText("Confirmar Eliminación")).toBeNull());
    await user.click(rowBtn("Eliminar", 0));
    await screen.findByText("Confirmar Eliminación");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByText("Confirmar Eliminación")).toBeNull());
    expect(del.method).toBe("");
  });
});
