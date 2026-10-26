import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import dayjs from "dayjs";
import { describe, expect, it, vi } from "vitest";
import { AgeBadge } from "@app/core/components/AgeBadge";
import { GoogleMapComponent } from "@app/core/components/GoogleMapComponent";
import { MediaCarousel, type MediaItem } from "@app/core/components/MediaCarousel";
import { ReportDetailDialog, type ReportDetailReport } from "@app/core/components/ReportDetailDialog";
import { renderWithProviders } from "../../helpers/render";
import { mapProbe } from "../../helpers/maps";

describe("AgeBadge", () => {
  const daysAgo = (n: number) => new Date(Date.now() - n * 86400000 - 1000).toISOString();

  it.each([
    [0, "0 días", "text-emerald-600"],
    [1, "1 día", "text-emerald-600"],
    [3, "3 días", "text-amber-500"],
    [5, "5 días", "text-red-600"],
    [7, "7 días", "text-black"],
  ])("hace %i días → %s", (n, label, cls) => {
    render(<AgeBadge createdAt={daysAgo(n)} />);
    expect(screen.getByText(label)).toHaveClass(cls);
  });

  it("una fecha futura no da días negativos", () => {
    render(<AgeBadge createdAt={new Date(Date.now() + 5 * 86400000)} />);
    expect(screen.getByText("0 días")).toBeInTheDocument();
  });
});

describe("GoogleMapComponent", () => {
  it("centra el mapa y el marcador en lat/lng", () => {
    render(<GoogleMapComponent lat={19.4} lng={-99.1} zoom={12} height="200px" className="x" />);
    expect(mapProbe.map).toMatchObject({ defaultCenter: { lat: 19.4, lng: -99.1 }, defaultZoom: 12 });
    expect(mapProbe.marker).toMatchObject({ position: { lat: 19.4, lng: -99.1 }, draggable: false });
    expect(mapProbe.panTo).toHaveBeenCalledWith({ lat: 19.4, lng: -99.1 });
  });

  it("usa la clave del entorno cuando existe", () => {
    vi.stubEnv("VITE_GOOGLE_MAPS_API_KEY", "clave-env");
    render(<GoogleMapComponent lat={1} lng={2} />);
    expect(screen.getByTestId("maps-provider")).toHaveAttribute("data-key", "clave-env");
    vi.unstubAllEnvs();
  });

  it("sin clave de Google Maps avisa en lugar de dibujar el mapa", () => {
    vi.stubEnv("VITE_GOOGLE_MAPS_API_KEY", "");
    render(<GoogleMapComponent lat={1} lng={2} height="150px" />);
    expect(screen.getByText("Google Maps API Key no configurada")).toBeInTheDocument();
    expect(screen.queryByTestId("map")).toBeNull();
    vi.unstubAllEnvs();
  });

  it("no falla si el mapa aún no está listo", () => {
    mapProbe.hasMap = false;
    render(<GoogleMapComponent lat={1} lng={2} />);
    expect(mapProbe.panTo).not.toHaveBeenCalled();
  });

  it("sin edición, clic y arrastre no notifican", () => {
    const onSelect = vi.fn();
    render(<GoogleMapComponent lat={1} lng={2} onLocationSelect={onSelect} />);
    mapProbe.map!.onClick({ detail: { latLng: { lat: 5, lng: 6 } } });
    mapProbe.marker!.onDragEnd({ latLng: { lat: 5, lng: 6 } });
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("editable: clic en el mapa y arrastre del marcador notifican la nueva ubicación", () => {
    const onSelect = vi.fn();
    render(<GoogleMapComponent lat={1} lng={2} isEditable onLocationSelect={onSelect} />);
    expect(mapProbe.marker!.draggable).toBe(true);
    mapProbe.map!.onClick({ detail: { latLng: { lat: 5, lng: 6 } } });
    expect(onSelect).toHaveBeenLastCalledWith(5, 6);
    mapProbe.marker!.onDragEnd({ latLng: { lat: () => 7, lng: () => 8 } });
    expect(onSelect).toHaveBeenLastCalledWith(7, 8);
    mapProbe.marker!.onDragEnd({ latLng: { lat: 9, lng: 10 } });
    expect(onSelect).toHaveBeenLastCalledWith(9, 10);
  });

  it("editable: ignora clic sin coordenadas y arrastre sin latLng", () => {
    const onSelect = vi.fn();
    render(<GoogleMapComponent lat={1} lng={2} isEditable onLocationSelect={onSelect} />);
    mapProbe.map!.onClick({ detail: {} });
    mapProbe.marker!.onDragEnd({});
    expect(onSelect).not.toHaveBeenCalled();
  });
});

describe("MediaCarousel", () => {
  const items: MediaItem[] = [
    { type: "IMAGE", url: "http://x/a.png", title: "Foto A" },
    { type: "VIDEO", url: "http://x/b.mp4" },
    { type: "IMAGE", url: "http://x/c.png" },
  ];

  it("sin archivos no renderiza nada", () => {
    const { container } = renderWithProviders(<MediaCarousel media={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("un solo archivo: singular, sin flechas ni miniaturas", () => {
    renderWithProviders(<MediaCarousel media={[items[0]]} title="Evidencia" />);
    expect(screen.getByText("1 archivo")).toBeInTheDocument();
    expect(screen.getByText("1 / 1")).toBeInTheDocument();
    expect(screen.queryByLabelText("Siguiente")).toBeNull();
    expect(screen.getByAltText("Foto A")).toBeInTheDocument();
  });

  it("alt cae al título general y luego a 'Evidencia'", () => {
    const { unmount } = renderWithProviders(<MediaCarousel media={[{ type: "IMAGE", url: "u" }]} title="Mi título" />);
    expect(screen.getByAltText("Mi título")).toBeInTheDocument();
    unmount();
    renderWithProviders(<MediaCarousel media={[{ type: "IMAGE", url: "u" }]} />);
    expect(screen.getByAltText("Evidencia")).toBeInTheDocument();
  });

  it("navega con flechas, miniaturas y teclado, con vuelta circular", async () => {
    const { user } = renderWithProviders(<MediaCarousel media={items} initialIndex={0} />);
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
    await user.click(screen.getByLabelText("Siguiente"));
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
    expect(document.querySelector("video")).toBeTruthy();
    await user.click(screen.getByLabelText("Anterior"));
    await user.click(screen.getByLabelText("Anterior"));
    expect(screen.getByText("3 / 3")).toBeInTheDocument();
    await user.click(screen.getByLabelText("Ver archivo 2"));
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByText("3 / 3")).toBeInTheDocument();
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
  });

  it("el teclado no navega con un solo archivo", async () => {
    const { user } = renderWithProviders(<MediaCarousel media={[items[0]]} />);
    await user.keyboard("{ArrowRight}");
    expect(screen.getByText("1 / 1")).toBeInTheDocument();
  });

  it("initialIndex fuera de rango se acota al último", () => {
    renderWithProviders(<MediaCarousel media={items} initialIndex={99} />);
    expect(screen.getByText("3 / 3")).toBeInTheDocument();
  });

  it("eliminar solo aparece con showDelete + onDelete y entrega el archivo actual", async () => {
    const onDelete = vi.fn();
    const { user, unmount } = renderWithProviders(<MediaCarousel media={items} onDelete={onDelete} />);
    expect(screen.queryByRole("button", { name: /eliminar/i })).toBeNull();
    unmount();
    const r = renderWithProviders(<MediaCarousel media={items} onDelete={onDelete} showDelete initialIndex={1} />);
    await r.user.click(screen.getByRole("button", { name: /eliminar/i }));
    expect(onDelete).toHaveBeenCalledWith(items[1], 1);
    void user;
  });

  it("pantalla completa: abre, usa object-contain y Escape la cierra sin cerrar el resto", async () => {
    const { user } = renderWithProviders(<MediaCarousel media={items} />);
    await user.click(screen.getByRole("button", { name: /pantalla completa/i }));
    expect(await screen.findByRole("button", { name: /salir/i })).toBeInTheDocument();
    expect(document.querySelector("img")).toHaveClass("object-contain");
    fireEvent.keyDown(window, { key: "a" });
    expect(screen.getByRole("button", { name: /salir/i })).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("button", { name: /salir/i })).toBeNull();
  });

  it("pantalla completa con video y cierre con la X del diálogo", async () => {
    const { user } = renderWithProviders(<MediaCarousel media={[{ type: "VIDEO", url: "http://x/b.mp4" }]} />);
    await user.click(screen.getByRole("button", { name: /pantalla completa/i }));
    await screen.findByRole("button", { name: /salir/i });
    expect(document.querySelector("video")).toHaveClass("object-contain");
    await user.click(screen.getAllByLabelText("Cerrar")[0]);
    expect(screen.queryByRole("button", { name: /salir/i })).toBeNull();
  });

  it("salir de pantalla completa con el botón", async () => {
    const { user } = renderWithProviders(<MediaCarousel media={items} />);
    await user.click(screen.getByRole("button", { name: /pantalla completa/i }));
    await user.click(await screen.findByRole("button", { name: /salir/i }));
    expect(screen.queryByRole("button", { name: /salir/i })).toBeNull();
  });
});

describe("ReportDetailDialog", () => {
  const base: ReportDetailReport = {
    id: 12,
    title: "Fuga de agua",
    description: "En el lobby",
    status: "PENDING",
    createdAt: "2026-10-01T15:30:00.000Z",
    guard: { name: "Ana", lastName: "Pérez", username: "ana" },
  };

  it("pendiente: muestra datos, acción de resolver y cierra", async () => {
    const onClose = vi.fn();
    const onResolve = vi.fn();
    const { user } = renderWithProviders(
      <ReportDetailDialog kind="incident" report={base} categoryLabel="Agua" typeLabel="Fuga" onClose={onClose} onResolve={onResolve} />,
    );
    expect(screen.getByText("Incidencia #12")).toBeInTheDocument();
    expect(screen.getByText("Pendiente")).toBeInTheDocument();
    expect(screen.getByText("Agua")).toBeInTheDocument();
    expect(screen.getByText("Fuga")).toBeInTheDocument();
    expect(screen.getByText("En el lobby")).toBeInTheDocument();
    expect(screen.getByText("Ana Pérez · @ana")).toBeInTheDocument();
    expect(screen.getByText("Sin evidencia adjunta")).toBeInTheDocument();
    expect(screen.getByText("Atendida · pendiente")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Marcar como atendida" }));
    expect(onResolve).toHaveBeenCalled();
    await user.click(screen.getByText("Cerrar", { selector: "button" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("atendido: sin acción, con fecha y quién resolvió; etiquetas masculinas", () => {
    renderWithProviders(
      <ReportDetailDialog
        kind="maintenance"
        report={{ ...base, status: "ATTENDED", resolvedAt: "2026-10-02T10:00:00.000Z", resolvedBy: { name: "Luis" }, latitude: 1, longitude: 2 }}
        categoryLabel=""
        onClose={() => {}}
        onResolve={() => {}}
      />,
    );
    expect(screen.getByText("Mantenimiento #12")).toBeInTheDocument();
    expect(screen.getByText("General")).toBeInTheDocument();
    expect(screen.getAllByText("Atendido").length).toBeGreaterThan(0);
    expect(screen.getByText(/· Luis/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Marcar como atendido/ })).toBeNull();
    expect(screen.getByTestId("map")).toBeInTheDocument();
  });

  it("atendido sin resolvedBy ni resolvedAt, club, sin descripción ni autor", () => {
    renderWithProviders(
      <ReportDetailDialog
        kind="club"
        report={{ ...base, status: "ATTENDED", description: null, guard: null, media: [{ type: "IMAGE", url: "u" }] }}
        categoryLabel="Club"
        onClose={() => {}}
      />,
    );
    expect(screen.getByText("Reporte de Casa Club #12")).toBeInTheDocument();
    expect(screen.getByText("Sin descripción detallada.")).toBeInTheDocument();
    expect(screen.getByText("Sin registro")).toBeInTheDocument();
    expect(screen.getByText("1 archivo")).toBeInTheDocument();
    expect(screen.queryByTestId("map")).toBeNull();
  });

  it("autor sin nombre usa 'Sin registro' e iniciales '?'", () => {
    renderWithProviders(
      <ReportDetailDialog kind="incident" report={{ ...base, guard: {} }} categoryLabel="x" onClose={() => {}} />,
    );
    expect(screen.getByText("Sin registro")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Sin registro" })).toBeInTheDocument();
  });

  it("atendido con fecha pero sin quién resolvió", () => {
    renderWithProviders(
      <ReportDetailDialog kind="incident" report={{ ...base, status: "ATTENDED", resolvedAt: "2026-10-02T10:00:00.000Z" }} categoryLabel="x" onClose={() => {}} />,
    );
    expect(screen.getByText(dayjs("2026-10-02T10:00:00.000Z").format("DD/MM/YYYY HH:mm"))).toBeInTheDocument();
    expect(screen.queryByText(/ · Luis/)).toBeNull();
  });

  it("pendiente sin onResolve no muestra la acción", () => {
    renderWithProviders(<ReportDetailDialog kind="incident" report={base} categoryLabel="x" onClose={() => {}} />);
    expect(screen.queryByRole("button", { name: /Marcar/ })).toBeNull();
  });
});

void userEvent;
