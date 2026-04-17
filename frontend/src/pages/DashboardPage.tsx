import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Map, { type TruckData } from '../components/Map';
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
        { id: 'camion-1', nombre: 'Roberto Gómez', lat: 40.4168, lng: -3.7038, carga: '85%', estado: 'En Ruta' },
        { id: 'camion-2', nombre: 'Lucía Fernández', lat: 40.4500, lng: -3.6800, carga: '40%', estado: 'En Ruta' },
        { id: 'camion-3', nombre: 'Marcos Ruiz', lat: 40.3800, lng: -3.7200, carga: '100%', estado: 'En Ruta' },
    ]);

    // 2. Estado de búsqueda y ubicación
    const [searchValue, setSearchValue] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [targetLocation, setTargetLocation] = useState<[number, number] | null>(null);
    const [hoveredTruck, setHoveredTruck] = useState<string | null>(null);

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
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-12">
                <div className="animate-in fade-in slide-in-from-left duration-1000">
                    <h1 className="text-5xl font-extrabold tracking-tight text-white mb-3">
                        LogiCore <span className="text-primary italic">Intelligence</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-lg">Central de Inteligencia Logística y Monitoreo Global</p>
                </div>

                <form
                    onSubmit={handleSearch}
                    className="relative w-full lg:w-[480px] group animate-in fade-in slide-in-from-right duration-1000"
                >
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-500 group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar dirección para centrar el mapa..."
                        className="input h-16 pl-14 pr-14 text-md bg-white/5 border-white/10 hover:border-white/20 focus:border-primary/50 transition-all rounded-2xl w-full"
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                    />
                    {isSearching && (
                        <div className="absolute inset-y-0 right-0 pr-5 flex items-center">
                            <Loader2 className="h-5 w-5 text-primary animate-spin" />
                        </div>
                    )}
                </form>
            </div>

            {/* KPI Ribbon */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 animate-in fade-in slide-in-from-bottom duration-700 delay-100">
                <div className="glass p-7 rounded-[24px] border border-white/5 flex items-center gap-5 hover:bg-white/5 transition-colors cursor-default group">
                    <div className="p-4 bg-primary/10 rounded-2xl text-primary group-hover:bg-primary/20 transition-all">
                        <TruckIcon size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-1">Pedidos en Ruta</p>
                        <p className="text-3xl font-black text-white">24</p>
                    </div>
                </div>
                <div className="glass p-7 rounded-[24px] border border-white/5 flex items-center gap-5 hover:bg-white/5 transition-colors cursor-default group">
                    <div className="p-4 bg-amber-500/10 rounded-2xl text-amber-500 group-hover:bg-amber-500/20 transition-all">
                        <Activity size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-1">Alertas Activas</p>
                        <p className="text-3xl font-black text-white text-amber-500">03</p>
                    </div>
                </div>
                <div className="glass p-7 rounded-[24px] border border-white/5 flex items-center gap-5 hover:bg-white/5 transition-colors cursor-default group">
                    <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-500 group-hover:bg-emerald-500/20 transition-all">
                        <ShieldCheck size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-1">Eficiencia Flota</p>
                        <p className="text-3xl font-black text-white text-emerald-400">92.4%</p>
                    </div>
                </div>
                <div className="glass p-7 rounded-[24px] border border-white/5 flex items-center gap-5 hover:bg-white/5 transition-colors cursor-default group">
                    <div className="p-4 bg-primary/10 rounded-2xl text-primary group-hover:bg-primary/20 transition-all">
                        <Navigation size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-1">Entregas Hoy</p>
                        <p className="text-3xl font-black text-white">142</p>
                    </div>
                </div>
            </div>

            {/* Main Dashboard Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-10">

                {/* Left Column: Stats & Fleet Info */}
                <div className="xl:col-span-1 space-y-8 animate-in fade-in slide-in-from-bottom duration-1000 delay-200">

                    {/* Clima */}
                    <WeatherCard
                        lat={targetLocation ? targetLocation[0] : 40.4168}
                        lon={targetLocation ? targetLocation[1] : -3.7038}
                    />

                    {/* Resumen Flota */}
                    <div className="glass p-8 rounded-[32px] border border-white/5 overflow-hidden transition-all duration-500">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <Activity size={20} className="text-primary" />
                                <h3 className="font-extrabold text-white text-xl tracking-tight">Drivers Online</h3>
                            </div>
                            <span className="text-[10px] bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20 font-black uppercase tracking-widest">
                                Live
                            </span>
                        </div>

                        <div className="space-y-5">
                            {trucks.map(truck => (
                                <div
                                    key={truck.id}
                                    onMouseEnter={() => setHoveredTruck(truck.id)}
                                    onMouseLeave={() => setHoveredTruck(null)}
                                    className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer group ${hoveredTruck === truck.id ? 'bg-white/10 border-primary/30' : 'bg-white/5 border-white/5 hover:bg-white/[0.08]'}`}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <div className="bg-slate-800 p-2.5 rounded-xl group-hover:bg-primary/20 transition-colors">
                                                    <TruckIcon size={20} className={hoveredTruck === truck.id ? 'text-primary' : 'text-slate-400'} />
                                                </div>
                                                <div className="absolute -top-1 -right-1">
                                                    <div className="dot-pulse"></div>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="font-extrabold text-sm text-slate-100">{truck.nombre}</p>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">ID: {truck.id.split('-')[1]}</p>
                                            </div>
                                        </div>
                                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-black border uppercase tracking-tighter ${truck.estado === 'En Ruta' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                                            {truck.estado}
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-900/50 h-2 rounded-full overflow-hidden border border-white/5">
                                        <div
                                            className="bg-primary h-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                                            style={{ width: truck.carga }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between mt-3">
                                        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">Carga Operativa</p>
                                        <p className="text-[11px] text-primary font-black">{truck.carga}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {trucks.length === 0 && (
                            <div className="py-12 flex flex-col items-center justify-center text-center opacity-50">
                                <Activity size={48} className="text-slate-500 mb-4 animate-pulse" />
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No hay conductores en línea</p>
                            </div>
                        )}
                    </div>

                    {/* Security Info */}
                    <div className="p-8 rounded-[32px] bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-6 group hover:bg-emerald-500/10 transition-all duration-500">
                        <div className="p-4 bg-emerald-500/20 rounded-2xl text-emerald-500 group-hover:scale-110 transition-transform">
                            <ShieldCheck size={32} />
                        </div>
                        <div>
                            <p className="text-lg font-black text-emerald-500 tracking-tight">Sistema Protegido</p>
                            <p className="text-xs text-slate-400 font-medium">Cifrado de grado militar activo</p>
                        </div>
                    </div>
                </div>

                {/* Right Column: Interactive Map */}
                <div className="xl:col-span-3 h-[750px] animate-in fade-in slide-in-from-bottom duration-1000 delay-300">
                    <div className="h-full relative overflow-hidden rounded-[40px] border border-white/10 group shadow-2xl shadow-black/50">
                        <Map trucks={trucks} targetLocation={targetLocation} />

                        {/* Overlay Map Info */}
                        <div className="absolute top-8 right-8 z-[1000] glass px-6 py-3 rounded-2xl flex items-center gap-3 pointer-events-none border border-white/10 shadow-2xl">
                            <Navigation size={16} className="text-primary animate-pulse" />
                            <span className="text-[11px] font-black text-white uppercase tracking-[0.3em]">
                                40.41N, 03.70W &bull; SENSOR: ACTIVE
                            </span>
                        </div>

                        {/* Map Footer Fade */}
                        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-darker to-transparent pointer-events-none z-[1000]"></div>
                    </div>
                </div>

            </div>
        </Layout>
    );
};

export default DashboardPage;
