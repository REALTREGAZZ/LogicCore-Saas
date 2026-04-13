import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Map from '../components/Map';
import { trackingApi } from '../api/tracking';
import { ordersApi } from '../api/orders';
import { useWebSocket } from '../hooks/useWebSocket';
import {
    Users,
    Package,
    CheckCircle2,
    AlertCircle,
    TrendingUp
} from 'lucide-react';

const DashboardPage: React.FC = () => {
    const [drivers, setDrivers] = useState<any[]>([]);
    const [stats, setStats] = useState({
        total: 0,
        delivered: 0,
        transit: 0,
        incidents: 0
    });

    const fetchData = async () => {
        try {
            const positions = await trackingApi.getLivePositions();
            setDrivers(positions);

            const orders = await ordersApi.list();
            setStats({
                total: orders.length,
                delivered: orders.filter((o: any) => o.status === 'delivered').length,
                transit: orders.filter((o: any) => o.status === 'in_transit').length,
                incidents: orders.filter((o: any) => o.status === 'incident').length
            });
        } catch (err) {
            console.error("Dashboard data fetch failed", err);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Handle incoming real-time GPS updates from WebSocket
    useWebSocket((data) => {
        if (data.type === 'gps_update') {
            setDrivers(prev => {
                const index = prev.findIndex(d => d.driver_id === data.driver_id);
                if (index !== -1) {
                    const updated = [...prev];
                    updated[index] = { ...updated[index], ...data };
                    return updated;
                }
                return [...prev, data];
            });
        }
    });

    return (
        <Layout>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Total Pedidos" value={stats.total} icon={<Package className="text-primary" />} trend="+12%" />
                <StatCard title="En Tránsito" value={stats.transit} icon={<TrendingUp className="text-blue-400" />} trend="86%" />
                <StatCard title="Entregados" value={stats.delivered} icon={<CheckCircle2 className="text-success" />} trend="94%" />
                <StatCard title="Incidencias" value={stats.incidents} icon={<AlertCircle className="text-accent" />} trend="0%" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 card p-0 overflow-hidden min-h-[500px]">
                    <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                        <h3 className="font-bold flex items-center gap-2">
                            <Users size={20} className="text-primary" />
                            Tracking de Flota en Tiempo Real
                        </h3>
                        <span className="flex items-center gap-2 text-xs font-bold text-success bg-success/10 px-3 py-1 rounded-full border border-success/20 animate-pulse">
                            LIVE
                        </span>
                    </div>
                    <div className="h-[436px]">
                        <Map drivers={drivers} />
                    </div>
                </div>

                <div className="card space-y-6">
                    <h3 className="font-bold border-b border-white/5 pb-4">Actividad Reciente</h3>
                    <div className="space-y-4">
                        {drivers.slice(0, 5).map(d => (
                            <div key={d.driver_id} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5">
                                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                    {d.driver_id[0]}
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Driver {d.driver_id.split('-')[0]}</p>
                                    <p className="text-xs text-text-muted">Velocidad: {d.speed_kmh?.toFixed(1) || 0} km/h</p>
                                </div>
                            </div>
                        ))}
                        {drivers.length === 0 && (
                            <div className="text-center py-8 text-text-muted italic">
                                No hay conductores activos
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

const StatCard: React.FC<{ title: string; value: number | string; icon: React.ReactNode; trend: string }> = ({ title, value, icon, trend }) => (
    <div className="card group hover:border-primary/30 transition-all hover:bg-white/5">
        <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-primary/20 transition-all text-2xl">
                {icon}
            </div>
            <span className="text-xs font-bold px-2 py-1 bg-white/5 rounded-lg text-text-muted">{trend}</span>
        </div>
        <p className="text-text-muted font-medium text-sm">{title}</p>
        <h4 className="text-3xl font-bold mt-1">{value}</h4>
    </div>
);

export default DashboardPage;
