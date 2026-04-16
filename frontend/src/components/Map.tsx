import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Truck } from 'lucide-react';
import { renderToString } from 'react-dom/server';

// Fix for default marker icons (in case they are used somewhere)
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Truck Icon using Lucide
const createTruckIcon = (color: string) => {
    const iconHtml = renderToString(
        <div style={{ color: color, filter: 'drop-shadow(0 0 8px rgba(0,0,0,0.5))' }}>
            <Truck size={32} />
        </div>
    );
    return L.divIcon({
        html: iconHtml,
        className: 'custom-truck-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
    });
};

const TRUCK_ICONS = {
    'camion-1': createTruckIcon('#3b82f6'), // Blue
    'camion-2': createTruckIcon('#10b981'), // Green
    'camion-3': createTruckIcon('#f59e0b'), // Amber
};

// Map Controller for smooth transitions
const MapController: React.FC<{ target: [number, number] | null }> = ({ target }) => {
    const map = useMap();

    useEffect(() => {
        if (target) {
            map.flyTo(target, 14, { duration: 1.5 });
        }
    }, [target, map]);

    return null;
};

export interface TruckData {
    id: string;
    nombre: string;
    lat: number;
    lng: number;
    carga: string;
    estado: string;
}

interface MapProps {
    trucks: TruckData[];
    targetLocation: [number, number] | null;
}

const Map: React.FC<MapProps> = ({ trucks, targetLocation }) => {
    return (
        <div className="h-full w-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative">
            <MapContainer
                center={[40.4168, -3.7038]}
                zoom={12}
                zoomControl={false}
                style={{ height: '100%', width: '100%', background: '#0a0a0a' }}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; OpenStreetMap &copy; CARTO'
                />

                <MapController target={targetLocation} />

                {/* Marcadores de Camiones */}
                {trucks.map((truck) => (
                    <Marker
                        key={truck.id}
                        position={[truck.lat, truck.lng]}
                        icon={TRUCK_ICONS[truck.id as keyof typeof TRUCK_ICONS] || createTruckIcon('#ffffff')}
                    >
                        <Popup className="custom-popup">
                            <div className="p-1 min-w-[140px] text-slate-800">
                                <h4 className="font-bold border-b border-slate-200 pb-1 mb-2 text-primary">
                                    Conductor: {truck.nombre}
                                </h4>
                                <div className="space-y-1 text-sm font-medium">
                                    <p className="flex justify-between">
                                        <span className="text-slate-500">Estado:</span>
                                        <span className="text-emerald-600 font-bold">{truck.estado}</span>
                                    </p>
                                    <p className="flex justify-between">
                                        <span className="text-slate-500">Carga:</span>
                                        <span className="text-blue-600 font-bold">{truck.carga}</span>
                                    </p>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {/* Marcador de Búsqueda */}
                {targetLocation && (
                    <Marker position={targetLocation}>
                        <Popup>Ubicación encontrada</Popup>
                    </Marker>
                )}
            </MapContainer>
        </div>
    );
};

export default Map;
