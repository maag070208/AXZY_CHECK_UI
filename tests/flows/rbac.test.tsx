import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { stub } from "../helpers/api";
import { renderApp } from "../helpers/render";

/** Matriz RBAC con los 6 roles actuales del API (incluye CLIENT). */
const matrix = {
  roles: [
    { name: "ADMIN", value: "Administrador", permissions: ["users.manage", "client.view", "dashboard.view"] },
    { name: "SHIFT", value: "Supervisor", permissions: ["dashboard.view"] },
    { name: "GUARD", value: "Guardia", permissions: [] },
    { name: "MAINT", value: "Mantenimiento", permissions: ["client.view"] },
    { name: "CLIENT", value: "Administrador de cliente", permissions: ["dashboard.view", "properties.view"] },
    { name: "RESDN", value: "Residente", permissions: [] },
  ],
  permissions: [
    { code: "client.view", description: "Consultar los clientes de la organización" },
    { code: "dashboard.view", description: "Ver el dashboard en vivo" },
    { code: "properties.view", description: "Consultar propiedades del cliente" },
    { code: "users.manage", description: "Administrar usuarios" },
  ],
};

const open = async () => {
  stub("get", "/rbac/matrix", { success: true, data: matrix });
  const ctx = renderApp({ route: "/roles", role: "ADMIN" });
  await screen.findByRole("heading", { level: 1, name: "Roles y permisos" });
  await screen.findByText("Resumen");
  return ctx;
};

const summary = () => screen.getByText("Resumen").parentElement as HTMLElement;

describe("roles y permisos: matriz con CLIENT", () => {
  it("muestra los 6 roles en el orden de la matriz, con CLIENT entre MAINT y RESDN", async () => {
    await open();

    expect(
      await screen.findByText("Compara y edita la matriz RBAC de 6 roles."),
    ).toBeInTheDocument();
    const labels = within(summary())
      .getAllByRole("button")
      .map((button) => (button.textContent ?? "").replace(/\d+$/, ""));
    expect(labels).toEqual(["Admin", "Jefe", "Guardia", "Maint.", "Cliente", "Residente"]);
  });

  it("la columna de CLIENT existe y muestra los permisos del borrador", async () => {
    await open();

    // Chip del resumen + cabecera de la matriz.
    expect(within(summary()).getByText("Cliente")).toBeInTheDocument();
    expect(screen.getAllByText("Cliente").length).toBeGreaterThanOrEqual(2);
    // El rol tiene 2 permisos en la matriz: el contador aparece junto a la etiqueta.
    const clientChip = within(summary()).getByText("Cliente").closest("button") as HTMLElement;
    expect(clientChip.textContent).toContain("2");
  });

  it("al enfocar CLIENT el menú lateral y el filtro usan su etiqueta", async () => {
    const { user } = await open();

    await user.click(within(summary()).getByText("Cliente"));

    expect(await screen.findByText("Quitar foco: Cliente")).toBeInTheDocument();
    expect(screen.getAllByText("Cliente").length).toBeGreaterThanOrEqual(2);
  });

  it("las filas de permisos tienen una casilla por rol (6) y CLIENT conserva su borrador", async () => {
    await open();

    expect(await screen.findByText("Ver el dashboard en vivo")).toBeInTheDocument();
    const dashboardRow = screen
      .getByText("Ver el dashboard en vivo")
      .closest('div[style*="grid-template-columns"]') as HTMLElement;
    expect(within(dashboardRow).getAllByRole("checkbox")).toHaveLength(6);
    expect(within(dashboardRow).getByRole("checkbox", { name: "CLIENT" })).toBeChecked();

    const clientViewRow = screen
      .getByText("Consultar los clientes de la organización")
      .closest('div[style*="grid-template-columns"]') as HTMLElement;
    expect(within(clientViewRow).getByRole("checkbox", { name: "CLIENT" })).not.toBeChecked();
  });
});
