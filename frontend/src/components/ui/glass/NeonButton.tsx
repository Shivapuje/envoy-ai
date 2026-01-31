import React from "react";
import { cn } from "@/lib/utils";

interface NeonButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: "primary" | "secondary";
    className?: string;
}

/**
 * NeonButton - Nebula Glass Design System
 * 
 * A glowing neon button with:
 * - rounded-xl (12px border radius)
 * - Neon purple glow shadow
 * - Primary/Secondary variants
 * - Interactive hover effects
 */
export function NeonButton({
    children,
    variant = "primary",
    className,
    disabled,
    ...props
}: NeonButtonProps) {
    const variants = {
        primary: [
            // Base - Minimal Glass style
            "bg-white/10",
            "text-white",
            "border border-purple-500/30",
            "shadow-sm shadow-purple-500/10",

            // Hover - subtle enhancement
            "hover:bg-white/15",
            "hover:border-purple-500/40",
            "hover:shadow-md hover:shadow-purple-500/20",
            "hover:scale-[1.02]",

            // Active
            "active:scale-[0.98]",
        ],
        secondary: [
            // Base - glass style
            "bg-white/5",
            "text-slate-200",
            "border border-white/10",
            "backdrop-blur-xl",
            "shadow-md shadow-purple-500/10",

            // Hover
            "hover:bg-white/10",
            "hover:border-white/20",
            "hover:shadow-lg hover:shadow-purple-500/20",
            "hover:scale-[1.02]",

            // Active
            "active:scale-[0.98]",
        ],
    };


    return (
        <button
            className={cn(
                // Base styling
                "relative overflow-hidden rounded-xl",
                "px-4 py-2",
                "text-sm font-medium",
                "transition-all duration-200",

                // Disabled state
                disabled && [
                    "opacity-50",
                    "cursor-not-allowed",
                    "hover:scale-100",
                ],

                // Variant styles
                !disabled && variants[variant],

                className
            )}
            disabled={disabled}
            {...props}
        >
            {children}
        </button>
    );
}
