import React from 'react';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
    className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
    const variants = {
        default: 'bg-primary text-primary-foreground',
        secondary: 'bg-secondary text-secondary-foreground',
        destructive: 'bg-destructive text-destructive-foreground',
        outline: 'border border-input bg-transparent',
        success: 'bg-green-500 text-white',
        warning: 'bg-yellow-500 text-white',
    };

    return (
        <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${variants[variant]} ${className}`}>
            {children}
        </div>
    );
}