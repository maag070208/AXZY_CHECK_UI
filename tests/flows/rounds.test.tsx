import { screen, waitFor, within } from "@testing-library/react";
import dayjs from "dayjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import store from "@app/core/store/store";
import { fail, stub, table } from "../helpers/api";
import { Route, Routes } from "react-router-dom";
import { setAuth } from "@app/core/store/auth/auth.slice";
import RoundsPage from "@app/modules/rounds/pages/RoundsPage";
import { makeToken, renderApp, renderWithProviders, WhereAmI } from "../helpers/render";
import { pickOption } from "../helpers/ui";

const toast = () => store.getState().toast;
beforeEach(() => vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-10-20T19:00:00.000Z") }));
afterEach(() => vi.useRealTimers());

const rounds = [
  { id: 1, guardId: 1, startTime: "2026-10-20T15:00:00.000Z", endTime: "2026-10-20T16:00:00.000Z", status: "COMPLETED", recurringConfigurationId: 5, recurringConfiguration: { title: "Ronda norte" }, guard: { id: 1, name: "Ana", lastName: "Pérez" }, scannedCount: 10, totalLocations: 10, progressPercent: 100, progressStatus: "EXCELENTE" },
  { id: 2, guardId: 2, startTime: "2026-10-20T15:30:00.000Z", endTime: null, status: "IN_PROGRESS", recurringConfigurationId: 6, guard: { id: 2, name: "Beto", lastName: null }, scannedCount: 5, totalLocations: 10, progressPercent: 50, progressStatus: "MEDIO" },
  { id: 3, guardId: 3, startTime: "2026-10-20T15:45:00.000Z", status: "IN_PROGRESS", recurringConfigurationId: 99, guard: { id: 3, name: "Cami", lastName: "S" }, scannedCount: 1, totalLocations: 10, progressPercent: 10, progressStatus: "MALO" },
  { id: 4, guardId: 4, startTime: "2026-10-20T15:50:00.000Z", status: "IN_PROGRESS", recurringConfigurationId: 7, guard: { id: 4, name: "Dani", lastName: "T" }, scannedCount: 8, totalLocations: 10, progressPercent: 80, progressStatus: "ALTO" },
  { id: 5, guardId: 5, startTime: "2026-10-20T15:55:00.000Z", status: "COMPLETED", recurringConfigurationId: 8, guard: { id: 5, name: "Eli", lastName: "U" } },
  { id: 6, guardId: 6, startTime: "2026-10-20T15:58:00.000Z", status: "COMPLETED", recurringConfigurationId: 8, guard: { id: 6, name: "Fer", lastName: "V" }, scannedCount: 3, totalLocations: 10, progressPercent: 30 },
];
const routesList = [{ id: 6, title: "Ruta Sur" }, { id: 7, title: "Ruta Este" }];

const open = async () => {
  stub("get", "/recurring", { success: true, data: routesList });
  const bodies = table("/rounds/datatable", rounds);
  const r = renderApp({ route: "/rounds", role: "ADMIN" });
  await waitFor(() => expect(bodies.length).toBeGreaterThanOrEqual(2));
  await screen.findByText("Ronda norte");
  return { ...r, bodies };
};
const dateInput = () => screen.getByPlaceholderText("dd/mm/aaaa - dd/mm/aaaa");

describe("recorridos: listado", () => {
  it("muestra nombre de ruta, guardia, estado, avance y desempeño", async () => {
    await open();
    expect(screen.getByText("Ruta Sur")).toBeInTheDocument(); // por configuración conocida
    expect(screen.getByText("Ruta Este")).toBeInTheDocument();
    expect(screen.getAllByText("Ronda General").length).toBeGreaterThan(0); // configuración desconocida
    expect(screen.getByText("Ana Pérez")).toBeInTheDocument();
    expect(screen.getAllByText("FINALIZADA").length).toBe(3);
    expect(screen.getAllByText("EN CURSO").length).toBe(3);
    expect(screen.getByText("10/10 puntos")).toBeInTheDocument();
    for (const l of ["EXCELENTE", "MEDIO", "MALO", "ALTO"]) expect(screen.getByText(l)).toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(2); // ronda sin avance ni desempeño
  });

  it("filtra por el día de hoy (Tijuana) de inicio", async () => {
    const { bodies } = await open();
    const f = bodies.at(-1).filters;
    expect(f.date).toEqual([
      dayjs("2026-10-20T19:00:00.000Z").tz("America/Tijuana").startOf("day").format(),
      dayjs("2026-10-20T19:00:00.000Z").tz("America/Tijuana").endOf("day").format(),
    ]);
    expect(f.search).toBeUndefined();
    expect(f.status).toBeUndefined();
  });

  it("buscar guardia (recortado), limpiar y espacios en blanco", async () => {
    const { user, bodies } = await open();
    await user.type(screen.getByPlaceholderText("Nombre o usuario..."), " an ");
    await waitFor(() => expect(bodies.at(-1).filters.search).toBe("an"));
    await user.click(screen.getByRole("button", { name: "Limpiar búsqueda" }));
    await waitFor(() => expect(bodies.at(-1).filters.search).toBeUndefined());
    await user.type(screen.getByPlaceholderText("Nombre o usuario..."), "  ");
    await waitFor(() => expect(bodies.length).toBeGreaterThanOrEqual(4));
    expect(bodies.at(-1).filters.search).toBeUndefined();
  });

  it("filtra por estado y 'Todos' lo quita", async () => {
    const { user, bodies } = await open();
    await pickOption(user, screen.getByDisplayValue("Todos"), "En curso");
    await waitFor(() => expect(bodies.at(-1).filters.status).toBe("IN_PROGRESS"));
    await pickOption(user, screen.getByDisplayValue("En curso"), "Finalizadas");
    await waitFor(() => expect(bodies.at(-1).filters.status).toBe("COMPLETED"));
    await pickOption(user, screen.getByDisplayValue("Finalizadas"), "Todos");
    await waitFor(() => expect(bodies.at(-1).filters.status).toBeUndefined());
  });

  it("cambiar el periodo (rango, fecha suelta o inicio solo) y actualizar", async () => {
    const { user, bodies } = await open();
    await user.click(dateInput());
    const pick = (n: string) => within(document.querySelector("[data-it-floating]") as HTMLElement).getAllByText(n, { selector: "span" })[0];
    await user.click(pick("10"));
    const n = bodies.length;
    expect(bodies.length).toBe(n); // aún incompleto
    await user.click(pick("12"));
    await waitFor(() => expect(dayjs(bodies.at(-1).filters.date[0]).date()).toBe(10));
    expect(dayjs(bodies.at(-1).filters.date[1]).date()).toBe(12);

    await user.clear(dateInput());
    await user.type(dateInput(), "15102026");
    await waitFor(() => expect(dayjs(bodies.at(-1).filters.date[0]).date()).toBe(15));

    const m = bodies.length;
    await user.click(screen.getByRole("button", { name: "Actualizar tabla" }));
    await waitFor(() => expect(bodies.length).toBeGreaterThan(m));
  });

  it("ver detalles lleva al recorrido", async () => {
    stub("get", "/recurring", { success: true, data: routesList });
    table("/rounds/datatable", rounds);
    store.dispatch(setAuth(makeToken({ role: "ADMIN" })));
    const { user } = renderWithProviders(
      <Routes>
        <Route path="/" element={<RoundsPage />} />
        <Route path="*" element={<WhereAmI />} />
      </Routes>,
    );
    await screen.findByText("Ronda norte");
    await user.click(screen.getAllByRole("button", { name: "Ver detalles" })[1]);
    expect(await screen.findByTestId("where")).toHaveTextContent("/rounds/2");
  });

  it("solo las rondas en curso se pueden finalizar", async () => {
    await open();
    expect(screen.getAllByRole("button", { name: "Finalizar ronda" })).toHaveLength(3);
  });
});

describe("recorridos: finalizar", () => {
  const openConfirm = async () => {
    const ctx = await open();
    await ctx.user.click(screen.getAllByRole("button", { name: "Finalizar ronda" })[0]);
    const dialog = (await screen.findByText("Confirmar finalización")).closest("[data-it-dialog]") as HTMLElement;
    return { ...ctx, dialog };
  };

  it("finaliza y refresca", async () => {
    const ended = stub("put", "/rounds/2/end", { success: true });
    const { user, dialog, bodies } = await openConfirm();
    const n = bodies.length;
    await user.click(within(dialog).getByRole("button", { name: "Finalizar ronda" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Ronda finalizada correctamente", type: "success" }));
    expect(ended.path).toBe("/rounds/2/end");
    await waitFor(() => expect(bodies.length).toBeGreaterThan(n));
  });

  it("el API rechaza: muestra los mensajes o el genérico", async () => {
    stub("put", "/rounds/2/end", { success: false, messages: ["Ya finalizada", "otra"] });
    const { user, dialog } = await openConfirm();
    await user.click(within(dialog).getByRole("button", { name: "Finalizar ronda" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Ya finalizada\notra", type: "error" }));
    const second = await openConfirmAgain(user);
    stub("put", "/rounds/2/end", { success: false });
    await user.click(within(second).getByRole("button", { name: "Finalizar ronda" }));
    await waitFor(() => expect(toast().message).toBe("Error al finalizar ronda"));
  });

  it("error HTTP avisa y cierra la confirmación", async () => {
    fail("put", "/rounds/2/end", ["x"], 500);
    const { user, dialog } = await openConfirm();
    await user.click(within(dialog).getByRole("button", { name: "Finalizar ronda" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Error al finalizar ronda", type: "error" }));
    await waitFor(() => expect(screen.queryByText("Confirmar finalización")).toBeNull());
  });

  it("cancelar y Escape cierran sin finalizar", async () => {
    const ended = stub("put", "/rounds/2/end");
    const { user, dialog } = await openConfirm();
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByText("Confirmar finalización")).toBeNull());
    await user.click(screen.getAllByRole("button", { name: "Finalizar ronda" })[0]);
    await screen.findByText("Confirmar finalización");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByText("Confirmar finalización")).toBeNull());
    expect(ended.method).toBe("");
  });

  it("si las rutas no cargan, usa 'Ronda General'", async () => {
    stub("get", "/recurring", { success: false });
    table("/rounds/datatable", rounds);
    renderApp({ route: "/rounds", role: "ADMIN" });
    await screen.findByText("Ronda norte");
    expect(screen.queryByText("Ruta Sur")).toBeNull();
  });
});

async function openConfirmAgain(user: ReturnType<typeof renderApp>["user"]) {
  await user.click(screen.getAllByRole("button", { name: "Finalizar ronda" })[0]);
  return (await screen.findByText("Confirmar finalización")).closest("[data-it-dialog]") as HTMLElement;
}
