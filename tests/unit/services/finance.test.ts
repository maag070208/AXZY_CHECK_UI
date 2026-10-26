import { describe, expect, it, vi } from "vitest";
import { fail, mockTransport, stub } from "../../helpers/api";
import {
  cancelCharge,
  createCharge,
  downloadPaymentReceipt,
  generateMonthlyCharges,
  getCharges,
  getFinanceSummary,
  getPayments,
  registerPayment,
  voidPayment,
} from "@modules/finance/services/finance.service";

describe("servicio de finanzas (WEB)", () => {
  it("lista cargos con paginación y filtros", async () => {
    const seen = stub("get", "/charges", { success: true, data: { data: [], total: 0 } });
    const result = await getCharges({ page: 2, limit: 25, filters: { status: "PENDING" } } as any);
    expect(seen.search).toContain("page=2");
    expect(seen.search).toContain("pageSize=25");
    expect(seen.search).toContain("status=PENDING");
    expect(result.total).toBe(0);
  });

  it("lista pagos con filtros", async () => {
    const seen = stub("get", "/payments", { success: true, data: { data: [], total: 0 } });
    await getPayments({ page: 1, limit: 50, filters: { method: "EFECTIVO" } } as any);
    expect(seen.search).toContain("method=EFECTIVO");
    expect(seen.search).toContain("pageSize=50");
  });

  it("consulta el resumen de saldos por propiedad", async () => {
    stub("get", "/finance/summary", {
      success: true,
      data: { items: [{ id: 1, identifier: "A-101" }], totals: { properties: 1, totalCharges: 1000, totalPaid: 600, balance: 400 } },
    });
    const result = await getFinanceSummary();
    expect(result.totals.balance).toBe(400);
  });

  it("registra un cargo con el cuerpo exacto", async () => {
    const seen = stub("post", "/charges", { success: true, data: { id: 1 } }, 201);
    await createCharge({
      propertyId: 1,
      residentId: 3,
      concept: "Cuota",
      category: "CUOTA",
      amount: 1000,
      dueDate: "2026-11-10",
      period: "2026-11",
    });
    expect(seen.body).toMatchObject({ propertyId: 1, residentId: 3, amount: 1000, period: "2026-11" });
  });

  it("genera cuotas mensuales", async () => {
    const seen = stub("post", "/charges/monthly", { success: true, data: { created: 2, skipped: 0, results: [] } });
    const result = await generateMonthlyCharges({ period: "2026-11", amount: 1000, dueDate: "2026-11-10" });
    expect(seen.body).toMatchObject({ period: "2026-11", amount: 1000 });
    expect(result.created).toBe(2);
  });

  it("registra un pago con saldo a favor opcional", async () => {
    const seen = stub("post", "/payments", { success: true, data: { id: 2 } }, 201);
    await registerPayment({
      propertyId: 1,
      residentId: 3,
      amount: 600,
      method: "EFECTIVO",
      allowOverpayment: true,
    });
    expect(seen.body).toMatchObject({ residentId: 3, amount: 600, allowOverpayment: true });
  });

  it("cancela un cargo y reversa un pago", async () => {
    const canceled = stub("patch", "/charges/5/cancel", { success: true, data: { id: 5 } });
    const voided = stub("post", "/payments/5/void", { success: true, data: { id: 5 } });
    await cancelCharge(5, "Duplicado");
    await voidPayment(5, "Error de captura");
    expect(canceled.body).toEqual({ reason: "Duplicado" });
    expect(voided.body).toEqual({ reason: "Error de captura" });
  });

  it("traduce el error HTTP del API al mensaje de negocio", async () => {
    fail("post", "/payments", ["El pago excede el saldo pendiente"], 400);
    await expect(
      registerPayment({ propertyId: 1, residentId: 3, amount: 600, method: "EFECTIVO" }),
    ).rejects.toThrow("El pago excede el saldo pendiente");
  });

  it("descarga el recibo PDF y dispara la descarga del navegador", async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    mockTransport((config) => {
      expect(config.url).toBe("/payments/9/receipt");
      expect(config.responseType).toBe("blob");
      return { data: new Blob(["%PDF-1.7"], { type: "application/pdf" }), status: 200 };
    });
    const result = await downloadPaymentReceipt(9);
    expect(result.success).toBe(true);
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
  });
});
