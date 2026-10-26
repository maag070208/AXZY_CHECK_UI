import { describe, expect, it } from "vitest";
import { stub } from "../../helpers/api";
import {
  applyLateFees,
  generateCollectionCharges,
  getCollectionConfigs,
  saveCollectionConfig,
  updateCollectionConfig,
} from "@modules/finance/services/collection.service";

const config = {
  id: 1,
  propertyId: 10,
  concept: "Cuota de mantenimiento",
  amount: 1000,
  frequency: "MONTHLY" as const,
  dueDay: 10,
  nextChargeDate: "2026-11-10",
  graceDays: 5,
  lateFeeType: "NONE" as const,
  lateFeeValue: 0,
  active: true,
  property: { id: 10, identifier: "A-101", name: "Casa 101" },
};

describe("servicio de cobranza (WEB)", () => {
  it("lista configuraciones", async () => {
    const seen = stub("get", "/collections/configs", { success: true, data: [config] });
    const rows = await getCollectionConfigs();
    expect(seen.path).toBe("/collections/configs");
    expect(rows).toEqual([config]);
  });

  it("crea y actualiza una configuración", async () => {
    const created = stub("post", "/collections/configs", { success: true, data: config }, 201);
    await saveCollectionConfig({ ...config, propertyId: 10 });
    expect(created.body).toMatchObject({ propertyId: 10, amount: 1000, frequency: "MONTHLY", dueDay: 10 });

    const updated = stub("put", "/collections/configs/1", { success: true, data: { ...config, active: false } });
    await updateCollectionConfig(1, { active: false });
    expect(updated.body).toEqual({ active: false });
  });

  it("genera cargos y aplica recargos", async () => {
    const generated = stub("post", "/collections/generate", {
      success: true,
      data: { created: 2, skipped: 0, results: [] },
    });
    const result = await generateCollectionCharges({ propertyId: 10, throughDate: "2026-11-30" });
    expect(generated.body).toMatchObject({ propertyId: 10, throughDate: "2026-11-30" });
    expect(result.created).toBe(2);

    const late = stub("post", "/collections/apply-late-fees", {
      success: true,
      data: { created: 1, skipped: 0, results: [] },
    });
    const lateResult = await applyLateFees();
    expect(late.body).toEqual({});
    expect(lateResult.created).toBe(1);
  });
});
