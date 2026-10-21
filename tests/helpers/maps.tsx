import type { ReactNode } from "react";
import { vi } from "vitest";

/** Últimas props que recibió cada pieza del mapa, para que las pruebas disparen clic/arrastre. */
export const mapProbe: {
  map?: Record<string, any>;
  /** Último marcador renderizado. */
  marker?: Record<string, any>;
  /** Todos los marcadores del último render del mapa, en orden. */
  markers: Record<string, any>[];
  info?: Record<string, any>;
  polyline?: Record<string, any>;
  panTo: ReturnType<typeof vi.fn>;
  fitBounds: ReturnType<typeof vi.fn>;
  setZoom: ReturnType<typeof vi.fn>;
  extend: ReturnType<typeof vi.fn>;
  hasMap: boolean;
} = { markers: [], panTo: vi.fn(), fitBounds: vi.fn(), setZoom: vi.fn(), extend: vi.fn(), hasMap: true };

export const resetMapProbe = () => {
  mapProbe.map = undefined;
  mapProbe.marker = undefined;
  mapProbe.markers = [];
  mapProbe.info = undefined;
  mapProbe.polyline = undefined;
  mapProbe.panTo = vi.fn();
  mapProbe.fitBounds = vi.fn();
  mapProbe.setZoom = vi.fn();
  mapProbe.extend = vi.fn();
  mapProbe.hasMap = true;
};

/** `google.maps` mínimo para los componentes que arman límites. */
export const installGoogleStub = () => {
  (globalThis as any).google = {
    maps: {
      LatLngBounds: class {
        extend(p: unknown) {
          mapProbe.extend(p);
        }
      },
    },
  };
};

/** Sustituto de `@vis.gl/react-google-maps`: sin red ni API key. */
export const mapsModule = {
  APIProvider: ({ children, apiKey }: { children: ReactNode; apiKey: string }) => (
    <div data-testid="maps-provider" data-key={apiKey}>{children}</div>
  ),
  Map: ({ children, ...props }: { children: ReactNode } & Record<string, any>) => {
    mapProbe.map = props;
    mapProbe.markers = [];
    mapProbe.info = undefined;
    mapProbe.polyline = undefined;
    return <div data-testid="map">{children}</div>;
  },
  AdvancedMarker: ({ children, ...props }: { children: ReactNode } & Record<string, any>) => {
    mapProbe.marker = props;
    mapProbe.markers.push(props);
    return <div data-testid="marker">{children}</div>;
  },
  InfoWindow: ({ children, ...props }: { children: ReactNode } & Record<string, any>) => {
    mapProbe.info = props;
    return <div data-testid="info-window">{children}</div>;
  },
  Polyline: (props: Record<string, any>) => {
    mapProbe.polyline = props;
    return null;
  },
  Pin: (props: Record<string, any>) => <span data-testid="pin" data-glyph={props.glyph} data-bg={props.background} />,
  useMap: () => (mapProbe.hasMap ? { panTo: mapProbe.panTo, fitBounds: mapProbe.fitBounds, setZoom: mapProbe.setZoom } : null),
};
