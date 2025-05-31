'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PenTool, FileText, Settings, Home, Sparkles, Layout, Users, Send, Mail, X } from 'lucide-react';

const navigationGroups = [
    {
        name: 'Principal',
        items: [
            {
                name: 'Dashboard',
                href: '/',
                icon: Home,
                description: 'Visão geral'
            },
            {
                name: 'Criar Script',
                href: '/create',
                icon: PenTool,
                description: 'Gerar emails com IA'
            }
        ]
    },
    {
        name: 'Gestão',
        items: [
            {
                name: 'Meus Scripts',
                href: '/scripts',
                icon: FileText,
                description: 'Scripts salvos'
            },
            {
                name: 'Contatos',
                href: '/contacts',
                icon: Users,
                description: 'Base de prospects'
            },
            {
                name: 'Modelos',
                href: '/templates',
                icon: Layout,
                description: 'Templates de email'
            }
        ]
    },
    {
        name: 'Email Marketing',
        items: [
            {
                name: 'Enviar Email',
                href: '/send-email',
                icon: Send,
                description: 'Campanha de email'
            },
            {
                name: 'Emails Enviados',
                href: '/sent-emails',
                icon: Mail,
                description: 'Histórico e métricas'
            }
        ]
    },
    {
        name: 'Sistema',
        items: [
            {
                name: 'Configurações',
                href: '/settings',
                icon: Settings,
                description: 'SMTP e preferências'
            }
        ]
    }
];

interface SidebarProps {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

export default function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
    const pathname = usePathname();

    const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
        <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex h-16 items-center justify-between px-6 border-b border-neutral-800/50">
                <div className="flex items-center space-x-3">
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur-sm opacity-75"></div>
                        <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                            <Sparkles className="h-6 w-6 text-white" />
                        </div>
                    </div>
                    <div>
                        <span className="text-lg font-bold text-white">Script Maker</span>
                        <p className="text-xs text-neutral-400 -mt-0.5">by WagnerAI</p>
                    </div>
                </div>
                {isMobile && (
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800/50 transition-all duration-200"
                    >
                        <X className="h-5 w-5" />
                    </button>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto">
                {navigationGroups.map((group) => (
                    <div key={group.name}>
                        <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3 px-3">
                            {group.name}
                        </h3>
                        <div className="space-y-1">
                            {group.items.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={isMobile ? () => setSidebarOpen(false) : undefined}
                                        className={`group relative flex items-center rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 ${isActive
                                                ? 'bg-white text-black shadow-lg shadow-white/10'
                                                : 'text-neutral-300 hover:bg-neutral-800/50 hover:text-white'
                                            }`}
                                    >
                                        {isActive && (
                                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-xl"></div>
                                        )}
                                        <div className={`relative flex items-center justify-center w-10 h-10 rounded-lg mr-3 transition-all duration-200 ${isActive
                                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                                                : 'bg-neutral-800/50 text-neutral-400 group-hover:bg-neutral-700 group-hover:text-white'
                                            }`}>
                                            <item.icon className="h-5 w-5" />
                                        </div>
                                        <div className="relative flex-1 min-w-0">
                                            <div className="font-semibold truncate">{item.name}</div>
                                            <div className={`text-xs truncate transition-colors duration-200 ${isActive ? 'text-neutral-600' : 'text-neutral-500 group-hover:text-neutral-400'
                                                }`}>
                                                {item.description}
                                            </div>
                                        </div>
                                        {isActive && (
                                            <div className="absolute right-3 w-2 h-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></div>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Footer */}
            <div className="border-t border-neutral-800/50 p-4 mx-4 mb-4">
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-neutral-900/50 to-neutral-800/50 rounded-lg">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-white">Powered by</div>
                        <a
                            href="https://wagnerai.me"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium"
                        >
                            WagnerAI Technology
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* Sidebar Desktop */}
            <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-72 lg:bg-black/90 lg:backdrop-blur-xl lg:border-r lg:border-neutral-800/50">
                <SidebarContent />
            </div>

            {/* Sidebar Mobile */}
            <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-black/95 backdrop-blur-xl border-r border-neutral-800/50 transform transition-transform duration-300 ease-in-out lg:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}>
                <SidebarContent isMobile={true} />
            </div>
        </>
    );
} 