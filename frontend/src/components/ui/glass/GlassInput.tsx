import React from "react";
import { cn } from "@/lib/utils";

interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
    className?: string;
    multiline?: boolean;
}

/**
 * GlassInput - Nebula Glass Design System
 * 
 * A transparent glass input/textarea with:
 * - rounded-xl (12px border radius)
 * - bg-white/5 (transparent background)
 * - backdrop-blur-xl (heavy blur)
 * - Purple glow on focus
 * - High contrast text
 */
export const GlassInput = React.forwardRef<HTMLInputElement | HTMLTextAreaElement, GlassInputProps>(
    ({ className, type = "text", multiline = false, ...props }, ref) => {
        const baseStyles = cn(
            // Base glass styling
            "relative w-full rounded-xl",
            "border border-white/10",
            "bg-white/5",
            "backdrop-blur-xl",
            "px-4 py-3",

            // Text styling
            "text-slate-200",
            "placeholder:text-slate-400",
            "font-medium",

            // Focus state - purple glow
            "focus:outline-none",
            "focus:border-neon-purple/50",
            "focus:bg-white/10",
            "focus:shadow-lg focus:shadow-neon-purple/30",
            "focus:ring-2 focus:ring-neon-purple/20",

            // Transitions
            "transition-all duration-200",

            // Disabled state
            "disabled:opacity-50",
            "disabled:cursor-not-allowed",

            className
        );

        if (multiline) {
            return (
                <textarea
                    className={baseStyles}
                    ref={ref as React.Ref<HTMLTextAreaElement>}
                    {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
                />
            );
        }

        return (
            <input
                type={type}
                className={baseStyles}
                ref={ref as React.Ref<HTMLInputElement>}
                {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
            />
        );
    }
);

GlassInput.displayName = "GlassInput";
