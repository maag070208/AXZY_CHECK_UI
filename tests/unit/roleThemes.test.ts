import { describe, expect, it } from "vitest";
import { getRoleTheme } from "../../src/theme/roleThemes";

describe("getRoleTheme", () => {
  it("usa el color de cada rol", () => {
    expect(getRoleTheme("ADMIN").primary).toBe("#065911");
    expect(getRoleTheme("SHIFT").primary).toBe("#064E4B");
    expect(getRoleTheme("GUARD").primary).toBe("#0B2E4F");
    expect(getRoleTheme("RESDN").primary).toBe("#3B1D5A");
    expect(getRoleTheme("MAINT").primary).toBe("#475569");
  });

  it("cae en administración para un rol desconocido", () => {
    expect(getRoleTheme("UNKNOWN").primary).toBe("#065911");
    expect(getRoleTheme(null).primary).toBe("#065911");
  });

  it("conserva la paleta base y ajusta el hover de tabla", () => {
    const guard = getRoleTheme("GUARD");
    expect(guard.danger).toBe("#ef4444");
    expect(guard.table?.rowHover).toBe("#e6f2fb");
  });
});
