import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Package,
    Truck,
    LogOut,
    Menu,
    Navigation,
    Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const [temp, setTemp] = React.useState<number | null>(null);

    const getWeatherIcon = (code: number) => {
        if (code === 0) return <Navigation size={14} className="rotate-45" />; // Alternative representation for clear
        if (code <= 3) return <Activity size={14} />;
        if (code <= 48) return <Activity size={14} className="opacity-50" />;
        if (code <= 65 || (code >= 80 && code <= 82)) return <Activity size={14} className="text-primary animate-pulse" />;
        if (code <= 75) return <Activity size={14} className="text-slate-100" />;
        return <Activity size={14} className="text-accent" />;
    };

    const [weatherCode, setWeatherCode] = React.useState<number | null>(null);

    React.useEffect(() => {
        const fetchHeaderWeather = async () => {
            try {
                const { getWeather } = await import('../api/LogisticsService');
                const data = await getWeather(40.4168, -3.7038);
                if (data) {
                    setTemp(data.temperature);
                    setWeatherCode(data.weatherCode);
                }
            } catch (e) {
                console.error("Error fetching header weather", e);
            }
        };
        fetchHeaderWeather();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-darker text-white overflow-hidden">
            {/* Sidebar */}
            <aside className="w-[240px] glass border-r border-white/5 flex flex-col z-[1002]">
                <div className="p-8 flex items-center gap-3">
                    <div className="bg-primary/20 p-2.5 rounded-2xl text-primary border border-primary/20">
                        <Navigation size={22} className="text-primary" />
                    </div>
                    <h1 className="text-xl font-extrabold tracking-tight text-white">LogiCore</h1>
                </div>

                <nav className="flex-1 px-4 space-y-1.5 mt-2">
                    <NavLink
                        to="/"
                        className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-[12px] transition-all duration-200 ${isActive ? 'bg-primary/10 text-primary border border-primary/20 shadow-lg shadow-primary/5' : 'text-text-muted hover:bg-white/5 hover:text-white'}`}
                    >
                        <LayoutDashboard size={18} />
                        <span className="text-[13px] font-semibold">Dashboard</span>
                    </NavLink>

                    <NavLink
                        to="/orders"
                        className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-[12px] transition-all duration-200 ${isActive ? 'bg-primary/10 text-primary border border-primary/20 shadow-lg shadow-primary/5' : 'text-text-muted hover:bg-white/5 hover:text-white'}`}
                    >
                        <Package size={18} />
                        <span className="text-[13px] font-semibold">Pedidos</span>
                    </NavLink>

                    <NavLink
                        to="/vehicles"
                        className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-[12px] transition-all duration-200 ${isActive ? 'bg-primary/10 text-primary border border-primary/20 shadow-lg shadow-primary/5' : 'text-text-muted hover:bg-white/5 hover:text-white'}`}
                    >
                        <Truck size={18} />
                        <span className="text-[13px] font-semibold">Flota</span>
                    </NavLink>
                </nav>

                <div className="p-6 border-t border-white/5">
                    <div className="bg-white/5 rounded-2xl p-4 mb-4 border border-white/5">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="dot-pulse"></div>
                            <span className="text-[9px] text-text-muted uppercase font-bold tracking-widest">Network Online</span>
                        </div>
                        <p className="text-xs font-semibold truncate text-slate-300">{user?.email}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-accent hover:bg-accent/10 rounded-xl transition-all font-bold text-xs"
                    >
                        <LogOut size={16} />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto relative">
                <header className="h-[72px] glass border-b border-white/5 flex items-center justify-between px-10 sticky top-0 z-[1001]">
                    <div className="flex items-center gap-4">
                        <Menu size={20} className="text-text-muted lg:hidden" />
                        <h2 className="text-md font-bold text-slate-200 tracking-tight">Intelligence Dashboard</h2>
                    </div>
                    <div className="flex items-center gap-6">
                        {temp !== null && (
                            <div className="hidden md:flex items-center gap-4 bg-white/5 px-5 py-2.5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all cursor-default group">
                                <div className="p-2 bg-primary/10 rounded-xl text-primary group-hover:bg-primary/20 transition-all">
                                    {getWeatherIcon(weatherCode || 0)}
                                </div>
                                <div className="flex flex-col items-start leading-none">
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Madrid Weather</span>
                                    <span className="text-sm font-mono font-bold text-slate-200 tracking-tighter">
                                        {temp.toFixed(1)}°C
                                    </span>
                                </div>
                            </div>
                        )}
                        <div className="bg-gradient-to-br from-white/10 to-white/5 h-10 w-10 rounded-full flex items-center justify-center border border-white/10 uppercase font-bold text-primary text-sm shadow-xl shadow-black/20">
                            {user?.email[0]}
                        </div>
                    </div>
                </header>
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
