import React from 'react';
import { cn } from '@/lib/utils';

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary';
    children: React.ReactNode;
}

export const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
    ({ className, variant = 'primary', children, disabled, ...props }, ref) => {
        return (
            <button
                ref={ref}
                disabled={disabled}
                className={cn(
                    'px-4 py-2 rounded-lg font-medium transition-all duration-200',
                    'backdrop-blur-sm border',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    variant === 'primary' && [
                        'bg-gradient-to-r from-purple-500/20 to-pink-500/20',
                        'border-purple-500/30',
                        'text-white',
                        'hover:from-purple-500/30 hover:to-pink-500/30',
                        'hover:border-purple-400/50',
                        'hover:shadow-lg hover:shadow-purple-500/20',
                    ],
                    variant === 'secondary' && [
                        'bg-white/5',
                        'border-white/10',
                        'text-slate-300',
                        'hover:bg-white/10',
                        'hover:border-white/20',
                        'hover:text-white',
                    ],
                    className
                )}
                {...props}
            >
                {children}
            </button>
        );
    }
);

GlassButton.displayName = 'GlassButton';
