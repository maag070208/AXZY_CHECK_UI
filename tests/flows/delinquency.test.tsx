import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { stub } from "../helpers/api";
import { renderApp } from "../helpers/render";

const rule = {
  id: 1,
  enabled: true,
  minOverdueDays: 30,
  blockVisitors: true,
  active: true,
  updatedById: null,
  updatedAt: "2026-10-26T00:00:00.000Z",
};

describe("control de morosos (WEB)", () => {
  it("guarda la regla y autoriza una excepción temporal", async () => {
    stub("get", "/properties", { success: true, data: [{ id: 1, identifier: "A-101", name: "Casa 101" }] });
    stub("get", "/residents", { success: true, data: [{ id: 3, name: "Ana", lastName: "Pérez", propertyId: 1 }] });
    stub("get", "/finance/summary", { success: true, data: { items: [], totals: { properties: 0, totalCharges: 0, totalPaid: 0, balance: 0 } } });
    stub("get", "/charges", { success: true, data: { data: [], total: 0 } });
    stub("get", "/payments", { success: true, data: { data: [], total: 0 } });
    stub("get", "/access/delinquency-rule", { success: true, data: rule });
    stub("get", "/access/exceptions", { success: true, data: [] });
    stub("get", "/access/events", { success: true, data: { items: [], total: 0 } });
    stub("get", "/collections/configs", { success: true, data: [] });
    const saved = stub("put", "/access/delinquency-rule", { success: true, data: { ...rule, minOverdueDays: 45 } });
    const created = stub("post", "/access/exceptions", { success: true, data: { id: 1 } });

    const { user } = renderApp({ route: "/finance", role: "ADMIN" });
    await user.click(await screen.findByRole("button", { name: "Cobranza" }));
    expect(await screen.findByText("Control de morosos")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Guardar regla" }));
    await waitFor(() => expect(saved.body).toMatchObject({ enabled: true, minOverdueDays: 30, blockVisitors: true, active: true }));

    await user.click(screen.getByPlaceholderText("Busca una propiedad…"));
    const floating = await waitFor(() => {
      const all = document.querySelectorAll<HTMLElement>("[data-it-floating]");
      expect(all.length).toBeGreaterThan(0);
      return all[all.length - 1];
    });
    await user.click(within(floating).getByText(/A-101/));
    await user.type(screen.getByPlaceholderText("Ej. Convenio de pago autorizado"), "Convenio aprobado");
    await user.click(screen.getByRole("button", { name: "Autorizar excepción" }));
    await waitFor(() => expect(created.body).toMatchObject({ propertyId: 1, reason: "Convenio aprobado" }));
  });
});
