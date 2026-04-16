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
    MapPin,
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-1">Gestión de Pedidos</h1>
                    <p className="text-text-muted">Visualiza y gestiona todas tus entregas.</p>
                </div>
                <button className="btn btn-primary px-6 h-12">
                    <Plus size={20} />
                    Nuevo Pedido
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="md:col-span-2 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por dirección, ID o cliente..."
                        className="input pl-12 h-12 mb-0"
                    />
                </div>
                <button className="btn btn-outline h-12 flex justify-center">
                    <Filter size={18} />
                    Filtros
                </button>
            </div>

            <div className="card p-0 overflow-hidden border border-white/5">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/5 text-text-muted text-xs uppercase tracking-wider">
                                <th className="px-6 py-4 font-bold">Pedido</th>
                                <th className="px-6 py-4 font-bold">Direcciones</th>
                                <th className="px-6 py-4 font-bold">Estado</th>
                                <th className="px-6 py-4 font-bold">Prioridad</th>
                                <th className="px-6 py-4 font-bold">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-text-muted">
                                        <Loader2 className="animate-spin mx-auto mb-2" size={32} />
                                        Cargando pedidos...
                                    </td>
                                </tr>
                            ) : orders.map(order => (
                                <tr key={order.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                                <Package size={20} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm">#{order.id.slice(0, 8)}</p>
                                                <p className="text-xs text-text-muted flex items-center gap-1">
                                                    <Clock size={12} /> {new Date(order.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="space-y-1">
                                            <p className="text-sm truncate max-w-[200px] flex items-center gap-2">
                                                <MapPin size={14} className="text-text-muted" />
                                                <span className="font-medium">Origen:</span> {order.pickup_address}
                                            </p>
                                            <p className="text-sm truncate max-w-[200px] flex items-center gap-2">
                                                <MapPin size={14} className="text-primary" />
                                                <span className="font-medium">Destino:</span> {order.delivery_address}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`badge badge-${order.status}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-1">
                                            {[...Array(5)].map((_, i) => (
                                                <div key={i} className={`h-1 w-4 rounded-full ${i < (11 - order.priority) / 2 ? 'bg-primary' : 'bg-white/10'}`}></div>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        {order.status === 'pending' ? (
                                            <button
                                                onClick={() => handleDispatch(order.id)}
                                                disabled={dispatching === order.id}
                                                className="btn btn-primary py-2 px-4 shadow-none"
                                            >
                                                {dispatching === order.id ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                                                Despachar
                                            </button>
                                        ) : (
                                            <button className="btn btn-outline p-2">
                                                <MoreVertical size={16} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {!loading && orders.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-text-muted italic">
                                        No hay pedidos registrados
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
