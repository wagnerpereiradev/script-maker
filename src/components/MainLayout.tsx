import Sidebar from './Sidebar';

interface MainLayoutProps {
    children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
    return (
        <div className="min-h-screen bg-background-primary">
            <Sidebar />
            <div className="pl-64">
                <main className="min-h-screen">
                    {children}
                </main>
            </div>
        </div>
    );
} 