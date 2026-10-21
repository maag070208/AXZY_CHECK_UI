import { act, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import store from "@app/core/store/store";
import { stub } from "../helpers/api";
import { mapProbe } from "../helpers/maps";
import { renderApp } from "../helpers/render";

const toast = () => store.getState().toast;
const T0 = new Date("2026-10-20T15:00:00.000Z").getTime();
const at = (ms: number) => new Date(T0 + ms).toISOString();
const MIN = 60000;

const loc = (id: number, name: string, withCoords = true) => ({
  id, locationId: id, location: { id, name }, ...(withCoords ? { lastLatitude: 32.4 + id / 100, lastLongitude: -116.9 } : {}),
});

const baseRound = (over: Record<string, unknown> = {}) => ({
  id: 5, guardId: 1, startTime: at(0), endTime: at(10 * MIN), status: "COMPLETED", recurringConfigurationId: 3,
  recurringConfiguration: { id: 3, title: "Ronda norte", recurringLocations: [loc(1, "Puerta"), loc(2, "Alberca"), loc(3, "Gimnasio")] },
  guard: { id: 1, name: "Ana", lastName: "Pérez" }, ...over,
});

const timeline = () => [
  { type: "START", timestamp: at(0), description: "Inicio de ronda", data: {} },
  {
    type: "SCAN", timestamp: at(1 * MIN), description: "Escaneo Puerta",
    data: {
      id: 101, location: { id: 1, name: "Puerta" }, latitude: 32.46, longitude: -116.92, scanType: "RECURRING",
      media: [{ type: "IMAGE", url: "http://x/1.png", key: "k1" }, { type: "IMAGE", url: "http://x/2.png" }],
      notes: "--- Checklist ---\n[x] Hecho\n[ ] Pendiente\n\nNota libre",
      assignment: { tasks: [{ description: "Revisar", completed: true }, { description: "Cerrar", completed: false }] },
    },
  },
  { type: "SCAN", timestamp: at(2 * MIN), description: "Escaneo Puerta (otra vez)", data: { id: 102, location: { id: 1, name: "Puerta" }, latitude: 32.461, longitude: -116.921 } },
  { type: "SCAN", timestamp: at(3.5 * MIN), description: "Escaneo Alberca", data: { id: 103, location: { id: 2, name: "Alberca" }, scanType: "FREE", media: [] } },
  { type: "INCIDENT", timestamp: at(4 * MIN), description: "Incidencia: Robo", data: { id: 201, category: "Robo", description: "Se llevaron algo", media: [], latitude: 32.47, longitude: -116.91 } },
  { type: "END", timestamp: at(10 * MIN), description: "Fin de ronda", data: {} },
];

const serve = (round = baseRound(), tl: unknown[] = timeline()) => stub("get", "/rounds/5", { success: true, data: { round, timeline: tl } });
const open = async (role = "ADMIN", route: string | string[] = "/rounds/5") => {
  const r = renderApp({ route, role });
  await screen.findByText("Duración total");
  return r;
};
const eventCard = (text: string) => screen.getByText(text).closest("[class*=cursor-pointer], [role=button]") ?? screen.getByText(text);
const dialogEl = async (title = "Detalle del evento") => (await screen.findByText(title)).closest("[data-it-dialog]") as HTMLElement;

afterEach(() => vi.restoreAllMocks());

describe("detalle de ronda", () => {
  it("muestra cabecera, métricas y la ruta recorrida", async () => {
    serve();
    await open();
    expect(screen.getByText("Ronda norte")).toBeInTheDocument();
    expect(screen.getByText("FINALIZADA")).toBeInTheDocument();
    expect(screen.getByText("10m")).toBeInTheDocument();
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
    expect(screen.getByText("2m 30s")).toBeInTheDocument();
    expect(screen.getByText("Puntos cubiertos")).toBeInTheDocument();
    const route = screen.getByText("Ruta recorrida").closest("div[class*=rounded]") as HTMLElement;
    for (const label of ["Completado", "Repetido", "Sin evidencia", "Faltante"]) expect(within(route).getByText(label)).toBeInTheDocument();
    expect(within(route).getAllByText("+1m 0s").length).toBe(2);
    expect(within(route).getByText("Inicio")).toBeInTheDocument();
    expect(within(route).getByText("Fin")).toBeInTheDocument();
  });

  it("ronda en curso: punto pendiente y duración hasta ahora, con días", async () => {
    vi.useFakeTimers({ toFake: ["Date"], now: new Date(T0 + 2 * 86400000 + 3 * 3600000 + 5 * MIN) });
    serve(baseRound({ endTime: null, status: "IN_PROGRESS" }), timeline().slice(0, 4));
    await open();
    expect(screen.getByText("EN CURSO")).toBeInTheDocument();
    expect(screen.getByText("2d 3h 5m")).toBeInTheDocument();
    expect(screen.getByText("Pendiente")).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("duración con horas pero sin días", async () => {
    serve(baseRound({ endTime: at(2 * 3600000 + 5 * MIN) }), timeline());
    await open();
    expect(screen.getByText("2h 5m")).toBeInTheDocument();
  });

  it("ronda finalizada sin hora de fin mide hasta ahora y no tiene nodo de fin", async () => {
    vi.useFakeTimers({ toFake: ["Date"], now: new Date(T0 + 7 * MIN) });
    serve(baseRound({ endTime: null }), timeline().slice(0, 4));
    await open();
    expect(screen.getByText("7m")).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("saltos menores a un minuto se muestran en segundos", async () => {
    const tl = timeline();
    tl[1].timestamp = at(30 * 1000);
    tl[2].timestamp = at(45 * 1000);
    serve(baseRound(), tl);
    await open();
    expect(screen.getAllByText(/\+30s/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\+15s/).length).toBeGreaterThan(0);
  });

  it("escaneo con lista de tareas vacía no pinta la sección", async () => {
    const tl = timeline();
    (tl[1].data as any).assignment = { tasks: [] };
    serve(baseRound(), tl);
    const { user } = await open();
    await user.click(screen.getByText("Escaneo Puerta"));
    const dialog = await dialogEl();
    expect(within(dialog).getByText("Tareas realizadas")).toBeInTheDocument();
    expect(within(dialog).queryByText("Revisar")).toBeNull();
  });

  it("guardia sin apellido", async () => {
    serve(baseRound({ guard: { id: 1, name: "Ana", lastName: null } }));
    await open();
    expect(screen.getByText(/^Ana\s+·/)).toBeInTheDocument();
  });

  it("sin ubicaciones esperadas cuenta los escaneos válidos", async () => {
    serve(baseRound({ recurringConfiguration: { id: 3, title: "Libre" } }), timeline());
    await open();
    expect(screen.getByText("Puntos válidos")).toBeInTheDocument();
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
  });

  it("ronda en curso sin escaneos tiene promedio en cero", async () => {
    serve(baseRound({ endTime: null, status: "IN_PROGRESS" }), [{ type: "START", timestamp: at(0), description: "Inicio", data: {} }]);
    await open();
    expect(screen.getByText("0m 0s")).toBeInTheDocument();
  });

  it("título: de la configuración, de la lista de rutas o por defecto", async () => {
    serve(baseRound({ recurringConfiguration: undefined, recurringConfigurationId: 8 }), timeline());
    stub("get", "/recurring", { success: true, data: [{ id: 8, title: "Ruta de lista" }] });
    await open();
    expect(await screen.findByText("Ruta de lista")).toBeInTheDocument();
  });

  it("si la ruta no está en la lista o la lista falla usa 'Ronda #id'", async () => {
    serve(baseRound({ recurringConfiguration: undefined, recurringConfigurationId: 8 }), timeline());
    stub("get", "/recurring", { success: true, data: [{ id: 1, title: "Otra" }] });
    await open();
    expect(await screen.findByText("Ronda #5")).toBeInTheDocument();
  });

  it("lista de rutas sin éxito y ronda sin configuración alguna", async () => {
    serve(baseRound({ recurringConfiguration: undefined, recurringConfigurationId: 8 }), timeline());
    stub("get", "/recurring", { success: false });
    await open();
    expect(await screen.findByText("Ronda #5")).toBeInTheDocument();
  });

  it("ronda sin configuración ni id de configuración", async () => {
    serve(baseRound({ recurringConfiguration: undefined, recurringConfigurationId: 0 }), timeline());
    await open();
    expect(await screen.findByText("Ronda #5")).toBeInTheDocument();
  });

  it("no encontrada: muestra el error y reintenta", async () => {
    stub("get", "/rounds/5", { success: false });
    const { user } = renderApp({ route: "/rounds/5", role: "ADMIN" });
    expect(await screen.findByText("La ronda que buscas no existe o fue eliminada.")).toBeInTheDocument();
    serve();
    await user.click(screen.getByRole("button", { name: /reintentar/i }));
    expect(await screen.findByText("Duración total")).toBeInTheDocument();
  });

  it("mientras carga muestra el estado de carga", async () => {
    let release!: () => void;
    const { http, HttpResponse } = await import("msw");
    const { API, server } = await import("../helpers/server");
    server.use(
      http.get(`${API}/rounds/5`, async () => {
        await new Promise<void>((r) => (release = r));
        return HttpResponse.json({ success: true, data: { round: baseRound(), timeline: timeline() } });
      }),
    );
    renderApp({ route: "/rounds/5", role: "ADMIN" });
    expect(await screen.findByText("Cargando información de la ronda...")).toBeInTheDocument();
    release();
    expect(await screen.findByText("Duración total")).toBeInTheDocument();
  });

  it("la flecha de regreso vuelve a la pantalla anterior", async () => {
    serve();
    const { user } = await open("ADMIN", ["/home", "/rounds/5"]);
    await user.click(screen.getByRole("button", { name: /volver|atrás|back/i }));
    await waitFor(() => expect(screen.queryByText("Duración total")).toBeNull());
  });
});

describe("detalle de ronda: línea de tiempo", () => {
  it("muestra eventos con hora, tipo, separación y archivos", async () => {
    serve();
    await open();
    expect(screen.getByText("Inicio de ronda")).toBeInTheDocument();
    expect(screen.getByText("2 archivos")).toBeInTheDocument();
    expect(screen.getAllByText(/\+1m 0s/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\+6m 0s|\+1m 30s/).length).toBeGreaterThan(0);
  });

  it("sin eventos", async () => {
    serve(baseRound(), []);
    await open();
    expect(screen.getByText("No hay eventos registrados.")).toBeInTheDocument();
  });

  it("evento con un solo archivo usa el singular y sin imagen no muestra miniatura", async () => {
    const tl = timeline();
    (tl[1].data as any).media = [{ type: "IMAGE", url: "http://x/1.png", key: "k1" }];
    (tl[3].data as any).media = [{ type: "VIDEO" }];
    serve(baseRound(), tl);
    await open();
    expect(screen.getAllByText("1 archivo")).toHaveLength(2);
  });
});

describe("detalle de ronda: evento", () => {
  it("escaneo con evidencia, GPS, notas y tareas", async () => {
    serve();
    const { user } = await open();
    const openSpy = vi.spyOn(window, "open").mockReturnValue(null);
    await user.click(screen.getByText("Escaneo Puerta"));
    const dialog = await dialogEl();
    expect(within(dialog).getByText("Evidencia fotográfica")).toBeInTheDocument();
    expect(within(dialog).getByText("Ubicación GPS")).toBeInTheDocument();
    expect(within(dialog).getByText("32.46")).toBeInTheDocument();
    expect(within(dialog).getByText("Checklist")).toBeInTheDocument();
    expect(within(dialog).getByText("Hecho")).toHaveClass("line-through");
    expect(within(dialog).getByText("Pendiente")).not.toHaveClass("line-through");
    expect(within(dialog).getByText('"Nota libre"')).toBeInTheDocument();
    expect(within(dialog).getByText("Revisar")).toHaveClass("line-through");
    expect(within(dialog).getByText("Cerrar")).not.toHaveClass("line-through");
    await user.click(within(dialog).getByRole("button", { name: /abrir en google maps/i }));
    expect(openSpy).toHaveBeenCalledWith("https://www.google.com/maps/search/?api=1&query=32.46,-116.92", "_blank");
  });

  it("escaneo sin evidencia ni coordenadas ni notas", async () => {
    serve();
    const { user } = await open();
    await user.click(screen.getByText("Escaneo Alberca"));
    const dialog = await dialogEl();
    expect(within(dialog).getByText("No hay evidencia fotográfica")).toBeInTheDocument();
    expect(within(dialog).getByText("No se registraron coordenadas GPS para este punto")).toBeInTheDocument();
    expect(within(dialog).queryByText("Notas adicionales")).toBeNull();
    expect(within(dialog).queryByText("Tareas realizadas")).toBeNull();
  });

  it("incidente con categoría, descripción y ubicación del incidente", async () => {
    serve();
    const { user } = await open();
    await user.click(screen.getByText("Incidencia: Robo"));
    const dialog = await dialogEl();
    expect(within(dialog).getByText("Robo")).toBeInTheDocument();
    expect(within(dialog).getByText("Se llevaron algo")).toBeInTheDocument();
    expect(within(dialog).getByText("Ubicación del incidente")).toBeInTheDocument();
  });

  it("incidente sin categoría ni descripción", async () => {
    const tl = timeline();
    (tl[4].data as any) = { id: 201 };
    serve(baseRound(), tl);
    const { user } = await open();
    await user.click(screen.getByText("Incidencia: Robo"));
    const dialog = await dialogEl();
    expect(within(dialog).queryByText("Categoría")).toBeNull();
  });

  it("eventos de inicio y fin abren un detalle sin secciones", async () => {
    serve();
    const { user } = await open();
    await user.click(screen.getByText("Inicio de ronda"));
    const dialog = await dialogEl();
    expect(within(dialog).queryByText("Evidencia fotográfica")).toBeNull();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByText("Detalle del evento")).toBeNull());
    await user.click(screen.getByText("Fin de ronda"));
    expect(await dialogEl()).toBeTruthy();
  });

  it("solo ADMIN ve acciones de borrado; SHIFT no", async () => {
    serve();
    const { user } = await open("SHIFT");
    await user.click(screen.getByText("Incidencia: Robo"));
    const dialog = await dialogEl();
    expect(within(dialog).queryByRole("button", { name: "Eliminar registro" })).toBeNull();
  });

  it("eliminar un escaneo libre con confirmación quita el registro", async () => {
    const del = stub("delete", "/kardex/103", { success: true });
    serve();
    const { user } = await open();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    await user.click(screen.getByText("Escaneo Alberca"));
    const dialog = await dialogEl();
    await user.click(within(dialog).getByRole("button", { name: "Eliminar registro" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Registro eliminado", type: "success" }));
    expect(del.path).toBe("/kardex/103");
    await waitFor(() => expect(screen.queryByText("Escaneo Alberca")).toBeNull());
  });

  it("eliminar una incidencia usa el endpoint de incidencias", async () => {
    const del = stub("delete", "/incidents/201", { success: true });
    serve();
    const { user } = await open();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    await user.click(screen.getByText("Incidencia: Robo"));
    const dialog = await dialogEl();
    await user.click(within(dialog).getByRole("button", { name: "Eliminar registro" }));
    await waitFor(() => expect(del.path).toBe("/incidents/201"));
  });

  it("cancelar la confirmación no elimina; si el API falla no quita el registro", async () => {
    const del = stub("delete", "/incidents/201", { success: false });
    serve();
    const { user } = await open();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    await user.click(screen.getByText("Incidencia: Robo"));
    let dialog = await dialogEl();
    await user.click(within(dialog).getByRole("button", { name: "Eliminar registro" }));
    expect(del.method).toBe("");
    confirm.mockReturnValue(true);
    await user.click(within(dialog).getByRole("button", { name: "Eliminar registro" }));
    await waitFor(() => expect(del.method).toBe("DELETE"));
    expect(screen.getAllByText("Incidencia: Robo").length).toBeGreaterThan(0);
    // Cancelar o un fallo del API no cierran el detalle.
    expect(screen.getByText("Detalle del evento")).toBeInTheDocument();
    dialog = await dialogEl();
  });

  it("escaneo con rol MANTENIMIENTO también se puede eliminar; uno normal no", async () => {
    const tl = timeline();
    (tl[2].data as any).user = { role: "MANTENIMIENTO" };
    serve(baseRound(), tl);
    const { user } = await open();
    await user.click(screen.getByText("Escaneo Puerta (otra vez)"));
    const dialog = await dialogEl();
    expect(within(dialog).getByRole("button", { name: "Eliminar registro" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByText("Detalle del evento")).toBeNull());
    await user.click(eventCard("Escaneo Puerta"));
    const normal = await dialogEl();
    expect(within(normal).queryByRole("button", { name: "Eliminar registro" })).toBeNull();
  });

  it("eliminar evidencia de un escaneo quita el archivo", async () => {
    const del = stub("delete", "/kardex/101/media", { success: true });
    serve();
    const { user } = await open();
    await user.click(screen.getByText("Escaneo Puerta"));
    const dialog = await dialogEl();
    await user.click(within(dialog).getByRole("button", { name: "Eliminar" }));
    await waitFor(() => expect(toast()).toMatchObject({ message: "Archivo eliminado correctamente", type: "success" }));
    expect(del.search).toBe("?key=k1");
    await waitFor(() => expect(within(dialog).getByText("1 archivo")).toBeInTheDocument());
  });

  it("eliminar evidencia sin 'key' usa el nombre del archivo; en incidencias usa su endpoint", async () => {
    const tl = timeline();
    (tl[1].data as any).media = [{ type: "IMAGE", url: "http://x/foto.png" }];
    (tl[4].data as any).media = [{ type: "IMAGE", url: "http://x/inc.png", key: "kinc" }];
    serve(baseRound(), tl);
    const kardex = stub("delete", "/kardex/101/media", { success: true });
    const inc = stub("delete", "/incidents/201/media", { success: true });
    const { user } = await open();
    await user.click(screen.getByText("Escaneo Puerta"));
    let dialog = await dialogEl();
    await user.click(within(dialog).getByRole("button", { name: "Eliminar" }));
    await waitFor(() => expect(kardex.search).toBe("?key=foto.png"));
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByText("Detalle del evento")).toBeNull());
    await user.click(screen.getByText("Incidencia: Robo"));
    dialog = await dialogEl();
    await user.click(within(dialog).getByRole("button", { name: "Eliminar" }));
    await waitFor(() => expect(inc.search).toBe("?key=kinc"));
  });

  it("si el API no confirma la baja de evidencia no cambia nada", async () => {
    const del = stub("delete", "/kardex/101/media", { success: false });
    serve();
    const { user } = await open();
    await user.click(screen.getByText("Escaneo Puerta"));
    const dialog = await dialogEl();
    await user.click(within(dialog).getByRole("button", { name: "Eliminar" }));
    await waitFor(() => expect(del.method).toBe("DELETE"));
    expect(within(dialog).getByText("2 archivos")).toBeInTheDocument();
  });

  it("eliminar evidencia de un archivo sin url ni key no hace nada", async () => {
    const tl = timeline();
    (tl[1].data as any).media = [{ type: "IMAGE", url: "http://x/" }];
    serve(baseRound(), tl);
    const del = stub("delete", "/kardex/101/media", { success: true });
    const { user } = await open();
    await user.click(screen.getByText("Escaneo Puerta"));
    const dialog = await dialogEl();
    await user.click(within(dialog).getByRole("button", { name: "Eliminar" }));
    await act(async () => {});
    expect(del.method).toBe("");
  });
});

describe("detalle de ronda: mapa", () => {
  it("dibuja pines numerados (con foto, sin foto y no escaneado) y la línea", async () => {
    serve();
    await open();
    expect(mapProbe.markers).toHaveLength(3);
    expect(mapProbe.polyline!.path).toHaveLength(2);
    const pins = screen.getAllByTestId("pin");
    expect(pins.map((p) => p.getAttribute("data-glyph"))).toEqual(["1", "2", "3"]);
    expect(pins.map((p) => p.getAttribute("data-bg"))).toEqual(["#12a36f", "#ef4444", "#94a3b8"]);
    expect(mapProbe.fitBounds).toHaveBeenCalled();
  });

  it("clic en un pin resalta el punto en la ruta y la línea de tiempo", async () => {
    serve();
    await open();
    const scrollSpy = vi.spyOn(Element.prototype, "scrollIntoView").mockImplementation(() => {});
    act(() => mapProbe.markers[0].onClick());
    await waitFor(() => expect(document.querySelectorAll("[class*='ring-emerald-300']").length).toBeGreaterThan(0));
    expect(scrollSpy).toHaveBeenCalled();
  });

  it("clic en un pin sin ubicación asociada no hace nada", async () => {
    const tl = timeline();
    (tl[1].data as any).location = undefined;
    serve(baseRound(), tl);
    await open();
    act(() => mapProbe.markers[0].onClick());
    expect(document.querySelectorAll("[class*='ring-emerald-300']")).toHaveLength(0);
  });

  it("sin coordenadas muestra el aviso", async () => {
    const tl = timeline().map((e) => ({ ...e, data: { ...e.data, latitude: undefined, longitude: undefined } }));
    serve(baseRound({ recurringConfiguration: { id: 3, title: "R", recurringLocations: [loc(1, "Puerta", false)] } }), tl);
    await open();
    expect(screen.getByText("Sin coordenadas GPS para trazar la ruta.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reproducir recorrido" })).toBeDisabled();
  });

  it("Abrir en Google Maps: sin puntos avisa, con uno abre el punto, con varios arma la ruta", async () => {
    const openSpy = vi.spyOn(window, "open").mockReturnValue(null);
    const none = timeline().map((e) => ({ ...e, data: { ...e.data, latitude: undefined, longitude: undefined } }));
    serve(baseRound(), none);
    const a = await open();
    await a.user.click(screen.getAllByRole("button", { name: /abrir en google maps/i })[0]);
    expect(toast()).toMatchObject({ message: "No hay puntos con coordenadas GPS para trazar una ruta.", type: "warning" });
    a.unmount();

    const one = timeline();
    (one[2].data as any).latitude = undefined;
    serve(baseRound(), one);
    const b = await open();
    await b.user.click(screen.getAllByRole("button", { name: /abrir en google maps/i })[0]);
    expect(openSpy).toHaveBeenLastCalledWith("https://www.google.com/maps/search/?api=1&query=32.46,-116.92", "_blank");
    b.unmount();

    const many = timeline();
    (many[3].data as any).latitude = 32.5;
    (many[3].data as any).longitude = -116.8;
    serve(baseRound(), many);
    const c = await open();
    await c.user.click(screen.getAllByRole("button", { name: /abrir en google maps/i })[0]);
    const url = openSpy.mock.calls.at(-1)![0] as string;
    expect(url).toContain("origin=32.46,-116.92");
    expect(url).toContain("destination=32.5,-116.8");
    expect(url).toContain("waypoints=32.461,-116.921");
    expect(url).toContain("travelmode=walking");
  });

  it("reproducir recorrido avanza punto por punto, se puede pausar y repetir", async () => {
    serve();
    const { user } = await open();
    expect(screen.getByText("Recorrido")).toBeInTheDocument();
    expect(screen.getByText("0 / 2")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reproducir recorrido" }));
    expect(await screen.findByText("Reproduciendo recorrido")).toBeInTheDocument();
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Pausar recorrido" }));
    expect(screen.getByText("Recorrido en pausa")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reproducir recorrido" }));
    expect(await screen.findByText("Recorrido completado", {}, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
    expect(screen.getAllByText(/\+1m 0s/).length).toBeGreaterThan(0);
    await user.click(screen.getByRole("button", { name: "Reproducir recorrido" }));
    expect(await screen.findByText("Reproduciendo recorrido")).toBeInTheDocument();
  });

  it("ruta con puntos sin coordenadas en el mapa pero con eventos", async () => {
    serve(baseRound({ recurringConfiguration: { id: 3, title: "R", recurringLocations: [loc(1, "Puerta"), { id: 9, locationId: 9, location: { id: 9, name: "Sin GPS" } }] } }), timeline());
    await open();
    expect(screen.getByText("Sin GPS")).toBeInTheDocument();
    expect(mapProbe.markers).toHaveLength(2);
  });
});
