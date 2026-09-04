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
export const LiveGuardsMap = ({ points, height = '360px', className = '' }: LiveGuardsMapProps) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyBEcey4scuaufZ6TD4oOZZKjO';
  const [activePoint, setActivePoint] = useState<LiveMapPoint | null>(null);

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
