import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { ordersApi } from '../api/orders';
import {
    Package,
    Search,
    Plus,
    Filter,
    MoreVertical,
    Clock,
    Send,
    Loader2
} from 'lucide-react';

const OrdersPage: React.FC = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [dispatching, setDispatching] = useState<string | null>(null);

    const fetchOrders = async () => {
        try {
            const data = await ordersApi.list();
            setOrders(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleDispatch = async (id: string) => {
        setDispatching(id);
        try {
            await ordersApi.dispatch(id);
            await fetchOrders();
        } catch (err: any) {
            alert(err.response?.data?.detail || "Error al despachar");
        } finally {
            setDispatching(null);
        }
    };

    return (
        <Layout>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12 animate-in fade-in slide-in-from-top duration-1000">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-white">Gestión de Pedidos</h1>
                    <p className="text-slate-500 font-medium">Control operativo y seguimiento de despachos en tiempo real</p>
                </div>
                <button className="btn btn-primary h-14 px-8 rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/40">
                    <Plus size={22} />
                    <span className="text-[13px] font-black uppercase tracking-widest">Nuevo Pedido</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10 animate-in fade-in slide-in-from-bottom duration-700 delay-100">
                <div className="md:col-span-3 relative group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Filtrar por ID, dirección o cliente..."
                        className="input pl-14 h-16 mb-0 bg-white/5 border-white/5 focus:border-primary/50 text-md rounded-2xl"
                    />
                </div>
                <button className="btn btn-outline h-16 flex justify-center rounded-2xl gap-3 border-white/5 hover:bg-white/5 transition-all">
                    <Filter size={20} className="text-text-muted" />
                    <span className="text-[12px] font-bold uppercase tracking-wider">Filtros Avanzados</span>
                </button>
            </div>

            <div className="glass overflow-hidden border border-white/5 shadow-2xl animate-in fade-in slide-in-from-bottom duration-1000 delay-200">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/5 text-text-muted text-[10px] uppercase font-black tracking-[0.2em] border-b border-white/5">
                                <th className="px-8 py-6">ID Pedido / Fecha</th>
                                <th className="px-8 py-6">Ruta Logística</th>
                                <th className="px-8 py-6">Estado</th>
                                <th className="px-8 py-6">Prioridad</th>
                                <th className="px-8 py-6 text-right">Operación</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-24 text-center">
                                        <div className="flex flex-col items-center">
                                            <Loader2 className="animate-spin text-primary mb-4" size={48} />
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Sincronizando base de datos...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : orders.map(order => (
                                <tr key={order.id} className="hover:bg-white/[0.04] transition-all group">
                                    <td className="px-8 py-8">
                                        <div className="flex items-center gap-5">
                                            <div className="bg-primary/10 p-3 rounded-2xl text-primary border border-primary/20 group-hover:bg-primary/20 transition-all">
                                                <Package size={24} />
                                            </div>
                                            <div>
                                                <p className="font-black text-sm text-white tracking-tight">#{order.id.slice(0, 8).toUpperCase()}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Clock size={12} className="text-slate-600" />
                                                    <p className="text-[11px] font-bold text-slate-500">
                                                        {new Date(order.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-8">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-2 h-2 rounded-full bg-slate-700"></div>
                                                <p className="text-xs text-slate-400 font-medium truncate max-w-[200px]">{order.pickup_address}</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                                                <p className="text-xs text-slate-100 font-bold truncate max-w-[200px]">{order.delivery_address}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-8">
                                        <span className={`badge badge-${order.status} scale-110 origin-left`}>
                                            <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                                            {order.status === 'in_transit' ? 'En Ruta' : order.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-8">
                                        <div className="flex items-center gap-1.5">
                                            {[...Array(5)].map((_, i) => (
                                                <div key={i} className={`h-1.5 w-6 rounded-full transition-all duration-500 ${i < (11 - order.priority) / 2 ? 'bg-primary shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'bg-white/5'}`}></div>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-8 py-8 text-right">
                                        {order.status === 'pending' ? (
                                            <button
                                                onClick={() => handleDispatch(order.id)}
                                                disabled={dispatching === order.id}
                                                className="btn btn-primary py-2 px-6 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-primary/10"
                                            >
                                                {dispatching === order.id ? <Loader2 className="animate-spin" size={16} /> : <Send size={14} />}
                                                Despachar
                                            </button>
                                        ) : (
                                            <button className="p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all text-slate-400 hover:text-white">
                                                <MoreVertical size={18} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {!loading && orders.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-8 py-32 text-center">
                                        <div className="flex flex-col items-center justify-center opacity-40">
                                            <div className="p-10 bg-white/5 rounded-full mb-6 border border-white/5">
                                                <Package size={64} className="text-slate-500" />
                                            </div>
                                            <h3 className="text-2xl font-black text-white mb-2">Todo en orden por aquí</h3>
                                            <p className="text-sm font-medium text-slate-400 max-w-[300px] leading-relaxed">
                                                No hay nuevos pedidos pendientes de despacho. ¡Buen trabajo!
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
};

export default OrdersPage;
