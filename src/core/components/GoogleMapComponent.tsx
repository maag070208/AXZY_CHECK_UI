import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps';

interface GoogleMapComponentProps {
    lat: number;
    lng: number;
    zoom?: number;
    height?: string;
    className?: string;
}

export const GoogleMapComponent = ({ 
    lat, 
    lng, 
    zoom = 15, 
    height = "300px",
    className = "" 
}: GoogleMapComponentProps) => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
        return (
            <div className="flex items-center justify-center bg-slate-100 rounded-xl border border-slate-200 text-slate-400 text-sm italic" style={{ height }}>
                Google Maps API Key no configurada
            </div>
        );
    }

    return (
        <div className={`rounded-xl overflow-hidden border border-slate-200 shadow-sm ${className}`} style={{ height }}>
            <APIProvider apiKey={apiKey}>
                <Map
                    defaultCenter={{ lat, lng }}
                    defaultZoom={zoom}
                    gestureHandling={'greedy'}
                    disableDefaultUI={false}
                >
                    <Marker position={{ lat, lng }} />
                </Map>
            </APIProvider>
        </div>
    );
};
