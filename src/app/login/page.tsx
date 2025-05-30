'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, LogIn, Loader2, Sparkles } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
        // Limpar erro quando usuário começar a digitar
        if (error) setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                // Login bem-sucedido, redirecionar para dashboard
                router.push('/');
                router.refresh();
            } else {
                setError(data.error || 'Erro no login');
            }
        } catch (error) {
            console.error('Erro no login:', error);
            setError('Erro de conexão. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <div className="mx-auto w-20 h-20 bg-neutral-gradient rounded-2xl flex items-center justify-center mb-6 border border-neutral-800 shadow-2xl">
                        <Sparkles className="h-10 w-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-3">Script Maker</h1>
                    <p className="text-neutral-400 text-lg">Faça login para continuar</p>
                </div>

                {/* Formulário de Login */}
                <div className="bg-neutral-gradient rounded-2xl p-8 border border-neutral-800 shadow-2xl backdrop-blur-sm">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-neutral-300 mb-3">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="w-full pl-12 pr-4 py-4 bg-black/50 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-white focus:ring-2 focus:ring-white/20 transition-all duration-200"
                                    placeholder="seu@email.com"
                                />
                            </div>
                        </div>

                        {/* Senha */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-semibold text-neutral-300 mb-3">
                                Senha
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    required
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className="w-full pl-12 pr-14 py-4 bg-black/50 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-white focus:ring-2 focus:ring-white/20 transition-all duration-200"
                                    placeholder="Sua senha"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Mensagem de Erro */}
                        {error && (
                            <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-4">
                                <p className="text-red-300 text-sm font-medium">{error}</p>
                            </div>
                        )}

                        {/* Botão de Login */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-white hover:bg-neutral-100 disabled:bg-neutral-600 text-black font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Entrando...
                                </>
                            ) : (
                                <>
                                    <LogIn className="h-5 w-5" />
                                    Entrar
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <div className="text-center mt-8">
                    <p className="text-neutral-500 text-sm">
                        © 2025 Script Maker. Todos os direitos reservados.
                    </p>
                    <p className="text-neutral-600 text-xs mt-2">
                        Powered by <strong>WagnerAI</strong>
                    </p>
                </div>
            </div>
        </div>
    );
} 