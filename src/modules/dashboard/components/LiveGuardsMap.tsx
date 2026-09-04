import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { useEffect, useState } from 'react';

export interface LiveMapPoint {
  guardId: number;
  label: string;
  lat: number;
  lng: number;
  stale?: boolean;
}

interface LiveGuardsMapProps {
  points: LiveMapPoint[];
  height?: string;
  className?: string;
}

const DEFAULT_CENTER = { lat: 32.4608, lng: -116.9247 };

/**
 * Multi-pin read-only map for the live dashboard — shows each active
 * guard's last known scan location. `GoogleMapComponent` (used elsewhere
 * for report forms) only supports a single editable pin, so this is a
 * separate small component built on the same @vis.gl/react-google-maps
 * dependency rather than bending that one to a second, unrelated shape.
 */
export const LiveGuardsMap = ({ points: rawPoints, height = '360px', className = '' }: LiveGuardsMapProps) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyBEcey4scuaufZ6TD4oOZZKjO';
  const [activePoint, setActivePoint] = useState<LiveMapPoint | null>(null);

  // Es común que dos guardias escaneen el MISMO punto de control (misma
  // caseta, por ejemplo) casi al mismo tiempo — sus últimas ubicaciones caen
  // en coordenadas idénticas o casi idénticas y un pin queda tapando al
  // otro por completo ("solo se ve el de 1"). Los separamos visualmente sin
  // perder a ninguno.
  const points = spreadOverlappingPoints(rawPoints);

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
        <span>Sin ubicaciones recientes de guardias activos</span>
      </div>
    );
  }

  const center = points.length === 1
    ? { lat: points[0].lat, lng: points[0].lng }
    : DEFAULT_CENTER;

  return (
    <div className={`rounded-xl overflow-hidden border border-slate-200 shadow-sm ${className}`} style={{ height }}>
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={center}
          defaultZoom={points.length === 1 ? 16 : 14}
          gestureHandling={'greedy'}
          disableDefaultUI={false}
          mapId="bf3fcca21542f575"
        >
          {points.map((point) => (
            <AdvancedMarker
              key={point.guardId}
              position={{ lat: point.lat, lng: point.lng }}
              onClick={() => setActivePoint(point)}
            >
              <Pin
                background={point.stale ? '#ef4444' : '#10b981'}
                glyphColor={'#fff'}
                borderColor={point.stale ? '#7f1d1d' : '#064e3b'}
              />
            </AdvancedMarker>
          ))}
          {activePoint && (
            <InfoWindow
              position={{ lat: activePoint.lat, lng: activePoint.lng }}
              onCloseClick={() => setActivePoint(null)}
            >
              <span className="text-xs font-bold text-slate-700">{activePoint.label}</span>
            </InfoWindow>
          )}
          <FitBounds points={points} />
        </Map>
      </APIProvider>
    </div>
  );
};

const OVERLAP_THRESHOLD_METERS = 12;
const OFFSET_RADIUS_METERS = 10;

const distanceMeters = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
};

/**
 * Agrupa puntos que caen prácticamente en el mismo lugar (mismo punto de
 * control) y los reparte en un pequeño círculo alrededor de esa ubicación,
 * para que cada guardia tenga su propio pin visible y clickeable en vez de
 * quedar uno tapado detrás del otro.
 */
const spreadOverlappingPoints = <T extends { lat: number; lng: number }>(points: T[]): T[] => {
  const used = new Array(points.length).fill(false);
  const result: T[] = [];

  for (let i = 0; i < points.length; i++) {
    if (used[i]) continue;
    const cluster = [i];
    used[i] = true;
    for (let j = i + 1; j < points.length; j++) {
      if (used[j]) continue;
      if (distanceMeters(points[i], points[j]) <= OVERLAP_THRESHOLD_METERS) {
        cluster.push(j);
        used[j] = true;
      }
    }

    if (cluster.length === 1) {
      result.push(points[i]);
      continue;
    }

    cluster.forEach((idx, k) => {
      const angle = (2 * Math.PI * k) / cluster.length;
      const dLat = (OFFSET_RADIUS_METERS * Math.sin(angle)) / 111320;
      const dLng =
        (OFFSET_RADIUS_METERS * Math.cos(angle)) / (111320 * Math.cos((points[idx].lat * Math.PI) / 180));
      result.push({ ...points[idx], lat: points[idx].lat + dLat, lng: points[idx].lng + dLng });
    });
  }

  return result;
};

/** Fits the viewport to every point whenever the set of points changes. */
const FitBounds = ({ points }: { points: LiveMapPoint[] }) => {
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
