import Sidebar from './Sidebar';
import AuthHeader from './AuthHeader';

interface MainLayoutProps {
    children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
    return (
        <div className="min-h-screen bg-background-primary">
            <Sidebar />
            <AuthHeader />
            <div className="ml-64">
                <main className="pt-16 min-h-screen">
                    {children}
                </main>
            </div>
        </div>
    );
} 