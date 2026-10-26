import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { stub } from "../helpers/api";
import { renderApp } from "../helpers/render";

const vehicle = {
  id: 1,
  propertyId: 1,
  property: { id: 1, identifier: "A-101", name: "Casa 101" },
  ownerId: 3,
  owner: { id: 3, name: "Ana", lastName: "Pérez" },
  plate: "ABC-123",
  tagCode: "TAG-A1B2C3",
  kind: "AUTO",
  brand: "Toyota",
  model: "Corolla",
  color: "Blanco",
  status: "PENDING",
  notes: null,
  createdAt: "2026-10-26T17:00:00.000Z",
};

describe("vehículos (WEB)", () => {
  it("lista pendientes y permite aprobar con tag", async () => {
    stub("get", "/vehicles", { success: true, data: { items: [vehicle], total: 1 } });
    const approved = stub("patch", "/vehicles/1/approve", { success: true, data: { ...vehicle, status: "APPROVED" } });

    const { user } = renderApp({ route: "/vehicles", role: "ADMIN" });

    expect(await screen.findByText("ABC-123")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Aprobar ABC-123" }));
    await user.type(await screen.findByPlaceholderText("Ej. TAG-A1B2C3"), "TAG-NUEVO");
    await user.click(screen.getByRole("button", { name: "Aprobar" }));

    await waitFor(() => expect(approved.body).toMatchObject({ tagCode: "TAG-NUEVO" }));
  });
});
