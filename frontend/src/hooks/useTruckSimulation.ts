import { useState, useEffect } from 'react';

export interface SimulatedTruck {
    driver_id: string;
    driver_name: string;
    latitude: number;
    longitude: number;
    speed_kmh: number;
    cargo: string;
    targetLat: number;
    targetLon: number;
}

const INITIAL_TRUCKS: SimulatedTruck[] = [
    {
        driver_id: 'sim-1',
        driver_name: 'Carlos Rodríguez',
        latitude: 40.4168,
        longitude: -3.7038,
        speed_kmh: 45,
        cargo: 'Componentes Electrónicos',
        targetLat: 40.4500,
        targetLon: -3.6800,
    },
    {
        driver_id: 'sim-2',
        driver_name: 'Elena Martínez',
        latitude: 40.4000,
        longitude: -3.7200,
        speed_kmh: 38,
        cargo: 'Productos Farmacéuticos',
        targetLat: 40.3800,
        targetLon: -3.7500,
    },
    {
        driver_id: 'sim-3',
        driver_name: 'Javier López',
        latitude: 40.4300,
        longitude: -3.6500,
        speed_kmh: 52,
        cargo: 'Mobiliario de Oficina',
        targetLat: 40.4800,
        targetLon: -3.6000,
    },
];

export const useTruckSimulation = () => {
    const [trucks, setTrucks] = useState<SimulatedTruck[]>(INITIAL_TRUCKS);

    useEffect(() => {
        const interval = setInterval(() => {
            setTrucks((prevTrucks) =>
                prevTrucks.map((truck) => {
                    // Update position slightly towards target
                    const step = 0.002; // Roughly 200m per update
                    const dLat = truck.targetLat - truck.latitude;
                    const dLon = truck.targetLon - truck.longitude;
                    const distance = Math.sqrt(dLat * dLat + dLon * dLon);

                    if (distance < step) {
                        // Reached target, pick a new random one within ~5km
                        return {
                            ...truck,
                            latitude: truck.targetLat,
                            longitude: truck.targetLon,
                            targetLat: truck.targetLat + (Math.random() - 0.5) * 0.05,
                            targetLon: truck.targetLon + (Math.random() - 0.5) * 0.05,
                            speed_kmh: 30 + Math.random() * 30,
                        };
                    }

                    return {
                        ...truck,
                        latitude: truck.latitude + (dLat / distance) * step,
                        longitude: truck.longitude + (dLon / distance) * step,
                        speed_kmh: truck.speed_kmh + (Math.random() - 0.5) * 5, // Slight speed variation
                    };
                })
            );
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    return trucks;
};
