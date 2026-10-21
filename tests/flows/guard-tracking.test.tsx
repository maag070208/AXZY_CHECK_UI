import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { stub, table } from "../helpers/api";
import { liveDashboard } from "../helpers/fixtures";
import { mapProbe } from "../helpers/maps";
import { renderApp } from "../helpers/render";
import { pickOption } from "../helpers/ui";

const users = [
  { id: 1, name: "Ana", lastName: "Pérez", username: "ana", role: { name: "GUARD" } },
  { id: 2, name: "Beto", lastName: null, role: { name: "SHIFT" } },
  { id: 3, name: "Cami", lastName: "S", role: { name: "MAINT" } },
  { id: 4, name: "Admin", lastName: "X", role: { name: "ADMIN" } },
];
const rounds = [
  { id: 10, startTime: "2026-10-18T15:00:00.000Z", status: "COMPLETED", recurringConfiguration: { title: "Ronda norte" } },
  { id: 11, startTime: "2026-10-19T15:00:00.000Z", status: "IN_PROGRESS" },
];
const tl = [
  { type: "START", timestamp: "2026-10-19T15:00:00.000Z", description: "Inicio", data: {} },
  { type: "SCAN", timestamp: "2026-10-19T15:05:00.000Z", description: "Escaneo Puerta", data: { latitude: 32.4, longitude: -116.9, location: { name: "Puerta" }, media: [{ type: "IMAGE", url: "http://x/a.png" }, { type: "VIDEO", url: "http://x/b.mp4" }] } },
  { type: "SCAN", timestamp: "2026-10-19T15:10:00.000Z", description: "Escaneo sin lugar", data: { latitude: 32.5, longitude: -116.8, media: [{ type: "VIDEO", url: "http://x/b.mp4" }] } },
  { type: "END", timestamp: "2026-10-19T15:20:00.000Z", description: "Fin", data: {} },
];
const live = (ids: number[]) =>
  liveDashboard({ activeRounds: ids.map((id) => ({ roundId: id, guard: { id, name: "Ana", lastName: id === 2 ? null : "Pérez" }, routeId: 1, routeTitle: "R", startTime: "", elapsedMinutes: 1, totalLocations: 1, scannedCount: 0, progressPercent: 0, lastScan: null, stale: false })) });

const serve = (o: { usersRes?: unknown; liveIds?: number[]; roundRows?: unknown[]; detail?: unknown } = {}) => {
  stub("get", "/users", o.usersRes ?? { success: true, data: users });
  stub("get", "/dashboard/live", { success: true, data: live(o.liveIds ?? []) });
  stub("get", "/reports/guards/detail", { success: true, data: [{ guardId: 1, totalRounds: 4, totalScans: 30, missedScans: 10, incompleteRounds: 1 }] });
  stub("get", "/reports/guards/detail-breakdown/1", { success: true, data: { missedPoints: [], incompleteRounds: [{ roundId: 10, startTime: "2026-10-18T15:00:00.000Z", endTime: "", missedCount: 3, totalLocations: 5 }] } });
  const bodies = table("/rounds/datatable", o.roundRows ?? rounds);
  stub("get", "/rounds/11", { success: true, data: o.detail ?? { round: rounds[1], timeline: tl } });
  stub("get", "/rounds/10", { success: true, data: { round: rounds[0], timeline: [] } });
  return bodies;
};
const open = async (route = "/guard-tracking", o: Parameters<typeof serve>[0] = {}) => {
  const bodies = serve(o);
  const r = renderApp({ route, role: "ADMIN" });
  await screen.findAllByText("Seguimiento de Guardia");
  return { ...r, bodies };
};
const guardInput = () => screen.getByPlaceholderText("Selecciona un guardia...");

describe("seguimiento de guardias", () => {
  it("sin guardia elegido invita a seleccionar y solo lista personal operativo", async () => {
    const { user } = await open();
    expect(await screen.findByText("Selecciona un guardia para ver su seguimiento.")).toBeInTheDocument();
    await user.click(guardInput());
    expect(await screen.findByText("Beto")).toBeInTheDocument();
    expect(screen.queryByText("Admin X")).toBeNull();
  });

  it("al elegir guardia muestra resumen, alerta de incompletas, rondas y selecciona la activa", async () => {
    const { user } = await open();
    await pickOption(user, guardInput(), "Ana Pérez");
    expect(await screen.findByText("30")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
    expect(screen.getByText("1 ronda(s) incompleta(s) en este periodo")).toBeInTheDocument();
    expect(screen.getByText("Ana Pérez · Guardia")).toBeInTheDocument();
    expect(await screen.findByText("Escaneo Puerta")).toBeInTheDocument();
    expect(screen.getByText("Sin ruta")).toBeInTheDocument();
    expect(screen.getByText("Ronda norte")).toBeInTheDocument();
    expect(screen.getByText("Ronda seleccionada")).toBeInTheDocument();
    expect(mapProbe.markers).toHaveLength(2);
    expect(screen.getAllByText("+5 min").length).toBeGreaterThan(0);
  });

  it("evidencia del escaneo y cambio de ronda", async () => {
    const { user } = await open();
    await pickOption(user, guardInput(), "Ana Pérez");
    await user.click((await screen.findAllByRole("button", { name: /ver evidencia \(2\)/i }))[0]);
    expect(await screen.findByText("Evidencia del escaneo")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByText("Evidencia del escaneo")).toBeNull());
    await user.click(screen.getByText("Ronda norte"));
    expect(await screen.findByText("Sin eventos para esta ronda.")).toBeInTheDocument();
  });

  it("con solo rondas terminadas elige la más reciente (primera)", async () => {
    const { user } = await open("/guard-tracking", { roundRows: [rounds[0]] });
    await pickOption(user, guardInput(), "Ana Pérez");
    expect(await screen.findByText("Sin eventos para esta ronda.")).toBeInTheDocument();
  });

  it("sin rondas en el periodo", async () => {
    const { user } = await open("/guard-tracking", { roundRows: [] });
    await pickOption(user, guardInput(), "Ana Pérez");
    expect(await screen.findByText("Sin rondas en este rango de fechas.")).toBeInTheDocument();
    expect(screen.getByText("Este guardia no tiene rondas en el periodo seleccionado.")).toBeInTheDocument();
  });

  it("guardia sin resumen ni cumplimiento calculable", async () => {
    const { user } = await open();
    stub("get", "/reports/guards/detail", { success: true, data: [{ guardId: 1, totalRounds: 0, totalScans: 0, missedScans: 0 }] });
    stub("get", "/reports/guards/detail-breakdown/1", { success: false });
    await pickOption(user, guardInput(), "Ana Pérez");
    expect(await screen.findByText("---")).toBeInTheDocument();
  });

  it("guardias en ronda ahora: chips que seleccionan y etiqueta", async () => {
    const { user } = await open("/guard-tracking", { liveIds: [1, 2] });
    expect(await screen.findByText("Ana")).toBeInTheDocument();
    await user.click(screen.getByText("Ana Pérez", { selector: "*" }));
    expect((await screen.findAllByText("En ronda ahora")).length).toBeGreaterThan(1);
  });

  it("abre con ?guardId= ya seleccionado", async () => {
    await open("/guard-tracking?guardId=1");
    expect(await screen.findByText("Escaneo Puerta")).toBeInTheDocument();
  });

  it("actualizar recarga resumen y rondas; cambiar periodo también", async () => {
    const { user, bodies } = await open("/guard-tracking?guardId=1");
    await screen.findByText("Escaneo Puerta");
    const n = bodies.length;
    await user.click(screen.getByRole("button", { name: "Actualizar seguimiento" }));
    await waitFor(() => expect(bodies.length).toBeGreaterThan(n));
    await user.click(screen.getByPlaceholderText("dd/mm/aaaa - dd/mm/aaaa"));
    const pick = (d: string) => within(document.querySelector("[data-it-floating]") as HTMLElement).getAllByText(d, { selector: "span" })[0];
    await user.click(pick("10"));
    await user.click(pick("12"));
    await waitFor(() => expect(bodies.length).toBeGreaterThan(n + 1));
  });

  it("sin guardias disponibles", async () => {
    await open("/guard-tracking", { usersRes: { success: true, data: [users[3]] } });
    expect(await screen.findByText("Sin guardias disponibles")).toBeInTheDocument();
  });

  it("error al cargar: con mensaje, sin mensaje y por falla HTTP; reintenta", async () => {
    stub("get", "/users", { success: false, messages: ["Sin acceso"] });
    stub("get", "/dashboard/live", { success: true, data: live([]) });
    const a = renderApp({ route: "/guard-tracking", role: "ADMIN" });
    expect(await screen.findByText("Sin acceso")).toBeInTheDocument();
    stub("get", "/users", { success: false });
    await a.user.click(screen.getByRole("button", { name: /reintentar/i }));
    expect(await screen.findByText("No se pudieron cargar los guardias.")).toBeInTheDocument();
    a.unmount();
    stub("get", "/users", { message: "boom" }, 500);
    renderApp({ route: "/guard-tracking", role: "ADMIN" });
    expect(await screen.findByText("boom")).toBeInTheDocument();
  });

  it("falla HTTP sin mensaje usa el texto por defecto", async () => {
    stub("get", "/users", {}, 500);
    stub("get", "/dashboard/live", { success: true, data: live([]) });
    renderApp({ route: "/guard-tracking", role: "ADMIN" });
    expect(await screen.findByText("No se pudieron cargar los guardias.")).toBeInTheDocument();
  });

  it("detalle de ronda sin éxito deja la línea de tiempo vacía", async () => {
    const { user } = await open("/guard-tracking", { roundRows: [rounds[1]] });
    stub("get", "/rounds/11", { success: false });
    await pickOption(user, guardInput(), "Ana Pérez");
    expect(await screen.findByText("Sin eventos para esta ronda.")).toBeInTheDocument();
  });
});
