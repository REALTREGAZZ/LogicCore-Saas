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

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-darker text-white overflow-hidden">
            {/* Sidebar */}
            <aside className="w-[260px] glass border-r border-white/5 flex flex-col">
                <div className="p-6 flex items-center gap-3">
                    <div className="bg-primary p-2 rounded-lg">
                        <Navigation size={24} className="text-white" />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight">LogiCore</h1>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4">
                    <NavLink
                        to="/"
                        className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-muted hover:bg-white/5 hover:text-white'}`}
                    >
                        <LayoutDashboard size={20} />
                        <span className="font-medium">Dashboard</span>
                    </NavLink>

                    <NavLink
                        to="/orders"
                        className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-muted hover:bg-white/5 hover:text-white'}`}
                    >
                        <Package size={20} />
                        <span className="font-medium">Pedidos</span>
                    </NavLink>

                    <NavLink
                        to="/vehicles"
                        className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-muted hover:bg-white/5 hover:text-white'}`}
                    >
                        <Truck size={20} />
                        <span className="font-medium">Flota</span>
                    </NavLink>
                </nav>

                <div className="p-4 border-t border-white/5">
                    <div className="bg-white/5 rounded-xl p-4 mb-4">
                        <div className="flex items-center gap-2 mb-1">
                            <Activity size={14} className="text-success" />
                            <span className="text-xs text-text-muted uppercase font-bold tracking-wider">Sistema Online</span>
                        </div>
                        <p className="text-sm font-medium truncate">{user?.email}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-accent hover:bg-accent/10 rounded-xl transition-all font-medium"
                    >
                        <LogOut size={20} />
                        Desconectar
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto relative">
                <header className="h-[64px] glass border-b border-white/5 flex items-center justify-between px-8 sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <Menu size={20} className="text-text-muted lg:hidden" />
                        <h2 className="text-lg font-semibold">LogiCore Business Cloud</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="bg-white/5 h-10 w-10 rounded-full flex items-center justify-center border border-white/10 uppercase font-bold text-primary">
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
