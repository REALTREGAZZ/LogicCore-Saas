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
                // Si es un error de validación de FastAPI (Pydantic), tomamos el primer mensaje
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
        <div className="min-h-screen bg-bg-darker flex items-center justify-center p-4">
            {/* Background blobs */}
            <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 blur-[120px] rounded-full pointer-events-none"></div>

            <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
                <div className="glass p-10 rounded-3xl shadow-2xl relative z-10 transition-all">
                    <div className="flex flex-col items-center mb-10">
                        <div className="bg-primary p-4 rounded-2xl mb-4 shadow-xl shadow-primary/30">
                            <Navigation size={32} />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-white">LogiCore</h1>
                        <p className="text-text-muted mt-2">Plataforma de logística avanzada</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <>
                                <input
                                    type="text"
                                    placeholder="Nombre de la Empresa"
                                    className="input"
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="URL personalizada (slug)"
                                    className="input"
                                    value={companySlug}
                                    onChange={(e) => setCompanySlug(e.target.value)}
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="Nombre Completo"
                                    className="input"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                />
                            </>
                        )}
                        <input
                            type="email"
                            placeholder="Email"
                            className="input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <input
                            type="password"
                            placeholder="Contraseña"
                            className="input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />

                        {error && <p className="text-accent text-sm text-center">{error}</p>}

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary w-full py-4 text-lg mt-6 flex justify-center items-center"
                        >
                            {loading ? <Loader2 className="animate-spin" size={24} /> : (isLogin ? 'Iniciar Sesión' : 'Crear Cuenta')}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-text-muted hover:text-white transition-colors text-sm font-medium"
                        >
                            {isLogin ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
