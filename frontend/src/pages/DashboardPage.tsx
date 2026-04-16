import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Map, { TruckData } from '../components/Map';
import { searchAddress } from '../api/LogisticsService';
import WeatherCard from '../components/WeatherCard';
import {
    Search,
    Loader2,
    Activity,
    ShieldCheck,
    Navigation,
    Truck as TruckIcon
} from 'lucide-react';

const DashboardPage: React.FC = () => {
    // 1. Estado de la Flota (3 camiones)
    const [trucks, setTrucks] = useState<TruckData[]>([
        { id: 'camion-1', nombre: 'Roberto Gómez', lat: 40.4168, lng: -3.7038, cargo: '85%', estado: 'En Ruta' },
        { id: 'camion-2', nombre: 'Lucía Fernández', lat: 40.4500, lng: -3.6800, cargo: '40%', estado: 'En Ruta' },
        { id: 'camion-3', nombre: 'Marcos Ruiz', lat: 40.3800, lng: -3.7200, cargo: '100%', estado: 'En Ruta' },
    ]);

    // 2. Estado de búsqueda y ubicación
    const [searchValue, setSearchValue] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [targetLocation, setTargetLocation] = useState<[number, number] | null>(null);

    // 3. Simulación de movimiento cada 3 segundos
    useEffect(() => {
        const interval = setInterval(() => {
            setTrucks((current) => current.map(t => ({
                ...t,
                lat: t.lat + (Math.random() - 0.5) * 0.005,
                lng: t.lng + (Math.random() - 0.5) * 0.005,
            })));
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchValue.trim()) return;

        setIsSearching(true);
        try {
            const result = await searchAddress(searchValue);
            if (result) {
                setTargetLocation([result.latitude, result.longitude]);
            }
        } catch (err) {
            console.error("Error buscando dirección", err);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <Layout>
            {/* Header / Search Bar */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10">
                <div className="animate-in fade-in slide-in-from-left duration-700">
                    <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
                        LogiCore <span className="text-primary italic">Live</span>
                    </h1>
                    <p className="text-slate-400 font-medium">Panel de Control de Flota y Tracking en Tiempo Real</p>
                </div>

                <form
                    onSubmit={handleSearch}
                    className="relative w-full lg:w-[450px] group animate-in fade-in slide-in-from-right duration-700"
                >
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-500 group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar dirección para centrar el mapa..."
                        className="input h-14 pl-12 pr-12 text-md bg-white/5 border-white/10 hover:border-white/20 focus:border-primary/50 transition-all rounded-2xl w-full"
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                    />
                    {isSearching && (
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                            <Loader2 className="h-5 w-5 text-primary animate-spin" />
                        </div>
                    )}
                </form>
            </div>

            {/* Main Dashboard Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">

                {/* Left Column: Stats & Fleet Info */}
                <div className="xl:col-span-1 space-y-6 animate-in fade-in slide-in-from-bottom duration-700 delay-150">

                    {/* Clima */}
                    <WeatherCard
                        lat={targetLocation ? targetLocation[0] : 40.4168}
                        lon={targetLocation ? targetLocation[1] : -3.7038}
                    />

                    {/* Resumen Flota */}
                    <div className="glass p-6 rounded-3xl border border-white/5">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-primary/20 rounded-xl text-primary">
                                <Activity size={20} />
                            </div>
                            <h3 className="font-bold text-white text-lg">Estado de Flota</h3>
                        </div>

                        <div className="space-y-4">
                            {trucks.map(truck => (
                                <div key={truck.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/[0.08] transition-all cursor-pointer group">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-primary/20 transition-colors">
                                                <TruckIcon size={18} className="text-slate-400 group-hover:text-primary" />
                                            </div>
                                            <p className="font-bold text-sm text-slate-200">{truck.nombre}</p>
                                        </div>
                                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold border border-emerald-500/20 uppercase tracking-tighter">
                                            {truck.estado}
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                        <div
                                            className="bg-primary h-full transition-all duration-500"
                                            style={{ width: truck.carga }}
                                        ></div>
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-2 font-medium">Carga Operativa: {truck.carga}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Security Info */}
                    <div className="p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-4">
                        <ShieldCheck size={32} className="text-emerald-500" />
                        <div>
                            <p className="text-sm font-bold text-slate-200 text-emerald-500">Sistema Protegido</p>
                            <p className="text-xs text-slate-400">Canal de datos encriptado AES-256</p>
                        </div>
                    </div>
                </div>

                {/* Right Column: Interactive Map */}
                <div className="xl:col-span-3 h-[650px] animate-in fade-in slide-in-from-bottom duration-1000 delay-300">
                    <div className="h-full relative overflow-hidden rounded-3xl border border-white/10 group">
                        <Map trucks={trucks} targetLocation={targetLocation} />

                        {/* Overlay Map Info */}
                        <div className="absolute top-6 right-6 z-[1000] glass px-4 py-2 rounded-xl flex items-center gap-2 pointer-events-none">
                            <Navigation size={14} className="text-primary animate-pulse" />
                            <span className="text-[10px] font-bold text-white uppercase tracking-widest">
                                40.41N, 03.70W &bull; Live Sensors
                            </span>
                        </div>
                    </div>
                </div>

            </div>
        </Layout>
    );
};

export default DashboardPage;
