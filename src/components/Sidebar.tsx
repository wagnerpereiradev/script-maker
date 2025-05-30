'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PenTool, FileText, Settings, Home, Sparkles, Layout, Users, Send, Mail } from 'lucide-react';

const navigation = [
    {
        name: 'Dashboard',
        href: '/',
        icon: Home,
    },
    {
        name: 'Criar Script',
        href: '/create',
        icon: PenTool,
    },
    {
        name: 'Meus Scripts',
        href: '/scripts',
        icon: FileText,
    },
    {
        name: 'Contatos',
        href: '/contacts',
        icon: Users,
    },
    {
        name: 'Modelos',
        href: '/templates',
        icon: Layout,
    },
    {
        name: 'Enviar Email',
        href: '/send-email',
        icon: Send,
    },
    {
        name: 'Emails Enviados',
        href: '/sent-emails',
        icon: Mail,
    },
    {
        name: 'Configurações',
        href: '/settings',
        icon: Settings,
    },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="fixed inset-y-0 left-0 z-50 w-64 bg-neutral-gradient border-r border-neutral-800">
            <div className="flex h-full flex-col">
                {/* Logo */}
                <div className="flex h-16 items-center px-6 border-b border-neutral-800">
                    <div className="flex items-center space-x-2">
                        <Sparkles className="h-8 w-8 text-white" />
                        <span className="text-xl font-bold text-white">Script Maker</span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1 px-3 py-6">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${isActive
                                    ? 'bg-white text-black shadow-sm'
                                    : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                                    }`}
                            >
                                <item.icon
                                    className={`mr-3 h-5 w-5 ${isActive ? 'text-black' : 'text-neutral-400 group-hover:text-white'
                                        }`}
                                />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="border-t border-neutral-800 p-4">
                    <div className="text-xs text-neutral-500">
                        Powered by <b><a href="https://wagnerai.me" target="_blank" rel="noopener noreferrer">WagnerAI</a></b>
                    </div>
                </div>
            </div>
        </div>
    );
} 