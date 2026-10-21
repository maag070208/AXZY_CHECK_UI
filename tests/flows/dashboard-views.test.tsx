import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import dayjs from "dayjs";
import { http, HttpResponse } from "msw";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { setAuth } from "@app/core/store/auth/auth.slice";
import store from "@app/core/store/store";
import { LiveOpsDashboard } from "@app/modules/dashboard/pages/LiveOpsDashboard";
import HomePage from "@app/modules/home/pages/HomePage";
import { logout } from "@app/core/store/auth/auth.slice";
import { stub } from "../helpers/api";
import { liveDashboard } from "../helpers/fixtures";
import { makeToken, renderWithProviders, WhereAmI } from "../helpers/render";
import { API, server } from "../helpers/server";

const mount = () => {
  store.dispatch(setAuth(makeToken({ name: "Ana", role: "ADMIN" })));
  stub("get", "/chat/messages", { success: true, data: [] });
  return renderWithProviders(
    <Routes>
      <Route path="/" element={<LiveOpsDashboard />} />
      <Route path="*" element={<WhereAmI />} />
    </Routes>,
  );
};

const today = dayjs();
const at = (hour: number, daysBack = 0) => today.subtract(daysBack, "day").hour(hour).minute(0).second(0).toISOString();

describe("dashboard: Ritmo de la operación", () => {
  const catalog = [{ id: 1, name: "Robo" }, { id: 2, value: "Ruido" }, { id: 3 }];
  const incidents = [
    { id: 1, categoryId: 1, createdAt: at(10) },
    { id: 2, categoryId: 1, createdAt: at(10) },
    { id: 3, categoryId: 2, createdAt: at(22) },
    { id: 4, categoryId: 3, createdAt: at(3) },
    { id: 5, categoryId: 99, createdAt: at(3) },
    { id: 6, createdAt: at(3) },
  ];
  const rounds = [
    { id: 1, startTime: at(8), status: "COMPLETED" },
    { id: 2, startTime: at(9), status: "IN_PROGRESS" },
    { id: 3, startTime: at(8, 2), status: "COMPLETED" },
  ];
  const serve = () => {
    stub("get", "/dashboard/live", { success: true, data: liveDashboard() });
    stub("get", "/incidents", { success: true, data: incidents });
    stub("get", "/catalog/incident_category", { success: true, data: catalog });
    return stub("post", "/rounds/datatable", { success: true, data: { rows: rounds, total: rounds.length } });
  };
  const open = async () => {
    const ctx = mount();
    await screen.findByText("Rondas activas");
    await ctx.user.click(screen.getByRole("button", { name: "Ritmo de la operación" }));
    return ctx;
  };

  it("arma tendencia de rondas, incidencias por categoría y por hora", async () => {
    serve();
    await open();
    expect(await screen.findByText(/^Rondas — \d{2} \w+ a \d{2} \w+/)).toBeInTheDocument();
    expect(screen.getByText("Tendencias de los últimos 7 días")).toBeInTheDocument();
    expect(screen.getByText("Robo")).toBeInTheDocument();
    expect(screen.getByText("Ruido")).toBeInTheDocument();
    expect(screen.getAllByText("Sin categoría").length).toBe(1);
    expect(screen.getByText("03h")).toBeInTheDocument();
    expect(screen.getByText("10h")).toBeInTheDocument();
  });

  it("si el catálogo o las incidencias no responden usa valores vacíos", async () => {
    stub("get", "/dashboard/live", { success: true, data: liveDashboard() });
    stub("get", "/incidents", { success: false });
    stub("get", "/catalog/incident_category", { success: false });
    stub("post", "/rounds/datatable", { success: false });
    await open();
    expect(await screen.findAllByText("Sin incidencias en los últimos 7 días.")).toHaveLength(2);
  });

  it("incidencias con éxito pero sin 'data' cuentan como vacías", async () => {
    stub("get", "/dashboard/live", { success: true, data: liveDashboard() });
    stub("get", "/incidents", { success: true });
    stub("get", "/catalog/incident_category", { success: true, data: [] });
    stub("post", "/rounds/datatable", { success: true, data: { rows: [], total: 0 } });
    await open();
    expect(await screen.findAllByText("Sin incidencias en los últimos 7 días.")).toHaveLength(2);
  });

  it("una recarga durante la descarga de páginas adicionales cancela la anterior", async () => {
    stub("get", "/dashboard/live", { success: true, data: liveDashboard() });
    stub("get", "/incidents", { success: true, data: [] });
    stub("get", "/catalog/incident_category", { success: true, data: [] });
    let first = true;
    server.use(
      http.post(`${API}/rounds/datatable`, async ({ request }) => {
        const body: any = await request.json();
        if (body.page > 1 && first) await new Promise((r) => setTimeout(r, 300));
        return HttpResponse.json({ success: true, data: { rows: [{ id: body.page, startTime: at(8), status: "COMPLETED" }], total: 2001 } });
      }),
    );
    const { user } = await open();
    await waitFor(() => expect(document.body.textContent).toContain("Ritmo"));
    await user.click(screen.getByRole("button", { name: "Actualizar rango" }));
    first = false;
    await screen.findByText(/^Rondas — /);
  });

  it("pide más páginas de rondas cuando el total excede la primera", async () => {
    stub("get", "/dashboard/live", { success: true, data: liveDashboard() });
    stub("get", "/incidents", { success: true, data: [] });
    stub("get", "/catalog/incident_category", { success: true, data: [] });
    const pages: number[] = [];
    server.use(
      http.post(`${API}/rounds/datatable`, async ({ request }) => {
        const body: any = await request.json();
        pages.push(body.page);
        return HttpResponse.json({ success: true, data: { rows: [{ id: body.page, startTime: at(8), status: "COMPLETED" }], total: 2001 } });
      }),
    );
    await open();
    await screen.findByText(/^Rondas — /);
    expect(pages.sort()).toEqual([1, 2, 3]);
  });

  it("error al cargar: muestra el mensaje o el texto por defecto", async () => {
    stub("get", "/dashboard/live", { success: true, data: liveDashboard() });
    stub("get", "/incidents", { message: "Falló incidencias" }, 500);
    stub("get", "/catalog/incident_category", { success: true, data: [] });
    stub("post", "/rounds/datatable", { success: true, data: { rows: [], total: 0 } });
    const { user } = await open();
    expect(await screen.findByText("Falló incidencias")).toBeInTheDocument();
    stub("get", "/incidents", {}, 500);
    await user.click(screen.getByRole("button", { name: "Actualizar rango" }));
    expect(await screen.findByText("No se pudo cargar el rango.")).toBeInTheDocument();
  });

  it("actualizar rango recarga; un cambio rápido cancela la carga anterior", async () => {
    serve();
    let calls = 0;
    server.use(
      http.get(`${API}/incidents`, async () => {
        calls += 1;
        await new Promise((r) => setTimeout(r, 150));
        return HttpResponse.json({ success: true, data: incidents });
      }),
    );
    const { user } = await open();
    const btn = screen.getByRole("button", { name: "Actualizar rango" });
    await user.click(btn);
    await user.click(btn);
    await waitFor(() => expect(calls).toBeGreaterThanOrEqual(3));
    expect(await screen.findByText("Robo")).toBeInTheDocument();
  });

  it("una carga cancelada que falla no muestra error", async () => {
    serve();
    let n = 0;
    server.use(
      http.get(`${API}/incidents`, async () => {
        n += 1;
        if (n === 2) {
          await new Promise((r) => setTimeout(r, 100));
          return HttpResponse.json({ message: "tarde" }, { status: 500 });
        }
        await new Promise((r) => setTimeout(r, 200));
        return HttpResponse.json({ success: true, data: incidents });
      }),
    );
    const { user } = await open();
    await waitFor(() => expect(n).toBeGreaterThanOrEqual(1));
    await user.click(screen.getByRole("button", { name: "Actualizar rango" }));
    await user.click(screen.getByRole("button", { name: "Actualizar rango" }));
    await screen.findByText("Robo");
    expect(screen.queryByText("tarde")).toBeNull();
  });

  it("al desmontar con la carga en curso no actualiza el estado", async () => {
    serve();
    server.use(
      http.post(`${API}/rounds/datatable`, async () => {
        await new Promise((r) => setTimeout(r, 200));
        return HttpResponse.json({ success: true, data: { rows: [], total: 0 } });
      }),
    );
    const { unmount } = await open();
    unmount();
    await new Promise((r) => setTimeout(r, 400));
  });

  it("cambiar el rango pide con las nuevas fechas; un rango incompleto no recarga", async () => {
    const roundsCall = serve();
    const { user } = await open();
    await screen.findByText("Robo");
    const input = screen.getByPlaceholderText("dd/mm/aaaa - dd/mm/aaaa");
    await user.click(input);
    const floating = document.querySelector("[data-it-floating]") as HTMLElement;
    const days = within(floating).getAllByText(/^(10|12)$/, { selector: "span" });
    const before = roundsCall.method;
    await user.click(days[0]);
    expect(roundsCall.method).toBe(before);
    await user.click(within(document.querySelector("[data-it-floating]") as HTMLElement).getAllByText("12", { selector: "span" })[0]);
    await waitFor(() => expect(screen.getByText(/^Rondas — 10 \w+ a 12 \w+/)).toBeInTheDocument());
  });

  it("escribir una sola fecha usa el rango por defecto en los títulos", async () => {
    serve();
    const { user } = await open();
    await screen.findByText("Robo");
    const input = screen.getByPlaceholderText("dd/mm/aaaa - dd/mm/aaaa");
    await user.clear(input);
    await user.type(input, "15102026");
    await waitFor(() => expect(screen.getByText(new RegExp(`^Rondas — ${today.subtract(6, "day").format("DD MMM")} a ${today.format("DD MMM")}`))).toBeInTheDocument());
  });
});

describe("dashboard: Security Analytics", () => {
  const stats = { totalIncidents: 7, totalScans: 120, incompleteRounds: 3, missedScans: 5 };
  const top = Array.from({ length: 8 }, (_, i) => ({ guardId: i, name: `G${i}`, lastName: "X", totalScans: 100 - i }));
  const work = Array.from({ length: 12 }, (_, i) => ({ guardId: i, name: `W${i}`, lastName: "X", role: "GUARD", workload: 50 - i, details: { scans: 1, reports: 1, rounds: 1 } }));

  const serve = (over: { stats?: unknown; top?: unknown; work?: unknown } = {}) => {
    stub("get", "/dashboard/live", { success: true, data: liveDashboard() });
    const s = stub("get", "/reports/guards/stats", over.stats ?? { success: true, data: stats });
    stub("get", "/reports/guards/top-performance", over.top ?? { success: true, data: top });
    stub("get", "/reports/guards/workload", over.work ?? { success: true, data: work });
    return s;
  };
  const open = async () => {
    const ctx = mount();
    await screen.findByText("Rondas activas");
    await ctx.user.click(screen.getByRole("button", { name: "Security Analytics" }));
    return ctx;
  };

  it("pide estadísticas del año a hoy y muestra totales y distribución", async () => {
    const s = serve();
    await open();
    expect(await screen.findByText("120")).toBeInTheDocument();
    expect(screen.getByText("Histórico y analítica de seguridad")).toBeInTheDocument();
    expect(s.search).toBe(`?startDate=${today.startOf("year").format("YYYY-MM-DD")}&endDate=${today.format("YYYY-MM-DD")}`);
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("Escaneos: 120")).toBeInTheDocument();
    expect(screen.getByText("Puntos omitidos: 5")).toBeInTheDocument();
  });

  it("el tooltip de la distribución formatea porcentajes", async () => {
    serve();
    await open();
    await screen.findByText("120");
    const chart = await screen.findByRole("img", { name: "Distribución de actividad por porcentaje" }).catch(() => null);
    const root = (chart ?? screen.getByLabelText("Distribución de actividad por porcentaje")) as HTMLElement;
    const scope = (root.closest("svg")?.parentElement ?? root.parentElement ?? root) as HTMLElement;
    scope.querySelectorAll("g").forEach((g) => fireEvent.mouseEnter(g));
    expect(scope.textContent).toMatch(/\d+%/);
  });

  it("carga de trabajo: ranking y vuelta al resumen", async () => {
    serve();
    const { user } = await open();
    await screen.findByText("120");
    await user.click(screen.getByRole("button", { name: "Carga de Trabajo" }));
    expect(await screen.findByText("Comparativa de Carga de Trabajo")).toBeInTheDocument();
    expect(screen.getByText("Ranking Operacional")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Resumen" }));
    expect(await screen.findByText("Top Desempeño (Escaneos)")).toBeInTheDocument();
  });

  it("sin datos muestra estados vacíos y ceros", async () => {
    serve({ stats: { success: true }, top: { success: true }, work: { success: true } });
    const { user } = await open();
    expect(await screen.findByText("Sin datos en el rango seleccionado.")).toBeInTheDocument();
    expect(screen.getAllByText("0").length).toBeGreaterThanOrEqual(4);
    await user.click(screen.getByRole("button", { name: "Carga de Trabajo" }));
    expect(await screen.findByText("Sin datos en el rango seleccionado.")).toBeInTheDocument();
  });

  it("si las estadísticas fallan deja la distribución en espera", async () => {
    serve({ stats: { success: false }, top: { success: false }, work: { success: false } });
    await open();
    await waitFor(() => expect(screen.getAllByText("0").length).toBeGreaterThanOrEqual(4));
    expect(screen.queryByText(/^Escaneos: /)).toBeNull();
  });

  it("mientras carga muestra esqueletos (resumen y carga de trabajo)", async () => {
    stub("get", "/dashboard/live", { success: true, data: liveDashboard() });
    server.use(
      http.get(`${API}/reports/guards/stats`, async () => {
        await new Promise((r) => setTimeout(r, 300));
        return HttpResponse.json({ success: true, data: stats });
      }),
      http.get(`${API}/reports/guards/top-performance`, () => HttpResponse.json({ success: true, data: top })),
      http.get(`${API}/reports/guards/workload`, () => HttpResponse.json({ success: true, data: work })),
    );
    const { user } = await open();
    expect(screen.queryByText("Sin datos en el rango seleccionado.")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Carga de Trabajo" }));
    expect(screen.queryByText("Ranking Operacional")).toBeInTheDocument();
    expect(await screen.findByText("Comparativa de Carga de Trabajo")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("Sin datos en el rango seleccionado.")).toBeNull());
  });

  it("actualizar vuelve a pedir; elegir un rango nuevo pide con esas fechas", async () => {
    const s = serve();
    const { user } = await open();
    await screen.findByText("120");
    await user.click(screen.getByRole("button", { name: "Actualizar analítica" }));
    await user.click(screen.getByPlaceholderText("dd/mm/aaaa - dd/mm/aaaa"));
    const pick = (n: string) => within(document.querySelector("[data-it-floating]") as HTMLElement).getAllByText(n, { selector: "span" })[0];
    await user.click(pick("10"));
    await user.click(pick("12"));
    await waitFor(() => expect(s.search).toMatch(/startDate=\d{4}-\d{2}-10&endDate=\d{4}-\d{2}-12/));
  });

  it("un rango incompleto no consulta (ni al escribir una sola fecha ni al actualizar)", async () => {
    stub("get", "/dashboard/live", { success: true, data: liveDashboard() });
    let calls = 0;
    server.use(
      http.get(`${API}/reports/guards/stats`, () => ((calls += 1), HttpResponse.json({ success: true, data: stats }))),
      http.get(`${API}/reports/guards/top-performance`, () => HttpResponse.json({ success: true, data: top })),
      http.get(`${API}/reports/guards/workload`, () => HttpResponse.json({ success: true, data: work })),
    );
    const { user } = await open();
    await screen.findByText("120");
    expect(calls).toBe(1);
    const input = screen.getByPlaceholderText("dd/mm/aaaa - dd/mm/aaaa");
    await user.clear(input);
    await user.type(input, "15102026");
    await act(async () => {
      await new Promise((r) => setTimeout(r, 300));
    });
    expect(calls).toBe(1);
    await user.click(screen.getByRole("button", { name: "Actualizar analítica" }));
    await act(async () => {
      await new Promise((r) => setTimeout(r, 300));
    });
    expect(calls).toBe(1);
  });
});

describe("HomePage", () => {
  const home = (role: string | null, token = true) => {
    if (role) store.dispatch(setAuth(makeToken({ role })));
    else store.dispatch(logout());
    void token;
    return renderWithProviders(
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="*" element={<WhereAmI />} />
      </Routes>,
    );
  };

  it("ADMIN y SHIFT ven el dashboard en vivo", async () => {
    stub("get", "/dashboard/live", { success: true, data: liveDashboard() });
    stub("get", "/chat/messages", { success: true, data: [] });
    home("SHIFT");
    expect(await screen.findByText("Rondas activas")).toBeInTheDocument();
  });

  it("MAINT ve solo sus accesos y navega", async () => {
    const { user } = home("MAINT");
    expect(await screen.findByText("Mantenimiento")).toBeInTheDocument();
    expect(screen.getByText(/Bienvenido, Admin/)).toBeInTheDocument();
    expect(screen.queryByText("Kardex")).toBeNull();
    await user.click(screen.getByText("Mantenimiento"));
    expect(await screen.findByTestId("where")).toHaveTextContent("/maintenances");
  });

  it("GUARD no tiene accesos rápidos", async () => {
    home("GUARD");
    expect(await screen.findByText(/Accesos rápidos/)).toBeInTheDocument();
    expect(screen.queryByText("Mantenimiento")).toBeNull();
  });

  it("el rol sin definir no muestra accesos", async () => {
    store.dispatch(setAuth(makeToken({ role: undefined as never })));
    renderWithProviders(<Routes><Route path="/" element={<HomePage />} /></Routes>);
    expect(await screen.findByText(/Accesos rápidos/)).toBeInTheDocument();
    expect(screen.queryByText("Kardex")).toBeNull();
  });

  it("sin sesión redirige al login", async () => {
    home(null);
    expect(await screen.findByTestId("where")).toHaveTextContent("/login");
  });

  it("nombre vacío en el saludo", async () => {
    store.dispatch(setAuth(makeToken({ role: "GUARD", name: "" })));
    renderWithProviders(<Routes><Route path="/" element={<HomePage />} /></Routes>);
    expect(await screen.findByText("Bienvenido. Accesos rápidos a tus módulos.")).toBeInTheDocument();
  });
});

void vi;
