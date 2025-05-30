'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User, Settings, Shield, ChevronDown } from 'lucide-react';

interface AuthUser {
    id: string;
    email: string;
    name: string;
    role: 'USER' | 'ADMIN';
}

export default function AuthHeader() {
    const router = useRouter();
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const response = await fetch('/api/auth/me');
            if (response.ok) {
                const data = await response.json();
                setUser(data.user);
            }
        } catch (error) {
            console.error('Erro ao verificar autenticação:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/login');
            router.refresh();
        } catch (error) {
            console.error('Erro no logout:', error);
        }
    };

    if (loading) {
        return (
            <header className="bg-black/95 backdrop-blur-sm border-b border-neutral-800 ml-64 sticky top-0 z-40">
                <div className="px-6 lg:px-8">
                    <div className="flex justify-end items-center h-16">
                        <div className="w-10 h-10 bg-neutral-700 rounded-full animate-pulse"></div>
                    </div>
                </div>
            </header>
        );
    }

    if (!user) return null;

    return (
        <header className="bg-black/95 backdrop-blur-sm border-b border-neutral-800 ml-64 sticky top-0 z-40">
            <div className="px-6 lg:px-8">
                <div className="flex justify-end items-center h-16">
                    {/* Menu do Usuário */}
                    <div className="relative">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="flex items-center gap-3 bg-neutral-900/80 hover:bg-neutral-800 px-4 py-2.5 rounded-xl border border-neutral-700 hover:border-neutral-600 transition-all duration-200 group"
                        >
                            <div className="w-9 h-9 bg-gradient-to-br from-white via-neutral-100 to-neutral-200 rounded-xl flex items-center justify-center shadow-lg">
                                <User className="h-5 w-5 text-black" />
                            </div>
                            <div className="text-left hidden sm:block">
                                <p className="text-sm font-semibold text-white group-hover:text-neutral-100">{user.name}</p>
                                <div className="flex items-center gap-1.5">
                                    {user.role === 'ADMIN' && <Shield className="h-3 w-3 text-blue-400" />}
                                    <span className="text-xs text-neutral-400 font-medium">
                                        {user.role === 'ADMIN' ? 'Administrador' : 'Usuário'}
                                    </span>
                                </div>
                            </div>
                            <ChevronDown className={`h-4 w-4 text-neutral-400 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Menu Dropdown */}
                        {isMenuOpen && (
                            <div className="absolute right-0 mt-3 w-80 bg-black border border-neutral-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
                                {/* Header do Menu */}
                                <div className="p-6 border-b border-neutral-800">
                                    <div className="flex items-start gap-4">
                                        <div className="w-14 h-14 bg-gradient-to-br from-white via-neutral-100 to-neutral-200 rounded-2xl flex items-center justify-center shadow-lg">
                                            <User className="h-7 w-7 text-black" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-white text-lg truncate mb-1">{user.name}</h3>
                                            <p className="text-sm text-neutral-400 truncate mb-2">{user.email}</p>
                                            <div className="flex items-center gap-2">
                                                {user.role === 'ADMIN' && (
                                                    <div className="flex items-center gap-1.5 bg-blue-500/20 px-2.5 py-1 rounded-lg">
                                                        <Shield className="h-3.5 w-3.5 text-blue-400" />
                                                        <span className="text-xs text-blue-300 font-semibold">
                                                            Administrador
                                                        </span>
                                                    </div>
                                                )}
                                                {user.role === 'USER' && (
                                                    <div className="flex items-center gap-1.5 bg-neutral-700/50 px-2.5 py-1 rounded-lg">
                                                        <User className="h-3.5 w-3.5 text-neutral-400" />
                                                        <span className="text-xs text-neutral-300 font-semibold">
                                                            Usuário
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Opções do Menu */}
                                <div className="p-3">
                                    <button
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            router.push('/settings');
                                        }}
                                        className="w-full text-left px-4 py-3.5 text-sm text-neutral-300 hover:bg-neutral-900 hover:text-white rounded-xl flex items-center gap-3 transition-all duration-200 group"
                                    >
                                        <div className="w-10 h-10 bg-neutral-800 group-hover:bg-neutral-700 rounded-xl flex items-center justify-center transition-colors">
                                            <Settings className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <span className="font-semibold block">Configurações</span>
                                            <span className="text-xs text-neutral-500">SMTP e preferências</span>
                                        </div>
                                    </button>

                                    <div className="my-3 border-t border-neutral-800"></div>

                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-3.5 text-sm text-red-400 hover:bg-red-900/30 hover:text-red-300 rounded-xl flex items-center gap-3 transition-all duration-200 group"
                                    >
                                        <div className="w-10 h-10 bg-red-900/30 group-hover:bg-red-900/50 rounded-xl flex items-center justify-center transition-colors">
                                            <LogOut className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <span className="font-semibold block">Sair da Conta</span>
                                            <span className="text-xs text-red-500/70">Fazer logout do sistema</span>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Backdrop para fechar menu */}
            {isMenuOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsMenuOpen(false)}
                />
            )}
        </header>
    );
} 