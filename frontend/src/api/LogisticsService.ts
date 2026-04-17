import axios from 'axios';

/**
 * LogisticsService
 * Proporciona utilidades para geocodificación, cálculo de distancias y clima.
 */

// Fórmula de Haversine para calcular distancia entre dos puntos (en km)
export const calculateHaversineDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// Geocodificación gratuita con OpenStreetMap (Nominatim)
export const searchAddress = async (address: string) => {
    try {
        const response = await axios.get(
            `https://nominatim.openstreetmap.org/search`,
            {
                params: {
                    q: address,
                    format: 'json',
                    limit: 1,
                },
            }
        );
        if (response.data && response.data.length > 0) {
            const { lat, lon, display_name } = response.data[0];
            return {
                latitude: parseFloat(lat),
                longitude: parseFloat(lon),
                displayName: display_name,
            };
        }
        return null;
    } catch (error) {
        console.error('Error en geocodificación:', error);
        throw error;
    }
};

// Integración con Open-Meteo API (Gratuita, sin API Key)
export const getWeather = async (lat: number, lon: number) => {
    try {
        const response = await axios.get(`https://api.open-meteo.com/v1/forecast`, {
            params: {
                latitude: lat,
                longitude: lon,
                current_weather: true,
            },
        });

        if (response.data && response.data.current_weather) {
            const current = response.data.current_weather;
            return {
                temperature: current.temperature,
                description: getWeatherDescription(current.weathercode),
                weatherCode: current.weathercode,
                icon: null,
                humidity: null,
                windSpeed: current.windspeed,
            };
        }
        return null;
    } catch (error) {
        console.error('Error al obtener el clima:', error);
        throw error;
    }
};

// Traducción de códigos WMO de Open-Meteo
const getWeatherDescription = (code: number): string => {
    const codes: Record<number, string> = {
        0: 'Cielo despejado',
        1: 'Principalmente despejado', 2: 'Parcialmente nublado', 3: 'Nublado',
        45: 'Niebla', 48: 'Niebla de escarcha',
        51: 'Llovizna ligera', 53: 'Llovizna moderada', 55: 'Llovizna densa',
        61: 'Lluvia ligera', 63: 'Lluvia moderada', 65: 'Lluvia fuerte',
        71: 'Nieve ligera', 73: 'Nieve moderada', 75: 'Nieve fuerte',
        80: 'Chubascos ligeros', 81: 'Chubascos moderados', 82: 'Chubascos violentos',
        95: 'Tormenta', 96: 'Tormenta con granizo ligero', 99: 'Tormenta con granizo fuerte',
    };
    return codes[code] || 'Clima variable';
};

const LogisticsService = {
    calculateHaversineDistance,
    searchAddress,
    getWeather,
};

export default LogisticsService;
