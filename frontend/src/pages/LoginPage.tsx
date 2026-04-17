import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { Navigation, Loader2 } from 'lucide-react';

const LoginPage: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [companySlug, setCompanySlug] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { login: saveAuth } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (isLogin) {
                const data = await authApi.login({ email, password });
                saveAuth(data.access_token, {
                    id: data.user_id,
                    tenant_id: data.tenant_id,
                    role: data.role,
                    email: email
                });
            } else {
                const data = await authApi.register({
                    company_name: companyName,
                    company_slug: companySlug,
                    admin_email: email,
                    admin_password: password,
                    admin_full_name: fullName
                });
                saveAuth(data.access_token, {
                    id: data.user_id,
                    tenant_id: data.tenant_id,
                    role: data.role,
                    email: email
                });
            }
            navigate('/');
        } catch (err: any) {
            const detail = err.response?.data?.detail;
            if (typeof detail === 'string') {
                setError(detail);
            } else if (Array.isArray(detail)) {
                setError(detail[0]?.msg || 'Error de validación en los datos.');
            } else if (detail && typeof detail === 'object') {
                setError(detail.message || JSON.stringify(detail));
            } else {
                setError('Algo salió mal. Inténtalo de nuevo.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-bg-darker flex items-center justify-center p-6 relative overflow-hidden">
            {/* High-end decorative elements */}
            <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/10 blur-[150px] rounded-full pointer-events-none animate-pulse duration-[10s]"></div>
            <div className="fixed bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-accent/5 blur-[150px] rounded-full pointer-events-none animate-pulse duration-[15s]"></div>
            <div className="fixed top-[20%] right-[20%] w-[30%] h-[30%] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none"></div>

            <div className="w-full max-w-lg animate-in fade-in zoom-in slide-in-from-bottom-10 duration-1000">
                <div className="glass p-12 rounded-[40px] shadow-2xl relative z-10 border border-white/5 backdrop-blur-[20px]">
                    <div className="flex flex-col items-center mb-12">
                        <div className="bg-gradient-to-br from-primary to-primary-hover p-5 rounded-3xl mb-6 shadow-2xl shadow-primary/40 group hover:rotate-12 transition-transform duration-500">
                            <Navigation size={40} className="text-white" />
                        </div>
                        <h1 className="text-5xl font-black tracking-tighter text-white mb-2">LogiCore</h1>
                        <div className="flex items-center gap-2">
                            <div className="h-1 w-8 bg-primary rounded-full"></div>
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.4em]">Intelligence Ops</p>
                            <div className="h-1 w-8 bg-primary rounded-full"></div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {!isLogin && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-left duration-500">
                                <div className="md:col-span-2">
                                    <input
                                        type="text"
                                        placeholder="Nombre de la Empresa"
                                        className="input h-14"
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        required
                                    />
                                </div>
                                <input
                                    type="text"
                                    placeholder="URL personalizada"
                                    className="input h-14"
                                    value={companySlug}
                                    onChange={(e) => setCompanySlug(e.target.value)}
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="Nombre Completo"
                                    className="input h-14"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                />
                            </div>
                        )}
                        <input
                            type="email"
                            placeholder="Corporative Email"
                            className="input h-14"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            className="input h-14"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />

                        {error && (
                            <div className="p-4 bg-accent/10 border border-accent/20 rounded-2xl animate-in shake duration-300">
                                <p className="text-accent text-[11px] font-bold text-center uppercase tracking-wider">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary w-full h-16 py-4 text-[13px] font-black uppercase tracking-[0.2em] mt-8 flex justify-center items-center rounded-2xl shadow-2xl shadow-primary/30 active:scale-95 transition-all"
                        >
                            {loading ? <Loader2 className="animate-spin" size={24} /> : (isLogin ? 'Access System' : 'Provision Account')}
                        </button>
                    </form>

                    <div className="mt-10 text-center">
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="group text-text-muted hover:text-white transition-all text-xs font-bold uppercase tracking-widest"
                        >
                            {isLogin ? (
                                <span>No tienes cuenta? <span className="text-primary group-hover:underline">Provisionar</span></span>
                            ) : (
                                <span>Ya tienes cuenta? <span className="text-primary group-hover:underline">Validar</span></span>
                            )}
                        </button>
                    </div>
                </div>

                <p className="text-center text-[10px] text-slate-600 font-bold uppercase tracking-[0.5em] mt-8">
                    &copy; 2026 LOGICORE GLOBAL LOGISTICS SYSTEMS &bull; SECURE NODE
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
