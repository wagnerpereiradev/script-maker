'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import AuthHeader from './AuthHeader';

interface MainLayoutProps {
    children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-background-primary">
            <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <AuthHeader setSidebarOpen={setSidebarOpen} />

            {/* Backdrop para mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Conteúdo principal */}
            <div className="lg:ml-72">
                <main className="pt-16 min-h-screen">
                    {children}
                </main>
            </div>
        </div>
    );
} 