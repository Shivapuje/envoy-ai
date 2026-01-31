import React from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
}

/**
 * GlassCard - Nebula Glass Design System
 * 
 * A premium glass container with:
 * - rounded-3xl (24px border radius)
 * - backdrop-blur-xl (heavy blur)
 * - border-white/10 (subtle border)
 * - Hover glow effect
 */
export function GlassCard({
    children,
    className,
    hover = true,
    ...props
}: GlassCardProps) {
    return (
        <div
            className={cn(
                // Base glass styling
                "relative overflow-hidden rounded-3xl",
                "border border-white/10",
                "bg-white/5",
                "backdrop-blur-xl",
                "p-6",

                // Transitions
                "transition-all duration-300",

                // Hover effects (optional)
                hover && [
                    "hover:bg-white/10",
                    "hover:shadow-2xl hover:shadow-purple-500/10",
                    "hover:border-white/20",
                ],

                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
