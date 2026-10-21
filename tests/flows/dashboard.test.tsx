import { act, screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import store from "@app/core/store/store";
import { setAuth } from "@app/core/store/auth/auth.slice";
import { LiveOpsDashboard } from "@app/modules/dashboard/pages/LiveOpsDashboard";
import { ablyProbe, emitAbly } from "../helpers/ably";
import { stub } from "../helpers/api";
import { liveDashboard } from "../helpers/fixtures";
import { mapProbe } from "../helpers/maps";
import { makeToken, renderWithProviders, WhereAmI } from "../helpers/render";
import { API, server } from "../helpers/server";

const ago = (min: number) => new Date(Date.now() - min * 60000).toISOString();

const guard = (id: number, name: string, lastName: string | null = "X") => ({ id, name, lastName });
const round = (over: Record<string, unknown> = {}) => ({
  roundId: 11, guard: guard(1, "Ana", "Pérez"), routeId: 1, routeTitle: "Ruta Norte", startTime: ago(65),
  elapsedMinutes: 65, totalLocations: 10, scannedCount: 4, progressPercent: 40,
  lastScan: { locationName: "Puerta", timestamp: ago(5), latitude: 1, longitude: 2 }, stale: false, ...over,
});

const full = () =>
  liveDashboard({
    kpis: { activeRoundsCount: 3, guardsOnShiftCount: 4, openIncidentsCount: 2, routesTotal: 5, routesCovered: 3 },
    activeRounds: [
      round(),
      round({ roundId: 12, guard: guard(2, "Beto", null), routeTitle: null, elapsedMinutes: 0, totalLocations: null, scannedCount: 2, progressPercent: null, lastScan: null, stale: true }),
    ],
    mapPoints: [
      { guardId: 1, guardName: "Ana", roundId: 11, routeTitle: "Ruta Norte", lat: 32.46, lng: -116.92, timestamp: ago(5) },
      { guardId: 2, guardName: "Beto", roundId: 12, routeTitle: null, lat: 32.5, lng: -116.9, timestamp: ago(5) },
    ],
    guardsOnShift: [
      { guardId: 1, name: "Ana", lastName: "P", role: "GUARD", status: "ON_ROUND", lastActivityAt: ago(1), uniformCheckPending: true },
      { guardId: 2, name: "Beto", lastName: null, role: "GUARD", status: "ON_ROUND", lastActivityAt: null, uniformCheckPending: false },
      { guardId: 3, name: "Cami", lastName: "S", role: "GUARD", status: "IDLE", lastActivityAt: null, uniformCheckPending: false },
      { guardId: 4, name: "Dani", lastName: "T", role: "SHIFT", status: "IDLE", lastActivityAt: null, uniformCheckPending: false },
    ],
    alerts: [
      { type: "ROUND_STALLED", severity: "high", message: "Ronda estancada de Beto", at: ago(0) },
      { type: "INCIDENT_OPEN", severity: "medium", message: "Incidencia abierta sin atender", at: ago(125) },
      { type: "SHIFT_HANDOVER_OVERDUE", severity: "medium", message: "Entrega de turno vencida", at: null },
    ],
    uncoveredRoutes: [{ id: 1, title: "Ruta Sur" }, { id: 2, title: "Ruta Este" }],
    insights: {
      today: { roundsStarted: 5, roundsCompleted: 3, incidentsCreated: 1, yesterdayRoundsStarted: 4, yesterdayRoundsCompleted: 3, yesterdayIncidentsCreated: 2 },
      avgRoundMinutes: 90,
      avgResolutionMinutes: 45,
      roundsByDay: [], incidentsByDay: [], incidentsByCategory: [], incidentsByHour: [],
      timeline: [
        { type: "ROUND_STARTED", message: "Ana inició ronda", at: "2026-10-20T15:00:00.000Z" },
        { type: "ROUND_COMPLETED", message: "Luis terminó ronda", at: "2026-10-20T16:00:00.000Z" },
        { type: "INCIDENT_CREATED", message: "Nueva incidencia", at: "2026-10-20T17:00:00.000Z" },
        { type: "INCIDENT_ATTENDED", message: "Incidencia atendida", at: "2026-10-20T18:00:00.000Z" },
      ],
    },
  });

const serve = (data: unknown) => stub("get", "/dashboard/live", { success: true, data });

const mount = (name = "ana lópez") => {
  store.dispatch(setAuth(makeToken({ name, role: "ADMIN" })));
  return renderWithProviders(
    <Routes>
      <Route path="/" element={<LiveOpsDashboard />} />
      <Route path="*" element={<WhereAmI />} />
    </Routes>,
  );
};
const card = (title: string) => screen.getByText(title).closest("div[class*=cursor-pointer], [role=button], div")!.parentElement!.parentElement as HTMLElement;

beforeEach(() => stub("get", "/chat/messages", { success: true, data: [] }));
afterEach(() => vi.useRealTimers());

describe("dashboard en vivo: cabecera y KPIs", () => {
  it("muestra saludo con el nombre capitalizado, fecha y KPIs", async () => {
    vi.useFakeTimers({ toFake: ["Date"], now: new Date(2026, 9, 20, 9, 5, 0) });
    serve(full());
    mount("ANA lópez");
    expect(await screen.findByText("Buenos días, Ana")).toBeInTheDocument();
    expect(screen.getByText(/Martes, 20 de octubre/)).toBeInTheDocument();
    expect(await screen.findByText("2 en ronda · 2 inactivos")).toBeInTheDocument();
    expect(screen.getByText("3/5")).toBeInTheDocument();
    expect(screen.getByText("2 sin cubrir")).toBeInTheDocument();
    expect(screen.getByText("1 estancada")).toBeInTheDocument();
    expect(screen.getByText("Rondas estancadas")).toBeInTheDocument();
    expect(screen.getByText("Uniformes pendientes")).toBeInTheDocument();
    expect(screen.getByText(/Actualizado /)).toBeInTheDocument();
  });

  it.each([
    [15, "Buenas tardes"],
    [21, "Buenas noches"],
  ])("a las %i h saluda '%s'", async (h, saludo) => {
    vi.useFakeTimers({ toFake: ["Date"], now: new Date(2026, 9, 20, h, 0, 0) });
    serve(full());
    mount();
    expect(await screen.findByText(new RegExp(saludo))).toBeInTheDocument();
  });

  it("sin nombre usa 'equipo' y sin rondas estancadas dice 'En curso ahora' / 'Todas cubiertas'", async () => {
    serve(liveDashboard({ kpis: { activeRoundsCount: 1, guardsOnShiftCount: 0, openIncidentsCount: 0, routesTotal: 0, routesCovered: 0 } }));
    mount("");
    expect(await screen.findByText(/, Equipo$/)).toBeInTheDocument();
    expect(screen.getByText("En curso ahora")).toBeInTheDocument();
    expect(screen.getByText("Todas cubiertas")).toBeInTheDocument();
    expect(screen.getByText("0 en ronda · 0 inactivos")).toBeInTheDocument();
  });

  it("varias rondas estancadas usan plural", async () => {
    serve(liveDashboard({ activeRounds: [round({ stale: true }), round({ roundId: 12, stale: true })] }));
    mount();
    expect(await screen.findByText("2 estancadas")).toBeInTheDocument();
  });

  it("mientras carga muestra esqueletos y 'Conectando…'", async () => {
    let release!: () => void;
    server.use(
      http.get(`${API}/dashboard/live`, async () => {
        await new Promise<void>((r) => (release = r));
        return HttpResponse.json({ success: true, data: full() });
      }),
    );
    mount();
    expect(await screen.findByText("Conectando…")).toBeInTheDocument();
    expect(screen.queryByText("Rondas activas")).toBeNull();
    release();
    expect(await screen.findByText("Rondas activas")).toBeInTheDocument();
  });

  it("sin datos y con error muestra el error del tablero y reintenta", async () => {
    stub("get", "/dashboard/live", { success: false, messages: ["API caída"] });
    const { user } = mount();
    expect(await screen.findByText("API caída")).toBeInTheDocument();
    serve(full());
    await user.click(screen.getByRole("button", { name: /reintentar/i }));
    expect(await screen.findByText("Rondas activas")).toBeInTheDocument();
  });

  it("error sin mensaje usa el texto por defecto", async () => {
    stub("get", "/dashboard/live", { success: false });
    mount();
    expect(await screen.findByText("No se pudo cargar el dashboard")).toBeInTheDocument();
  });

  it("si ya había datos y falla una actualización muestra alerta con Reintentar", async () => {
    serve(full());
    const { user } = mount();
    await screen.findByText("Rondas activas");
    stub("get", "/dashboard/live", { success: false, messages: ["Se cayó"] });
    await user.click(screen.getByRole("button", { name: "Actualizar datos" }));
    expect(await screen.findByText("No se pudo actualizar el tablero")).toBeInTheDocument();
    expect(screen.getByText("Se cayó")).toBeInTheDocument();
    serve(full());
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    await waitFor(() => expect(screen.queryByText("No se pudo actualizar el tablero")).toBeNull());
  });
});

describe("dashboard en vivo: navegación", () => {
  it.each([
    ["Rondas activas", "/rounds"],
    ["Guardias en turno", "/guards"],
    ["Incidencias abiertas", "/incidents"],
    ["Cobertura de rutas", "/routes"],
    ["Rondas estancadas", "/rounds"],
    ["Uniformes pendientes", "/uniform"],
  ])("la tarjeta '%s' lleva a %s", async (title, path) => {
    serve(full());
    const { user } = mount();
    await screen.findByText("3/5");
    const cards = screen.getAllByText(title).filter((el) => el.closest("[class*='cursor-pointer'], [role='button']"));
    await user.click((cards[0] ?? screen.getAllByText(title)[0]) as HTMLElement);
    expect(await screen.findByTestId("where")).toHaveTextContent(path);
  });

  it("botones de acción rápida y seguimiento", async () => {
    serve(full());
    const { user, unmount } = mount();
    await screen.findByText("3/5");
    await user.click(screen.getByRole("button", { name: /nuevo reporte/i }));
    expect(await screen.findByTestId("where")).toHaveTextContent("/incidents");
    unmount();

    serve(full());
    const second = mount();
    await screen.findByText("3/5");
    await second.user.click(screen.getByRole("button", { name: /ver rondas/i }));
    expect(await screen.findByTestId("where")).toHaveTextContent("/rounds");
    second.unmount();

    serve(full());
    const third = mount();
    await screen.findByText("3/5");
    await third.user.click(screen.getByRole("button", { name: /abrir seguimiento/i }));
    expect(await screen.findByTestId("where")).toHaveTextContent("/guard-tracking");
  });
});

describe("dashboard en vivo: resumen de hoy", () => {
  it("compara contra ayer y formatea duraciones", async () => {
    serve(full());
    mount();
    expect(await screen.findByText("+1 vs ayer")).toBeInTheDocument();
    expect(screen.getByText("= que ayer")).toBeInTheDocument();
    expect(screen.getByText("60%")).toBeInTheDocument();
    expect(screen.getByText("1 h 30 min")).toBeInTheDocument();
    expect(screen.getByText("45 min")).toBeInTheDocument();
  });

  it("tendencia a la baja, sin rondas y duraciones nulas o exactas", async () => {
    const data = full();
    data.insights.today = { ...data.insights.today, roundsStarted: 0, roundsCompleted: 0, yesterdayRoundsStarted: 2, yesterdayRoundsCompleted: 0 };
    data.insights.avgRoundMinutes = null;
    data.insights.avgResolutionMinutes = 120;
    serve(data);
    mount();
    expect(await screen.findByText("-2 vs ayer")).toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("2 h")).toBeInTheDocument();
  });

  it("sin 'insights' muestra el esqueleto del resumen", async () => {
    const data: any = full();
    delete data.insights;
    serve(data);
    mount();
    await screen.findByText("3/5");
    expect(screen.getByText("Hoy en números")).toBeInTheDocument();
    expect(screen.queryByText("Pulso del día")).toBeNull();
  });
});

describe("dashboard en vivo: panel lateral", () => {
  const openTab = async (name: string) => {
    serve(full());
    const ctx = mount();
    await screen.findByText("3/5");
    await ctx.user.click(screen.getByRole("button", { name }));
    return ctx;
  };

  it("alertas por severidad, hora relativa y rutas sin cubrir", async () => {
    serve(full());
    mount();
    expect(await screen.findByText("Ronda estancada de Beto")).toBeInTheDocument();
    expect(screen.getByText("hace unos segundos")).toBeInTheDocument();
    expect(screen.getByText("hace 2 h 5 min")).toBeInTheDocument();
    expect(screen.getByText("Entrega de turno vencida")).toBeInTheDocument();
    expect(screen.getByText(/Ruta Sur, Ruta Este/)).toBeInTheDocument();
    expect(screen.getByText("3 alertas · 2 rondas")).toBeInTheDocument();
  });

  it("sin alertas ni rutas sin cubrir", async () => {
    serve(liveDashboard());
    mount();
    expect(await screen.findByText("Todo en orden — sin alertas activas.")).toBeInTheDocument();
  });

  it("alertas sin rutas sin cubrir no muestran la nota", async () => {
    serve(liveDashboard({ alerts: [{ type: "INCIDENT_OPEN", severity: "high", message: "Algo", at: null }] }));
    mount();
    expect(await screen.findByText("Algo")).toBeInTheDocument();
    expect(screen.queryByText(/Sin nadie recorriéndolas/)).toBeNull();
  });

  it("rondas activas: avance, estancada, sin ruta y duración", async () => {
    await openTab("Rondas");
    expect(screen.getByText("ANA PÉREZ", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("Ruta Norte", { selector: "p" })).toBeInTheDocument();
    expect(screen.getByText("40%")).toBeInTheDocument();
    expect(screen.getByText("4/10 puntos")).toBeInTheDocument();
    expect(screen.getByText("1 h 5 min")).toBeInTheDocument();
    expect(screen.getByText(/Puerta · hace 5 min/)).toBeInTheDocument();
    expect(screen.getByText("Sin ruta asignada")).toBeInTheDocument();
    expect(screen.getByText("2 escaneos")).toBeInTheDocument();
    expect(screen.getByText("menos de 1 min")).toBeInTheDocument();
    expect(screen.getByText("Sin escaneos aún")).toBeInTheDocument();
    expect(screen.getAllByText("Estancada").length).toBeGreaterThanOrEqual(2); // chip de la leyenda + insignia de la ronda
  });

  it("clic en una ronda lleva al seguimiento del guardia", async () => {
    const { user } = await openTab("Rondas");
    await user.click(screen.getByText("Sin ruta asignada"));
    expect(await screen.findByTestId("where")).toHaveTextContent("/guard-tracking?guardId=2");
  });

  it("sin rondas activas", async () => {
    serve(liveDashboard());
    const { user } = mount();
    await screen.findByText("Todo en orden — sin alertas activas.");
    await user.click(screen.getByRole("button", { name: "Rondas" }));
    expect(await screen.findByText("Nadie tiene una ronda activa en este momento.")).toBeInTheDocument();
  });

  it("actividad reciente con los 4 tipos de evento", async () => {
    await openTab("Actividad");
    for (const t of ["Ana inició ronda", "Luis terminó ronda", "Nueva incidencia", "Incidencia atendida"]) {
      expect(screen.getByText(t)).toBeInTheDocument();
    }
  });

  it("sin actividad reciente", async () => {
    serve(liveDashboard());
    const { user } = mount();
    await screen.findByText("Todo en orden — sin alertas activas.");
    await user.click(screen.getByRole("button", { name: "Actividad" }));
    expect(await screen.findByText("Sin actividad reciente.")).toBeInTheDocument();
  });

  it("pestaña de chat monta el panel compacto", async () => {
    await openTab("Chat");
    expect(await screen.findByPlaceholderText("Escribe un mensaje...")).toBeInTheDocument();
  });

  it("duraciones largas: días, meses y años", async () => {
    const day = 24 * 60;
    serve(
      liveDashboard({
        activeRounds: [
          round({ roundId: 1, elapsedMinutes: 2 * day + 180 }),
          round({ roundId: 2, elapsedMinutes: 31 * day }),
          round({ roundId: 3, elapsedMinutes: 400 * day }),
          round({ roundId: 4, elapsedMinutes: 60 * day + day }),
          round({ roundId: 5, elapsedMinutes: day }),
          round({ roundId: 6, elapsedMinutes: 800 * day }),
          round({ roundId: 7, elapsedMinutes: 20, stale: true }),
        ],
        alerts: [{ type: "INCIDENT_OPEN", severity: "high", message: "vieja", at: ago(400 * day) }],
      }),
    );
    const { user } = mount();
    await screen.findByText("vieja");
    expect(screen.getByText("hace 1 año 1 mes")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Rondas" }));
    expect(await screen.findByText("2 días 3 h")).toBeInTheDocument();
    expect(screen.getByText("1 mes 1 día")).toBeInTheDocument();
    expect(screen.getByText("1 año 1 mes")).toBeInTheDocument();
    expect(screen.getByText("2 meses 1 día")).toBeInTheDocument();
    expect(screen.getByText("1 día")).toBeInTheDocument();
    expect(screen.getByText("2 años 2 meses")).toBeInTheDocument();
    expect(screen.getByText("20 min")).toBeInTheDocument();
  });
});

describe("dashboard en vivo: mapa de guardias", () => {
  it("dibuja un pin por guardia, ajusta límites y abre la ventana de información", async () => {
    serve(full());
    const { user } = mount();
    await screen.findByText("2 en ruta");
    expect(mapProbe.markers).toHaveLength(2);
    expect(mapProbe.fitBounds).toHaveBeenCalled();
    expect(mapProbe.map).toMatchObject({ defaultZoom: 14 });
    act(() => mapProbe.markers[1].onClick());
    expect(await screen.findByText("Beto — Sin ruta")).toBeInTheDocument();
    act(() => mapProbe.info!.onCloseClick());
    await waitFor(() => expect(screen.queryByText("Beto — Sin ruta")).toBeNull());
    act(() => mapProbe.markers[0].onClick());
    expect(await screen.findByText("Ana — Ruta Norte")).toBeInTheDocument();
    void user;
  });

  it("un solo guardia centra el mapa en su pin con zoom cercano y sin ajustar límites", async () => {
    serve(liveDashboard({ mapPoints: [{ guardId: 1, guardName: "Ana", roundId: 1, routeTitle: "R", lat: 10, lng: 20, timestamp: ago(1) }] }));
    mount();
    await screen.findByText("1 en ruta");
    expect(mapProbe.map).toMatchObject({ defaultCenter: { lat: 10, lng: 20 }, defaultZoom: 16 });
    expect(mapProbe.fitBounds).not.toHaveBeenCalled();
  });

  it("sin mapa listo no ajusta límites", async () => {
    mapProbe.hasMap = false;
    serve(full());
    mount();
    await screen.findByText("2 en ruta");
    expect(mapProbe.fitBounds).not.toHaveBeenCalled();
  });

  it("un pin ya agrupado no se vuelve a agrupar con uno posterior", async () => {
    const p = (id: number, lat: number, lng: number) => ({ guardId: id, guardName: `G${id}`, roundId: id, routeTitle: "R", lat, lng, timestamp: ago(1) });
    serve(liveDashboard({ mapPoints: [p(1, 32.46, -116.92), p(2, 33, -117), p(3, 32.46, -116.92)] }));
    mount();
    await screen.findByText("3 en ruta");
    expect(mapProbe.markers).toHaveLength(3);
  });

  it("sin clave de Google Maps avisa en lugar de dibujar el mapa", async () => {
    vi.stubEnv("VITE_GOOGLE_MAPS_API_KEY", "");
    serve(full());
    mount();
    expect(await screen.findByText("Google Maps API Key no configurada")).toBeInTheDocument();
    vi.unstubAllEnvs();
  });

  it("sin guardias activos avisa", async () => {
    serve(liveDashboard());
    mount();
    expect(await screen.findByText("Sin ubicaciones recientes de guardias activos")).toBeInTheDocument();
  });

  it("separa pines que caen en el mismo punto y conserva los lejanos", async () => {
    const p = (id: number, lat: number, lng: number) => ({ guardId: id, guardName: `G${id}`, roundId: id, routeTitle: "R", lat, lng, timestamp: ago(1) });
    serve(liveDashboard({ mapPoints: [p(1, 32.46, -116.92), p(2, 32.46, -116.92), p(3, 32.46, -116.92), p(4, 33, -117)] }));
    mount();
    await screen.findByText("4 en ruta");
    const pos = mapProbe.markers.map((m) => m.position);
    expect(new Set(pos.map((q) => `${q.lat.toFixed(6)},${q.lng.toFixed(6)}`)).size).toBe(4);
    expect(pos[3]).toEqual({ lat: 33, lng: -117 });
  });
});

describe("dashboard en vivo: actualización", () => {
  it("el evento 'refresh' de Ably vuelve a pedir (con debounce) y descarta ráfagas", async () => {
    let calls = 0;
    server.use(http.get(`${API}/dashboard/live`, () => ((calls += 1), HttpResponse.json({ success: true, data: full() }))));
    mount();
    await waitFor(() => expect(calls).toBe(1));
    act(() => {
      emitAbly("dashboard:live-ops", "refresh");
      emitAbly("dashboard:live-ops", "refresh");
    });
    await waitFor(() => expect(calls).toBe(2), { timeout: 4000 });
    await new Promise((r) => setTimeout(r, 300));
    expect(calls).toBe(2);
  });

  it("al desmontar con un refresh pendiente cancela el temporizador", async () => {
    let calls = 0;
    server.use(http.get(`${API}/dashboard/live`, () => ((calls += 1), HttpResponse.json({ success: true, data: full() }))));
    const { unmount } = mount();
    await waitFor(() => expect(calls).toBe(1));
    act(() => emitAbly("dashboard:live-ops", "refresh"));
    unmount();
    await new Promise((r) => setTimeout(r, 1800));
    expect(calls).toBe(1);
  });

  it("el polling de 30 s recarga y se detiene al desmontar", async () => {
    const real = globalThis.setInterval;
    const ticks: (() => void)[] = [];
    const cleared: unknown[] = [];
    vi.spyOn(globalThis, "setInterval").mockImplementation(((fn: () => void, ms?: number, ...a: unknown[]) => {
      if (ms === 30000) {
        ticks.push(fn);
        return 777 as never;
      }
      return real(fn, ms, ...a);
    }) as never);
    vi.spyOn(globalThis, "clearInterval").mockImplementation(((id: unknown) => void cleared.push(id)) as never);
    let calls = 0;
    server.use(http.get(`${API}/dashboard/live`, () => ((calls += 1), HttpResponse.json({ success: true, data: full() }))));
    const { unmount } = mount();
    await waitFor(() => expect(calls).toBe(1));
    await act(async () => ticks[0]());
    await waitFor(() => expect(calls).toBe(2));
    unmount();
    expect(cleared).toContain(777);
  });

  it("autenticación de Ably contra la API: éxito, sin token y error", async () => {
    serve(full());
    mount();
    await screen.findByText("3/5");
    stub("get", "/realtime/token", { success: true, data: { token: "t" } });
    const ok = vi.fn();
    await ablyProbe.options!.authCallback!({}, ok);
    expect(ok).toHaveBeenCalledWith(null, { token: "t" });
    stub("get", "/realtime/token", { success: false });
    const no = vi.fn();
    await ablyProbe.options!.authCallback!({}, no);
    expect(no).toHaveBeenCalledWith("No se pudo obtener el token de tiempo real", null);
    stub("get", "/realtime/token", {}, 500);
    const bad = vi.fn();
    await ablyProbe.options!.authCallback!({}, bad);
    expect(bad).toHaveBeenCalledWith({}, null);
  });

  it("si Ably no inicia, avisa en consola y sigue con polling", async () => {
    ablyProbe.throwOnConnect = true;
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    serve(full());
    mount();
    await screen.findByText("3/5");
    expect(warn).toHaveBeenCalled();
  });

  it.each(["promise", "undefined", "rejected"] as const)("al desmontar cierra Ably (%s)", async (mode) => {
    ablyProbe.closeReturns = mode;
    serve(full());
    const { unmount } = mount();
    await screen.findByText("3/5");
    unmount();
    expect(ablyProbe.closed).toBe(1);
  });

  it("botón 'Actualizar datos' vuelve a pedir", async () => {
    let calls = 0;
    server.use(http.get(`${API}/dashboard/live`, () => ((calls += 1), HttpResponse.json({ success: true, data: full() }))));
    const { user } = mount();
    await screen.findByText("3/5");
    await user.click(screen.getByRole("button", { name: "Actualizar datos" }));
    await waitFor(() => expect(calls).toBe(2));
  });
});

void within;
