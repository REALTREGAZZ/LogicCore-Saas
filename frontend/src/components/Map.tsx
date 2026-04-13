import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface DriverPos {
    driver_id: string;
    latitude: float;
    longitude: float;
    speed_kmh?: float;
}

interface MapProps {
    drivers: DriverPos[];
    center?: [number, number];
    zoom?: number;
}

const Map: React.FC<MapProps> = ({ drivers, center = [40.4168, -3.7038], zoom = 13 }) => {
    return (
        <div className="h-full w-full rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
            <MapContainer
                center={center}
                zoom={zoom}
                style={{ height: '100%', width: '100%', background: '#020617' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                {drivers.map((d) => (
                    <Marker key={d.driver_id} position={[d.latitude, d.longitude]}>
                        <Popup>
                            <div className="text-darker">
                                <p className="font-bold">Conductor: {d.driver_id.split('-')[0]}</p>
                                <p>Velocidad: {d.speed_kmh?.toFixed(1) || '0'} km/h</p>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

export default Map;
