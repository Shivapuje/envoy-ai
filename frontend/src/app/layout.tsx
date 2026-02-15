import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClientProviders } from "@/components/layout/client-providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Envoy AI",
    description: "Your Personal Chief of Staff - A local, private AI Operating System for high-performance professionals",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <ClientProviders>{children}</ClientProviders>
            </body>
        </html>
    );
}

