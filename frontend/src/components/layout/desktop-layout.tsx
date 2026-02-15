"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";

const PUBLIC_ROUTES = ["/login", "/register"];

interface DesktopLayoutProps {
    children: React.ReactNode;
}

export function DesktopLayout({ children }: DesktopLayoutProps) {
    const pathname = usePathname();
    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

    if (isPublicRoute) {
        return <>{children}</>;
    }

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

