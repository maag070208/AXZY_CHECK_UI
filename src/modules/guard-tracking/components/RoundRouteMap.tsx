import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, Polyline, useMap } from '@vis.gl/react-google-maps';
import { useEffect, useState } from 'react';

export interface RoutePoint {
  seq: number;
  label: string;
  timestamp: string;
  lat: number;
  lng: number;
}

interface RoundRouteMapProps {
  points: RoutePoint[];
  height?: string;
  className?: string;
}

const DEFAULT_CENTER = { lat: 32.4608, lng: -116.9247 };

/**
 * Mapa de UNA ronda: pines numerados en el orden en que se escanearon +
 * línea conectándolos, para "ver qué puntos ha escaneado" de un vistazo.
 * Distinto de LiveGuardsMap (dashboard en vivo), que muestra la última
 * ubicación de VARIOS guardias a la vez, no la secuencia de una ronda.
 */
export const RoundRouteMap = ({ points, height = '420px', className = '' }: RoundRouteMapProps) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyBEcey4scuaufZ6TD4oOZZKjO';
  const [activePoint, setActivePoint] = useState<RoutePoint | null>(null);

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center bg-slate-100 rounded-xl border border-slate-200 text-slate-400 text-sm italic" style={{ height }}>
        Google Maps API Key no configurada
      </div>
    );
  }

  if (points.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-sm" style={{ height }}>
        <span>Esta ronda no tiene escaneos con ubicación registrada</span>
      </div>
    );
  }

  const center = points.length === 1 ? { lat: points[0].lat, lng: points[0].lng } : DEFAULT_CENTER;

  return (
    <div className={`rounded-xl overflow-hidden border border-slate-200 shadow-sm ${className}`} style={{ height }}>
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={center}
          defaultZoom={points.length === 1 ? 16 : 15}
          gestureHandling={'greedy'}
          disableDefaultUI={false}
          mapId="bf3fcca21542f575"
        >
          <Polyline
            path={points.map((p) => ({ lat: p.lat, lng: p.lng }))}
            strokeColor="#0ea5e9"
            strokeOpacity={0.8}
            strokeWeight={3}
          />
          {points.map((point) => (
            <AdvancedMarker
              key={`${point.seq}-${point.timestamp}`}
              position={{ lat: point.lat, lng: point.lng }}
              onClick={() => setActivePoint(point)}
            >
              <Pin background={'#0ea5e9'} glyphColor={'#fff'} borderColor={'#0c4a6e'} glyph={String(point.seq)} />
            </AdvancedMarker>
          ))}
          {activePoint && (
            <InfoWindow position={{ lat: activePoint.lat, lng: activePoint.lng }} onCloseClick={() => setActivePoint(null)}>
              <div className="text-xs">
                <p className="font-bold text-slate-700">#{activePoint.seq} · {activePoint.label}</p>
                <p className="text-slate-400">{new Date(activePoint.timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </InfoWindow>
          )}
          <FitBounds points={points} />
        </Map>
      </APIProvider>
    </div>
  );
};

const FitBounds = ({ points }: { points: RoutePoint[] }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || points.length < 2) return;
    const bounds = new google.maps.LatLngBounds();
    points.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));
    map.fitBounds(bounds, 64);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, JSON.stringify(points.map((p) => [p.lat, p.lng]))]);

  return null;
};
