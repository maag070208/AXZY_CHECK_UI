import { describe, expect, it } from "vitest";
import {
  BARCELONA_ROLE_ORDER,
  CLIENT_ROLE,
  getRoleFilterOptions,
  getVisibleRoles,
} from "@app/modules/users/utils/role.utils";
import { roles } from "../../helpers/fixtures";

describe("role.utils", () => {
  it("getVisibleRoles quita roles ajenos o sin etiqueta y ordena operativamente", () => {
    const mixed = [
      { id: 4, name: "MAINT", value: "Mant" },
      { id: 5, name: "CLIENT", value: "Cliente" },
      { id: 2, name: "GUARD", value: "Guardia" },
      { id: 6, name: "SHIFT", value: "" },
      { id: 1, name: "ADMIN", value: "Admin" },
    ];
    expect(getVisibleRoles(mixed).map((r) => r.name)).toEqual(["ADMIN", "GUARD", "MAINT"]);
    expect(BARCELONA_ROLE_ORDER).toEqual(["ADMIN", "GUARD", "SHIFT", "MAINT"]);
    expect(CLIENT_ROLE).toBe("CLIENT");
  });

  it("CLIENT solo aparece cuando se pide expresamente (hay cliente elegido)", () => {
    expect(getVisibleRoles(roles).map((r) => r.name)).toEqual(["ADMIN", "GUARD", "SHIFT", "MAINT"]);
    expect(getVisibleRoles(roles, { includeClient: true }).map((r) => r.name)).toEqual([
      "ADMIN",
      "GUARD",
      "SHIFT",
      "MAINT",
      "CLIENT",
    ]);
  });

  it("getRoleFilterOptions muestra el value como name, conserva el id e incluye CLIENT", () => {
    expect(getRoleFilterOptions(roles)).toEqual([
      { id: 1, name: "Administrador", value: "Administrador" },
      { id: 2, name: "Guardia", value: "Guardia" },
      { id: 3, name: "Supervisor", value: "Supervisor" },
      { id: 4, name: "Mantenimiento", value: "Mantenimiento" },
      { id: 5, name: "Cliente", value: "Cliente" },
    ]);
  });
});
