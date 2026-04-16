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

// Integración con WeatherStack API
export const getWeather = async (lat: number, lon: number, apiKey: string) => {
    try {
        const response = await axios.get(`http://api.weatherstack.com/current`, {
            params: {
                access_key: apiKey,
                query: `${lat},${lon}`,
            },
        });

        if (response.data && response.data.current) {
            return {
                temperature: response.data.current.temperature,
                description: response.data.current.weather_descriptions[0],
                icon: response.data.current.weather_icons[0],
                humidity: response.data.current.humidity,
                windSpeed: response.data.current.wind_speed,
            };
        }
        return null;
    } catch (error) {
        console.error('Error al obtener el clima:', error);
        throw error;
    }
};

const LogisticsService = {
    calculateHaversineDistance,
    searchAddress,
    getWeather,
};

export default LogisticsService;
