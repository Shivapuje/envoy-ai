'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DesktopLayout } from './desktop-layout';

export function ClientProviders({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <AuthGuard>
                <DesktopLayout>{children}</DesktopLayout>
            </AuthGuard>
        </AuthProvider>
    );
}
