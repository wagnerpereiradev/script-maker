'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User, Settings, Shield, ChevronDown, Menu, Bell, Search } from 'lucide-react';

interface AuthUser {
    id: string;
    email: string;
    name: string;
    role: 'USER' | 'ADMIN';
}

interface AuthHeaderProps {
    setSidebarOpen: (open: boolean) => void;
}

export default function AuthHeader({ setSidebarOpen }: AuthHeaderProps) {
    const router = useRouter();
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        checkAuth();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };

        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMenuOpen]);

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

    const getUserInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .slice(0, 2)
            .toUpperCase();
    };

    if (loading) {
        return (
            <header className="bg-black/95 backdrop-blur-xl border-b border-neutral-800/50 lg:ml-72 sticky top-0 z-40">
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between lg:justify-end items-center h-16">
                        {/* Skeleton mobile button */}
                        <div className="lg:hidden w-10 h-10 bg-neutral-800/50 rounded-xl animate-pulse"></div>

                        {/* Skeleton user menu */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-neutral-800/50 rounded-xl animate-pulse"></div>
                            <div className="hidden sm:block">
                                <div className="w-24 h-4 bg-neutral-800/50 rounded animate-pulse mb-1"></div>
                                <div className="w-16 h-3 bg-neutral-800/50 rounded animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
        );
    }

    if (!user) return null;

    return (
        <header className="bg-black/95 backdrop-blur-xl border-b border-neutral-800/50 lg:ml-72 sticky top-0 z-40">
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between lg:justify-end items-center h-16">
                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden p-2.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800/50 transition-all duration-200 group cursor-pointer"
                    >
                        <Menu className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                    </button>

                    {/* Right Side - Actions */}
                    <div className="flex items-center gap-3">
                        {/* Search Button - Desktop only */}
                        <button className="hidden lg:flex items-center justify-center w-10 h-10 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800/50 transition-all duration-200 group cursor-pointer">
                            <Search className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                        </button>

                        {/* Notifications Button */}
                        <button className="relative flex items-center justify-center w-10 h-10 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800/50 transition-all duration-200 group cursor-pointer">
                            <Bell className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-black"></div>
                        </button>

                        {/* User Menu */}
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="flex items-center gap-3 bg-neutral-900/50 hover:bg-neutral-800/50 px-3 sm:px-4 py-2 rounded-xl border border-neutral-700/50 hover:border-neutral-600/50 transition-all duration-200 group cursor-pointer"
                            >
                                {/* Avatar */}
                                <div className="relative">
                                    <div className="w-9 h-9 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg">
                                        <span className="text-sm font-bold text-white">
                                            {getUserInitials(user.name)}
                                        </span>
                                    </div>
                                    {user.role === 'ADMIN' && (
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full border-2 border-black flex items-center justify-center">
                                            <Shield className="h-2.5 w-2.5 text-black" />
                                        </div>
                                    )}
                                </div>

                                {/* User Info - Hidden on mobile */}
                                <div className="text-left hidden sm:block">
                                    <p className="text-sm font-semibold text-white group-hover:text-neutral-100 truncate max-w-32">
                                        {user.name}
                                    </p>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs text-neutral-400 font-medium">
                                            {user.role === 'ADMIN' ? 'Admin' : 'Usuário'}
                                        </span>
                                    </div>
                                </div>

                                {/* Dropdown Arrow */}
                                <ChevronDown className={`h-4 w-4 text-neutral-400 transition-all duration-200 ${isMenuOpen ? 'rotate-180 text-white' : 'group-hover:text-white'
                                    }`} />
                            </button>

                            {/* Dropdown Menu */}
                            {isMenuOpen && (
                                <>
                                    {/* Backdrop com blur */}
                                    <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setIsMenuOpen(false)} />

                                    {/* Menu */}
                                    <div className="absolute right-0 mt-3 w-80 bg-black border border-neutral-700/50 rounded-2xl shadow-2xl shadow-black/50 z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                                        {/* User Profile Header */}
                                        <div className="p-6 border-b border-neutral-800/50 bg-gradient-to-r from-neutral-900/30 to-neutral-800/30">
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    <div className="w-16 h-16 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 rounded-2xl flex items-center justify-center shadow-xl">
                                                        <span className="text-xl font-bold text-white">
                                                            {getUserInitials(user.name)}
                                                        </span>
                                                    </div>
                                                    {user.role === 'ADMIN' && (
                                                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full border-3 border-black flex items-center justify-center">
                                                            <Shield className="h-3.5 w-3.5 text-black" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-white text-lg truncate">{user.name}</h3>
                                                    <p className="text-sm text-neutral-400 truncate mb-2">{user.email}</p>
                                                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold ${user.role === 'ADMIN'
                                                        ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                                                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                                        }`}>
                                                        {user.role === 'ADMIN' ? (
                                                            <>
                                                                <Shield className="h-3 w-3" />
                                                                Administrador
                                                            </>
                                                        ) : (
                                                            <>
                                                                <User className="h-3 w-3" />
                                                                Usuário
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Menu Actions */}
                                        <div className="p-3 space-y-1">
                                            <button
                                                onClick={() => {
                                                    setIsMenuOpen(false);
                                                    router.push('/settings');
                                                }}
                                                className="w-full text-left px-4 py-3.5 text-sm text-neutral-300 hover:bg-neutral-800/50 hover:text-white rounded-xl flex items-center gap-3 transition-all duration-200 group cursor-pointer"
                                            >
                                                <div className="w-10 h-10 bg-neutral-800/50 group-hover:bg-blue-600/20 rounded-xl flex items-center justify-center transition-all duration-200">
                                                    <Settings className="h-5 w-5 group-hover:text-blue-400 transition-colors duration-200" />
                                                </div>
                                                <div>
                                                    <span className="font-semibold block">Configurações</span>
                                                    <span className="text-xs text-neutral-500">SMTP e preferências</span>
                                                </div>
                                            </button>

                                            <div className="my-2 border-t border-neutral-800/50"></div>

                                            <button
                                                onClick={handleLogout}
                                                className="w-full text-left px-4 py-3.5 text-sm text-red-400 hover:bg-red-900/30 hover:text-red-300 rounded-xl flex items-center gap-3 transition-all duration-200 group cursor-pointer"
                                            >
                                                <div className="w-10 h-10 bg-red-900/30 group-hover:bg-red-900/50 rounded-xl flex items-center justify-center transition-all duration-200">
                                                    <LogOut className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <span className="font-semibold block">Sair da Conta</span>
                                                    <span className="text-xs text-red-500/70">Encerrar sessão</span>
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
} 