import React, { useEffect, useState } from 'react';
import { Cloud, Wind, Droplets, Loader2, AlertCircle } from 'lucide-react';
import { getWeather } from '../api/LogisticsService';

interface WeatherData {
    temperature: number;
    description: string;
    icon: string;
    humidity: number;
    windSpeed: number;
}

interface WeatherCardProps {
    lat: number;
    lon: number;
}

const WeatherCard: React.FC<WeatherCardProps> = ({ lat, lon }) => {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchWeather = async () => {
            setLoading(true);
            setError(false);
            try {
                const data = await getWeather(lat, lon);
                setWeather(data);
            } catch (err) {
                console.error("Error fetching weather", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchWeather();
    }, [lat, lon]);

    if (loading) {
        return (
            <div className="bg-white/5 border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[160px]">
                <Loader2 size={32} className="text-primary animate-spin mb-2" />
                <p className="text-sm text-text-muted">Cargando clima...</p>
            </div>
        );
    }

    if (error || !weather) {
        return (
            <div className="bg-white/5 border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                <AlertCircle size={32} className="text-accent mb-2" />
                <p className="text-sm text-text-muted">Error al obtener el clima.</p>
            </div>
        );
    }

    return (
        <div className="bg-white/5 border border-primary/20 rounded-2xl p-6 shadow-xl shadow-primary/5 hover:border-primary/40 transition-all">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Clima actual</h4>
                    <p className="text-sm font-medium">{weather.description}</p>
                </div>
                <div className="bg-primary/10 p-2 rounded-xl text-primary">
                    <Cloud size={24} />
                </div>
            </div>

            <div className="flex items-center gap-4 mb-6">
                <div className="text-4xl font-bold">{weather.temperature}°C</div>
                <div className="flex flex-col gap-1">
                    {weather.humidity !== null && (
                        <div className="flex items-center gap-1 text-xs text-text-muted">
                            <Droplets size={12} /> {weather.humidity}%
                        </div>
                    )}
                    <div className="flex items-center gap-1 text-xs text-text-muted">
                        <Wind size={12} /> {weather.windSpeed} km/h
                    </div>
                </div>
            </div>

            <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                <div
                    className="bg-primary h-full transition-all duration-1000"
                    style={{ width: `${Math.min(Math.max((weather.temperature / 45) * 100, 0), 100)}%` }}
                ></div>
            </div>
        </div>
    );
};

export default WeatherCard;
