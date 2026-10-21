import { ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { APIProvider, Map, AdvancedMarker, Pin, Polyline, useMap } from '@vis.gl/react-google-maps';
import { useEffect } from 'react';

export interface RoutePoint {
  seq: number;
  label: string;
  timestamp: string;
  lat: number;
  lng: number;
  /** COMPLETE = escaneo con foto; NO_EVIDENCE = escaneo sin foto; MISSING = punto no escaneado. */
  status?: "COMPLETE" | "NO_EVIDENCE" | "MISSING";
  locationId?: number | null;
  eventIndex?: number | null;
}

interface RoundRouteMapProps {
  points: RoutePoint[];
  height?: string;
  className?: string;
  onPointSelect?: (point: RoutePoint) => void;
  /** Extra padding when fitting all points; higher = more zoomed out. */
  fitPadding?: number;
  /** Active point while the step-by-step animation is playing. */
  focusedPoint?: RoutePoint | null;
  /** If set, only the first N points are visible (step-by-step reveal). */
  visiblePointCount?: number | null;
}

const DEFAULT_CENTER = { lat: 32.4608, lng: -116.9247 };

/**
 * Mapa de UNA ronda: pines numerados en el orden en que se escanearon +
 * línea conectándolos, para "ver qué puntos ha escaneado" de un vistazo.
 * Distinto de LiveGuardsMap (dashboard en vivo), que muestra la última
 * ubicación de VARIOS guardias a la vez, no la secuencia de una ronda.
 */
export const RoundRouteMap = ({ points, height = '420px', className = '', onPointSelect, fitPadding = 64, focusedPoint = null, visiblePointCount = null }: RoundRouteMapProps) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <ITFlex align="center" justify="center" className="flex items-center justify-center bg-slate-100 rounded-xl border border-slate-200 text-slate-400 text-sm italic" style={{ height }}>
        Google Maps API Key no configurada
      </ITFlex>
    );
  }

  const visiblePoints = visiblePointCount == null ? points : points.slice(0, Math.max(visiblePointCount, 0));

  if (visiblePoints.length === 0) {
    return (
      <ITFlex direction="column" align="center" justify="center" gap={2} className="flex flex-col items-center justify-center gap-2 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-sm" style={{ height }}>
        <ITText as="span">Esta ronda no tiene escaneos con ubicación registrada</ITText>
      </ITFlex>
    );
  }

  const center = visiblePoints.length === 1 ? { lat: visiblePoints[0].lat, lng: visiblePoints[0].lng } : DEFAULT_CENTER;
  const routePath = visiblePoints.filter((p) => p.status !== "MISSING");

  const pinColor = (point: RoutePoint) => {
    if (point.status === "MISSING") return { background: "#94a3b8", border: "#475569" };
    if (point.status === "NO_EVIDENCE") return { background: "#ef4444", border: "#991b1b" };
    return { background: "#12a36f", border: "#065911" };
  };

  return (
    <ITFlex direction="column" className={`rounded-xl overflow-hidden border border-slate-200 shadow-sm ${className}`} style={{ height }}>
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={center}
          defaultZoom={visiblePoints.length === 1 ? 16 : 15}
          gestureHandling={'cooperative'}
          disableDefaultUI={true}
          mapId="bf3fcca21542f575"
        >
          <Polyline
            path={routePath.map((p) => ({ lat: p.lat, lng: p.lng }))}
            strokeColor="#12a36f"
            strokeOpacity={0.8}
            strokeWeight={3}
          />
          {visiblePoints.map((point) => {
            const isFocused = focusedPoint?.seq === point.seq;
            return (
              <AdvancedMarker
                key={`${point.seq}-${point.timestamp}`}
                position={{ lat: point.lat, lng: point.lng }}
                onClick={() => onPointSelect?.(point)}
              >
                <ITFlex align="center" justify="center" className="relative">
                  {isFocused && (
                    <ITFlex className="absolute inline-flex h-12 w-12 animate-ping rounded-full bg-emerald-400 opacity-40" />
                  )}
                  <Pin
                    background={pinColor(point).background}
                    glyphColor={'#fff'}
                    borderColor={pinColor(point).border}
                    glyph={String(point.seq)}
                  />
                </ITFlex>
              </AdvancedMarker>
            );
          })}
          <FocusMap point={focusedPoint} />
          <FitBounds points={visiblePoints} padding={fitPadding} focused={!!focusedPoint} />
        </Map>
      </APIProvider>
    </ITFlex>
  );
};

const FocusMap = ({ point }: { point: RoutePoint | null }) => {
  const map = useMap();
  useEffect(() => {
    if (!map || !point) return;
    map.panTo({ lat: point.lat, lng: point.lng });
    map.setZoom(17);
  }, [map, point?.lat, point?.lng]);
  return null;
};

const FitBounds = ({ points, padding, focused }: { points: RoutePoint[]; padding: number; focused: boolean }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || points.length < 2 || focused) return;
    const bounds = new google.maps.LatLngBounds();
    points.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));
    map.fitBounds(bounds, padding);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, JSON.stringify(points.map((p) => [p.lat, p.lng])), padding, focused]);

  return null;
};
