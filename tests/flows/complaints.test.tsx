import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { fail, stub } from "../helpers/api";
import { renderApp } from "../helpers/render";

const complaint = {
  id: 7,
  propertyId: 1,
  category: "RUIDO",
  title: "Ruido nocturno",
  status: "NEW",
  authorId: 3,
  author: { id: 3, name: "Ana", lastName: "Pérez" },
  createdAt: "2026-10-20T15:30:00.000Z",
  updatedAt: "2026-10-20T15:30:00.000Z",
};

const detail = {
  ...complaint,
  description: "Música fuerte después de medianoche",
  media: [{ type: "IMAGE", url: "http://x/a.jpg", key: "a.jpg", size: 1000 }],
  resolvedAt: null,
  messages: [
    { id: 1, body: "Lo revisamos", internal: false, authorId: 1, createdAt: "2026-10-20T16:00:00.000Z" },
    { id: 2, body: "Vecino reincidente", internal: true, authorId: 1, createdAt: "2026-10-20T16:05:00.000Z" },
  ],
  events: [{ fromStatus: null, toStatus: "NEW", createdAt: "2026-10-20T15:30:00.000Z" }],
};

describe("buzón de quejas (WEB)", () => {
  it("lista las quejas recibidas con su estado", async () => {
    const seen = stub("get", "/complaints", { success: true, data: { items: [complaint], total: 1 } });
    renderApp({ route: "/complaints", role: "ADMIN" });
    expect(await screen.findByText("Ruido nocturno")).toBeInTheDocument();
    expect(screen.getAllByText("Nueva").length).toBeGreaterThan(0);
    expect(seen.path).toBe("/complaints");
    expect(seen.search).toContain("page=1");
  });

  it("filtra por estado y vuelve a pedir la lista con status", async () => {
    const seen = stub("get", "/complaints", { success: true, data: { items: [], total: 0 } });
    const { user } = renderApp({ route: "/complaints", role: "ADMIN" });
    await screen.findByText("Todas");
    await user.click(screen.getByText("Nueva"));
    await waitFor(() => expect(seen.search).toContain("status=NEW"));
  });

  it("muestra error cuando la API no responde", async () => {
    fail("get", "/complaints", ["Sin conexión con el servidor"], 500);
    renderApp({ route: "/complaints", role: "ADMIN" });
    expect((await screen.findAllByText("No se pudieron cargar las quejas")).length).toBeGreaterThan(0);
  });

  it("abre el detalle, muestra la nota interna y envía una respuesta", async () => {
    stub("get", "/complaints", { success: true, data: { items: [complaint], total: 1 } });
    stub("get", "/complaints/7", { success: true, data: detail });
    const sent = stub("post", "/complaints/7/messages", { success: true, data: { id: 3 } }, 201);
    const { user } = renderApp({ route: "/complaints", role: "ADMIN" });

    fireEvent.click(await screen.findByText("Ruido nocturno"));
    expect(await screen.findByText("Música fuerte después de medianoche")).toBeInTheDocument();
    expect(screen.getAllByText("Nota interna").length).toBeGreaterThan(0);

    await user.type(screen.getByPlaceholderText("Escribe un mensaje"), "Gracias por avisar");
    await user.click(screen.getByRole("button", { name: "Enviar" }));
    await waitFor(() => expect(sent.body).toEqual({ body: "Gracias por avisar", internal: false }));
  });

  it("muestra una queja reabierta y permite devolverla a revisión", async () => {
    const reopened = { ...complaint, status: "REOPENED" };
    stub("get", "/complaints", { success: true, data: { items: [reopened], total: 1 } });
    stub("get", "/complaints/7", { success: true, data: { ...detail, status: "REOPENED" } });
    const changed = stub("patch", "/complaints/7/status", { success: true, data: { id: 7, status: "IN_REVIEW" } });
    const { user } = renderApp({ route: "/complaints", role: "ADMIN" });

    fireEvent.click(await screen.findByText("Ruido nocturno"));
    expect((await screen.findAllByText("Reabierta")).length).toBeGreaterThan(0);
    await user.click(await screen.findByRole("button", { name: "Marcar: En revisión" }));
    await waitFor(() => expect(changed.body).toEqual({ status: "IN_REVIEW" }));
  });

  it("cambia el estado con las transiciones válidas desde el detalle", async () => {
    stub("get", "/complaints", { success: true, data: { items: [complaint], total: 1 } });
    stub("get", "/complaints/7", { success: true, data: detail });
    const changed = stub("patch", "/complaints/7/status", { success: true, data: { id: 7, status: "IN_REVIEW" } });
    const { user } = renderApp({ route: "/complaints", role: "ADMIN" });

    fireEvent.click(await screen.findByText("Ruido nocturno"));
    await user.click(await screen.findByRole("button", { name: "Marcar: En revisión" }));
    await waitFor(() => expect(changed.body).toEqual({ status: "IN_REVIEW" }));
  });
});
