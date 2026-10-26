import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { stub } from "../helpers/api";
import { renderApp } from "../helpers/render";

const event = {
  id: 1,
  propertyId: 1,
  property: { id: 1, identifier: "A-101", name: "Casa 101" },
  method: "PIN",
  direction: "ENTRY",
  decision: "ALLOWED",
  reason: "PIN_VALID",
  occurredAt: "2026-10-26T17:00:00.000Z",
  person: { id: 1, firstName: "Ana", lastName: "Pérez" },
  vehicle: null,
  invitation: null,
  guard: { id: 2, name: "Luis", lastName: "Guardia" },
};

describe("bitácora de accesos (WEB)", () => {
  it("lista los eventos con filtros y decisión", async () => {
    stub("get", "/properties", { success: true, data: [{ id: 1, identifier: "A-101", name: "Casa 101" }] });
    stub("get", "/access/events", { success: true, data: { items: [event], total: 1 } });

    renderApp({ route: "/access-log", role: "ADMIN" });

    expect(await screen.findByText("Ana Pérez")).toBeInTheDocument();
    expect(screen.getByText("PIN")).toBeInTheDocument();
    expect(screen.getByText("Permitido")).toBeInTheDocument();
    expect(screen.getByText("PIN válido")).toBeInTheDocument();
  });
});
