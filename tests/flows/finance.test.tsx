import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { fail, stub } from "../helpers/api";
import { renderApp } from "../helpers/render";
import { pickOption } from "../helpers/ui";

const summary = {
  items: [
    { id: 1, identifier: "A-101", name: "Casa 101", totalCharges: 1000, applied: 600, credit: 0, totalPaid: 600, balance: 400, residents: 1, pendingCharges: 1 },
  ],
  totals: { properties: 1, totalCharges: 1000, totalPaid: 600, balance: 400 },
};

const charge = {
  id: 10,
  propertyId: 1,
  residentId: 3,
  concept: "Cuota mensual 2026-11",
  category: "CUOTA",
  amount: 1000,
  dueDate: "2026-11-10T00:00:00.000Z",
  status: "PARTIAL",
  period: "2026-11",
  paidAmount: 600,
  outstanding: 400,
  property: { id: 1, identifier: "A-101", name: "Casa 101" },
  resident: { id: 3, name: "Ana", lastName: "Pérez" },
  createdAt: "2026-10-20T15:30:00.000Z",
};

const payment = {
  id: 20,
  propertyId: 1,
  residentId: 3,
  folio: 1,
  amount: 600,
  method: "EFECTIVO",
  reference: "REC-001",
  paidAt: "2026-11-05T12:00:00.000Z",
  unallocatedAmount: 0,
  allocatedAmount: 600,
  appliedAmount: 600,
  voidedAt: null,
  property: { id: 1, identifier: "A-101", name: "Casa 101" },
  resident: { id: 3, name: "Ana", lastName: "Pérez" },
  allocations: [],
};

const stubCatalogs = () => {
  stub("get", "/properties", { success: true, data: [{ id: 1, identifier: "A-101", name: "Casa 101" }] });
  stub("get", "/residents", { success: true, data: [{ id: 3, name: "Ana", lastName: "Pérez", propertyId: 1 }] });
  stub("get", "/finance/summary", { success: true, data: summary });
};

describe("finanzas (WEB)", () => {
  it("muestra el resumen y la tabla de cargos", async () => {
    stubCatalogs();
    stub("get", "/charges", { success: true, data: { data: [charge], total: 1 } });
    stub("get", "/payments", { success: true, data: { data: [payment], total: 1 } });

    renderApp({ route: "/finance", role: "ADMIN" });

    expect(await screen.findByText("Cuota mensual 2026-11")).toBeInTheDocument();
    expect(screen.getAllByText("A-101").length).toBeGreaterThan(0);
    expect(screen.getByText("Saldo total")).toBeInTheDocument();
  });

  it("incluye Multa / Infracción en los tipos de cargo", async () => {
    stubCatalogs();
    stub("get", "/charges", { success: true, data: { data: [charge], total: 1 } });
    stub("get", "/payments", { success: true, data: { data: [], total: 0 } });

    const { user } = renderApp({ route: "/finance", role: "ADMIN" });
    await user.click(await screen.findByRole("button", { name: "Nuevo cargo" }));
    const category = await screen.findByDisplayValue("Cuota mensual");
    await pickOption(user, category, "Multa / Infracción");
    expect(screen.getByDisplayValue("Multa / Infracción")).toBeInTheDocument();
  });

  it("registra el pago desde el cargo seleccionado", async () => {
    stubCatalogs();
    stub("get", "/charges", { success: true, data: { data: [charge], total: 1 } });
    stub("get", "/payments", { success: true, data: { data: [payment], total: 1 } });
    const created = stub("post", "/payments", { success: true, data: payment }, 201);

    const { user } = renderApp({ route: "/finance", role: "ADMIN" });
    await screen.findByText("Cuota mensual 2026-11");
    await user.click(screen.getByRole("button", { name: "Pagar cargo" }));
    expect(await screen.findByText(/El pago se aplicará al cargo seleccionado/)).toBeInTheDocument();

    const submit = screen.getAllByRole("button", { name: "Registrar pago" });
    await user.click(submit[submit.length - 1]);
    await waitFor(() =>
      expect(created.body).toMatchObject({
        propertyId: 1,
        residentId: 3,
        amount: 400,
        chargeIds: [10],
      }),
    );
  });

  it("cambia a pagos y muestra folio y recibo", async () => {
    stubCatalogs();
    stub("get", "/charges", { success: true, data: { data: [charge], total: 1 } });
    stub("get", "/payments", { success: true, data: { data: [payment], total: 1 } });

    const { user } = renderApp({ route: "/finance", role: "ADMIN" });
    await screen.findByText("Cuota mensual 2026-11");
    await user.click(screen.getByText("Pagos"));

    expect(await screen.findByText("000001")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Recibo" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reversar" })).toBeInTheDocument();
  });

  it("muestra saldos por propiedad", async () => {
    stubCatalogs();
    stub("get", "/charges", { success: true, data: { data: [], total: 0 } });
    stub("get", "/payments", { success: true, data: { data: [], total: 0 } });

    const { user } = renderApp({ route: "/finance", role: "ADMIN" });
    await user.click(await screen.findByText("Saldos"));

    await waitFor(() => expect(screen.getAllByText("Casa 101").length).toBeGreaterThan(0));
    expect(screen.getByText("Pendientes")).toBeInTheDocument();
  });

  it("gestiona la tabla de cobranza y genera cargos", async () => {
    stubCatalogs();
    stub("get", "/charges", { success: true, data: { data: [], total: 0 } });
    stub("get", "/payments", { success: true, data: { data: [], total: 0 } });
    stub("get", "/collections/configs", {
      success: true,
      data: [
        {
          id: 1,
          propertyId: 1,
          concept: "Cuota de mantenimiento",
          amount: 1000,
          frequency: "MONTHLY",
          dueDay: 10,
          nextChargeDate: "2026-11-10",
          graceDays: 5,
          lateFeeType: "PERCENT",
          lateFeeValue: 10,
          active: true,
          property: { id: 1, identifier: "A-101", name: "Casa 101" },
        },
      ],
    });
    const generated = stub("post", "/collections/generate", {
      success: true,
      data: { created: 1, skipped: 0, results: [] },
    });

    const { user } = renderApp({ route: "/finance", role: "ADMIN" });
    await user.click(await screen.findByRole("button", { name: "Cobranza" }));
    expect(await screen.findByText("Cuota de mantenimiento")).toBeInTheDocument();
    expect(screen.getByText("Mensual")).toBeInTheDocument();
    expect(screen.getByText("Porcentaje 10%")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Generar cargos" }));
    await waitFor(() => expect(generated.path).toBe("/collections/generate"));

    await user.click(screen.getByRole("button", { name: "Nueva configuración" }));
    expect(await screen.findByText("Nueva cobranza")).toBeInTheDocument();
  });

  it("muestra el error de carga de cargos", async () => {
    stubCatalogs();
    fail("get", "/charges", ["Sin conexión con el servidor"], 500);
    stub("get", "/payments", { success: true, data: { data: [], total: 0 } });

    renderApp({ route: "/finance", role: "ADMIN" });
    expect((await screen.findAllByText("No se pudieron cargar los datos")).length).toBeGreaterThan(0);
  });
});
