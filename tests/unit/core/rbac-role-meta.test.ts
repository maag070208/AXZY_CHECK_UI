import { describe, expect, it } from "vitest";
import { ROLE_COLORS, ROLE_LABELS, ROLE_ORDER, sortRoles } from "@app/modules/rbac/role-meta";

describe("rbac role-meta", () => {
  it("CLIENT aparece en la matriz con etiqueta y color propios", () => {
    expect(ROLE_LABELS.CLIENT).toBe("Cliente");
    expect(ROLE_ORDER).toContain("CLIENT");
    // Entre los roles de operación y el residente.
    expect(ROLE_ORDER.indexOf("CLIENT")).toBeGreaterThan(ROLE_ORDER.indexOf("MAINT"));
    expect(ROLE_ORDER.indexOf("CLIENT")).toBeLessThan(ROLE_ORDER.indexOf("RESDN"));
    expect(ROLE_COLORS.CLIENT).toBe("warning");
  });

  it("ordena las columnas por la matriz y deja los roles desconocidos al final", () => {
    const sorted = sortRoles([
      { name: "RESDN" },
      { name: "CLIENT" },
      { name: "ADMIN" },
      { name: "ZZZ" },
      { name: "MAINT" },
      { name: "GUARD" },
      { name: "SHIFT" },
    ]);
    expect(sorted.map((role) => role.name)).toEqual([
      "ADMIN",
      "SHIFT",
      "GUARD",
      "MAINT",
      "CLIENT",
      "RESDN",
      "ZZZ",
    ]);
  });

  it("tolera una matriz sin roles", () => {
    expect(sortRoles()).toEqual([]);
  });
});
