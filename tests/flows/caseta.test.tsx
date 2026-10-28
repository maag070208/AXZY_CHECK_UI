import { screen, waitFor, within } from "@testing-library/react";
import dayjs from "dayjs";
import { http, HttpResponse } from "msw";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { setAuth } from "@app/core/store/auth/auth.slice";
import store from "@app/core/store/store";
import HomePage from "@app/modules/home/pages/HomePage";
import { stub } from "../helpers/api";
import { makeToken, renderWithProviders } from "../helpers/render";
import { API, server } from "../helpers/server";

const casa = { id: 7, identifier: "A-12", name: "Casa A-12" };
const visit = (id: number, guestName: string, status: string, extra: Record<string, unknown> = {}) => ({
  id,
  code: `AXZ-${id}`,
  guestName,
  propertyId: casa.id,
  property: casa,
  createdById: 1,
  typeId: 1,
  type: { id: 1, name: "Visita", value: "VISIT" },
  status,
  validFrom: dayjs().subtract(1, "hour").toISOString(),
  validUntil: dayjs().add(3, "hour").toISOString(),
  ...extra,
});

const ARRIVING = visit(1, "Laura Méndez", "PENDING");
const LATER = visit(2, "Pedro Ruiz", "PENDING", { validFrom: dayjs().add(3, "day").toISOString(), validUntil: dayjs().add(3, "day").add(2, "hour").toISOString() });
const INSIDE = visit(3, "Carlos Díaz", "ENTERED", { entryTime: dayjs().subtract(30, "minute").toISOString() });

/** La datatable responde según el estado que pide la caseta. */
const mockInvitations = (byStatus: Record<string, unknown[]>, status = 200) =>
  server.use(
    http.post(`${API}/invitations/datatable`, async ({ request }) => {
      if (status !== 200) return HttpResponse.json({ success: false, messages: ["Servidor caído"] }, { status });
      const body = (await request.json()) as { filters?: { status?: string } };
      const rows = byStatus[body.filters?.status ?? ""] ?? [];
      return HttpResponse.json({ success: true, data: { rows, total: rows.length } });
    }),
  );

const openCaseta = () => {
  stub("get", "/rounds", { success: true, data: [] });
  store.dispatch(setAuth(makeToken({ role: "GUARD", name: "Gabriela" })));
  return renderWithProviders(<Routes><Route path="/" element={<HomePage />} /></Routes>);
};

describe("inicio de caseta (GUARD)", () => {
  it("muestra quién llega hoy, quién está dentro y los indicadores", async () => {
    mockInvitations({ PENDING: [ARRIVING, LATER], ENTERED: [INSIDE], EXITED: [] });
    const { user } = openCaseta();

    const arriving = await screen.findByRole("list", { name: "Visitas por llegar" });
    expect(within(arriving).getByText("Laura Méndez")).toBeInTheDocument();
    // Hoy no incluye los pases de otros días.
    expect(within(arriving).queryByText("Pedro Ruiz")).toBeNull();
    expect(within(screen.getByRole("list", { name: "Visitas dentro" })).getByText("Carlos Díaz")).toBeInTheDocument();
    expect(screen.getByText("Por llegar hoy")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Próximos días" }));
    expect(within(screen.getByRole("list", { name: "Visitas por llegar" })).getByText("Pedro Ruiz")).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("Buscar por nombre, casa o código"), "zzz");
    expect(await screen.findByText("Sin coincidencias")).toBeInTheDocument();
  });

  it("registra la entrada de una visita y refresca la lista", async () => {
    mockInvitations({ PENDING: [ARRIVING], ENTERED: [], EXITED: [] });
    const put = stub("put", "/invitations/1/status", { success: true, data: { ...ARRIVING, status: "ENTERED" } });
    const { user } = openCaseta();

    await user.click(await screen.findByRole("button", { name: "Registrar entrada de Laura Méndez" }));
    await user.click(await screen.findByRole("button", { name: "Confirmar entrada" }));
    await waitFor(() => expect(put.body).toEqual({ status: "ENTERED" }));
  });

  it("valida un pase por código y permite registrar la salida", async () => {
    mockInvitations({ PENDING: [], ENTERED: [INSIDE], EXITED: [] });
    stub("get", "/invitations/AXZ-3", { success: true, data: INSIDE });
    const put = stub("put", "/invitations/3/status", { success: true, data: { ...INSIDE, status: "EXITED" } });
    const { user } = openCaseta();

    await user.type(await screen.findByLabelText("Código del pase"), "axz-3{Enter}");
    expect(await screen.findByText("Dentro")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Registrar salida" }));
    await user.click(await screen.findByRole("button", { name: "Confirmar salida" }));
    await waitFor(() => expect(put.body).toEqual({ status: "EXITED" }));
  });

  it("avisa cuando el código no existe", async () => {
    mockInvitations({ PENDING: [], ENTERED: [], EXITED: [] });
    stub("get", "/invitations/NOPE", { success: false, data: null, messages: ["Invitación no encontrada"] }, 404);
    const { user } = openCaseta();

    await user.type(await screen.findByLabelText("Código del pase"), "nope{Enter}");
    expect(await screen.findByText(/No encontramos un pase/)).toBeInTheDocument();
    expect(screen.getByText("Nadie por llegar")).toBeInTheDocument();
    expect(screen.getByText("No hay visitas dentro")).toBeInTheDocument();
  });

  it("muestra el error y permite reintentar", async () => {
    mockInvitations({}, 500);
    const { user } = openCaseta();

    expect(await screen.findByText("No se pudieron cargar las visitas")).toBeInTheDocument();
    mockInvitations({ PENDING: [ARRIVING], ENTERED: [], EXITED: [] });
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByText("Laura Méndez")).toBeInTheDocument();
  });
});
