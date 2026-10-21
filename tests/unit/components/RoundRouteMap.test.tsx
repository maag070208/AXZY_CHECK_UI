import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RoundRouteMap, type RoutePoint } from "@app/modules/guard-tracking/components/RoundRouteMap";
import { mapProbe } from "../../helpers/maps";

const p = (seq: number, over: Partial<RoutePoint> = {}): RoutePoint => ({
  seq, label: `P${seq}`, timestamp: `2026-10-20T15:0${seq}:00.000Z`, lat: 32 + seq / 100, lng: -116, status: "COMPLETE", locationId: seq, eventIndex: seq, ...over,
});

describe("RoundRouteMap", () => {
  it("sin clave de Google Maps avisa", () => {
    vi.stubEnv("VITE_GOOGLE_MAPS_API_KEY", "");
    render(<RoundRouteMap points={[p(1)]} />);
    expect(screen.getByText("Google Maps API Key no configurada")).toBeInTheDocument();
    vi.unstubAllEnvs();
  });

  it("sin puntos visibles avisa (lista vacía o revelado en 0)", () => {
    const { unmount } = render(<RoundRouteMap points={[]} />);
    expect(screen.getByText("Esta ronda no tiene escaneos con ubicación registrada")).toBeInTheDocument();
    unmount();
    render(<RoundRouteMap points={[p(1)]} visiblePointCount={0} />);
    expect(screen.getByText("Esta ronda no tiene escaneos con ubicación registrada")).toBeInTheDocument();
  });

  it("un revelado negativo se trata como cero", () => {
    render(<RoundRouteMap points={[p(1)]} visiblePointCount={-3} />);
    expect(screen.getByText("Esta ronda no tiene escaneos con ubicación registrada")).toBeInTheDocument();
  });

  it("un solo punto centra y acerca; no ajusta límites", () => {
    render(<RoundRouteMap points={[p(1)]} />);
    expect(mapProbe.map).toMatchObject({ defaultCenter: { lat: 32.01, lng: -116 }, defaultZoom: 16 });
    expect(mapProbe.fitBounds).not.toHaveBeenCalled();
  });

  it("varios puntos: línea sin faltantes, colores por estado y ajuste con el padding indicado", () => {
    render(<RoundRouteMap points={[p(1), p(2, { status: "NO_EVIDENCE" }), p(3, { status: "MISSING" })]} fitPadding={90} />);
    expect(mapProbe.map).toMatchObject({ defaultZoom: 15 });
    expect(mapProbe.polyline!.path).toHaveLength(2);
    expect(screen.getAllByTestId("pin").map((x) => x.getAttribute("data-bg"))).toEqual(["#12a36f", "#ef4444", "#94a3b8"]);
    expect(mapProbe.fitBounds).toHaveBeenCalledWith(expect.anything(), 90);
  });

  it("revela solo los primeros N puntos", () => {
    render(<RoundRouteMap points={[p(1), p(2), p(3)]} visiblePointCount={2} />);
    expect(mapProbe.markers).toHaveLength(2);
  });

  it("clic en un pin avisa al padre; sin padre no falla", () => {
    const onSelect = vi.fn();
    const { unmount } = render(<RoundRouteMap points={[p(1), p(2)]} onPointSelect={onSelect} />);
    act(() => mapProbe.markers[1].onClick());
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ seq: 2 }));
    unmount();
    render(<RoundRouteMap points={[p(1), p(2)]} />);
    act(() => mapProbe.markers[0].onClick());
  });

  it("el punto enfocado se centra con zoom y no se ajustan los límites", () => {
    render(<RoundRouteMap points={[p(1), p(2)]} focusedPoint={p(2)} />);
    expect(mapProbe.panTo).toHaveBeenCalledWith({ lat: 32.02, lng: -116 });
    expect(mapProbe.setZoom).toHaveBeenCalledWith(17);
    expect(mapProbe.fitBounds).not.toHaveBeenCalled();
  });

  it("sin mapa listo no enfoca ni ajusta", () => {
    mapProbe.hasMap = false;
    render(<RoundRouteMap points={[p(1), p(2)]} focusedPoint={p(2)} />);
    expect(mapProbe.panTo).not.toHaveBeenCalled();
    expect(mapProbe.fitBounds).not.toHaveBeenCalled();
  });
});
