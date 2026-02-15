'use client';

import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const PUBLIC_ROUTES = ['/login', '/register'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

    useEffect(() => {
        if (!isLoading && !isAuthenticated && !isPublicRoute) {
            router.push('/login');
        }
        if (!isLoading && isAuthenticated && isPublicRoute) {
            router.push('/');
        }
    }, [isAuthenticated, isLoading, isPublicRoute, router]);

    // Show loading spinner while checking auth
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f0716] via-[#1a0b2e] to-[#0f0716]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                    <p className="text-slate-400 text-sm">Loading...</p>
                </div>
            </div>
        );
    }

    // Public route - render without sidebar
    if (isPublicRoute) {
        return <>{children}</>;
    }

    // Not authenticated on protected route - show nothing (redirect will happen)
    if (!isAuthenticated) {
        return null;
    }

    // Authenticated - render children
    return <>{children}</>;
}
