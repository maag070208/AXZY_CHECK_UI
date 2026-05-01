import { APIProvider, Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';
import { useEffect } from 'react';

interface GoogleMapComponentProps {
    lat: number;
    lng: number;
    zoom?: number;
    height?: string;
    className?: string;
    onLocationSelect?: (lat: number, lng: number) => void;
    isEditable?: boolean;
}

// Sub-component to handle map centering when props change
const MapHandler = ({ lat, lng }: { lat: number; lng: number }) => {
    const map = useMap();
    useEffect(() => {
        if (map) {
            map.panTo({ lat, lng });
        }
    }, [lat, lng, map]);
    return null;
};

export const GoogleMapComponent = ({ 
    lat, 
    lng, 
    zoom = 15, 
    height = "300px",
    className = "",
    onLocationSelect,
    isEditable = false
}: GoogleMapComponentProps) => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyBEcey4scuaufZ6TD4oOZZKjO';

    if (!apiKey) {
        return (
            <div className="flex items-center justify-center bg-slate-100 rounded-xl border border-slate-200 text-slate-400 text-sm italic" style={{ height }}>
                Google Maps API Key no configurada
            </div>
        );
    }

    const handleMapClick = (e: any) => {
        if (isEditable && onLocationSelect && e.detail.latLng) {
            onLocationSelect(e.detail.latLng.lat, e.detail.latLng.lng);
        }
    };

    const handleMarkerDragEnd = (e: any) => {
        if (isEditable && onLocationSelect && e.latLng) {
            const lat = typeof e.latLng.lat === 'function' ? e.latLng.lat() : e.latLng.lat;
            const lng = typeof e.latLng.lng === 'function' ? e.latLng.lng() : e.latLng.lng;
            onLocationSelect(lat, lng);
        }
    };

    return (
        <div className={`rounded-xl overflow-hidden border border-slate-200 shadow-sm ${className}`} style={{ height }}>
            <APIProvider apiKey={apiKey}>
                <Map
                    defaultCenter={{ lat, lng }}
                    defaultZoom={zoom}
                    gestureHandling={'greedy'}
                    disableDefaultUI={false}
                    onClick={handleMapClick}
                    mapId="bf3fcca21542f575"
                >
                    <AdvancedMarker 
                        position={{ lat, lng }} 
                        draggable={isEditable}
                        onDragEnd={handleMarkerDragEnd}
                    >
                        <Pin background={'#10b981'} glyphColor={'#fff'} borderColor={'#064e3b'} />
                    </AdvancedMarker>
                    <MapHandler lat={lat} lng={lng} />
                </Map>
            </APIProvider>
        </div>
    );
};
