import { Sidebar } from "./sidebar";

interface DesktopLayoutProps {
    children: React.ReactNode;
}

export function DesktopLayout({ children }: DesktopLayoutProps) {
    return (
        <div className="min-h-screen">
            {/* Floating Glass Sidebar */}
            <Sidebar />

            {/* Main Content Area - offset for sidebar */}
            <main className="ml-28 p-8">
                {children}
            </main>
        </div>
    );
}
