import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { stub } from "../helpers/api";
import { renderApp } from "../helpers/render";

const announcement = {
  id: 1,
  title: "Corte de agua",
  body: "El martes de 9 a 13 h.",
  audience: "ALL",
  propertyId: null,
  property: null,
  roleName: null,
  sentAt: "2026-10-26T17:00:00.000Z",
  recipients: 10,
  readCount: 4,
};

describe("avisos (WEB)", () => {
  it("lista los comunicados y permite enviar uno nuevo", async () => {
    stub("get", "/properties", { success: true, data: [{ id: 1, identifier: "A-101", name: "Casa 101" }] });
    stub("get", "/announcements", { success: true, data: { items: [announcement], total: 1 } });
    const posted = stub("post", "/announcements", { success: true, data: { ...announcement, id: 2 } });

    const { user } = renderApp({ route: "/announcements", role: "ADMIN" });

    expect(await screen.findByText("Corte de agua")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Nuevo aviso" }));

    await user.type(await screen.findByPlaceholderText("Ej. Corte de agua programado"), "Aviso de prueba");
    await user.type(await screen.findByPlaceholderText("Escribe el comunicado…"), "Mensaje para residentes.");
    await user.click(screen.getByRole("button", { name: "Enviar aviso" }));

    await waitFor(() => expect(posted.body).toMatchObject({ title: "Aviso de prueba", body: "Mensaje para residentes.", audience: "ALL" }));
  });
});
