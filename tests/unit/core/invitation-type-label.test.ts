import { describe, expect, it } from "vitest";
import { invitationTypeLabel } from "@modules/invitations/invitation-type-label";

describe("invitationTypeLabel", () => {
  it("traduce los nombres técnicos del catálogo", () => {
    expect(invitationTypeLabel({ name: "VISITOR" })).toBe("Visita");
    expect(invitationTypeLabel({ name: "PROVIDER" })).toBe("Proveedor");
    expect(invitationTypeLabel({ name: "SERVICE" })).toBe("Servicio");
    expect(invitationTypeLabel({ name: "DELIVERY" })).toBe("Entrega");
  });

  it("usa value como respaldo y no rompe con tipos vacíos", () => {
    expect(invitationTypeLabel({ value: "VISITOR" })).toBe("Visita");
    expect(invitationTypeLabel(null)).toBe("Visita");
    expect(invitationTypeLabel({ name: "OTRO", value: "Otro" })).toBe("Otro");
  });
});
